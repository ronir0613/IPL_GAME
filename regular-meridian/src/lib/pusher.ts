import Pusher from 'pusher-js';
import type { MpState } from './types';
import type { MpMessage, MpMessageType } from './multiplayer';

export class PusherManager {
  private pusher: Pusher | null = null;
  private channel: any = null; // Pusher Channel instance
  private chunkStore: Record<string, { chunks: string[]; total: number; timestamp: number }> = {};
  
  public isHost: boolean = false;
  public peerId: string = '';
  public roomId: string = '';
  public userName: string = '';
  
  private onStateChangeCallback: (state: MpState) => void = () => {};
  private onMessageCallback: (msg: MpMessage) => void = () => {};

  constructor() {}

  // Initialize Pusher Client
  public async init(customPeerId?: string, userName: string = ''): Promise<string> {
    if (typeof window === 'undefined') return '';

    // Generate a unique client peer ID or reuse customized ID
    this.peerId = customPeerId || `client-${Math.random().toString(36).substring(2, 11)}`;
    this.userName = userName;

    // Initialize Pusher client pointing to our Cloudflare auth endpoint
    this.pusher = new Pusher('92d0689e4c171f0709c0', {
      cluster: 'ap2',
      channelAuthorization: {
        endpoint: '/api/pusher-auth',
        transport: 'ajax',
        params: {
          name: this.userName,
          peerId: this.peerId,
        },
      },
    });

    return this.peerId;
  }

  public subscribeToState(callback: (state: MpState) => void) {
    this.onStateChangeCallback = callback;
  }

  public subscribeToMessages(callback: (msg: MpMessage) => void) {
    this.onMessageCallback = callback;
  }

  // Handle incoming events and reconstruct chunked messages if necessary
  private handleIncomingEvent(data: MpMessage) {
    if (data.type === 'CHUNK') {
      const { chunkId, index, total, data: chunkData } = data.payload;
      
      if (!this.chunkStore[chunkId]) {
        this.chunkStore[chunkId] = {
          chunks: new Array(total),
          total,
          timestamp: Date.now()
        };
      }
      
      this.chunkStore[chunkId].chunks[index] = chunkData;
      
      // Clean up old chunks (older than 30s) to prevent memory leaks
      const now = Date.now();
      for (const id in this.chunkStore) {
        if (now - this.chunkStore[id].timestamp > 30000) {
          delete this.chunkStore[id];
        }
      }
      
      // Check if all chunks received
      const store = this.chunkStore[chunkId];
      let complete = true;
      for (let i = 0; i < store.total; i++) {
        if (store.chunks[i] === undefined) {
          complete = false;
          break;
        }
      }
      
      if (complete) {
        try {
          const assembledString = store.chunks.join('');
          const assembledMsg = JSON.parse(assembledString) as MpMessage;
          delete this.chunkStore[chunkId];
          console.log(`Reassembled chunked message of type ${assembledMsg.type} from ${assembledMsg.senderPeerId}`);
          this.onMessageCallback(assembledMsg);
        } catch (e) {
          console.error('Failed to parse reassembled chunked message:', e);
          delete this.chunkStore[chunkId];
        }
      }
    } else {
      this.onMessageCallback(data);
    }
  }

  // HOST: Start hosting a lobby (subscribe to presence channel)
  public startHosting(roomId: string, state: MpState) {
    this.isHost = true;
    this.roomId = roomId;

    if (!this.pusher) return;

    // Clean subscribe to channel
    const channelName = `presence-160p-${roomId}`;
    this.channel = this.pusher.subscribe(channelName);

    this.channel.bind('pusher:subscription_succeeded', () => {
      console.log('Host successfully created and subscribed to Pusher channel:', channelName);
    });

    this.channel.bind('client-game-msg', (data: MpMessage) => {
      console.log('Host received client event:', data.type, 'from:', data.senderPeerId);
      this.handleIncomingEvent(data);
    });

    // Detect client disconnection automatically
    this.channel.bind('pusher:member_removed', (member: any) => {
      console.log('Pusher Member left:', member.id, member.info?.name);
      this.onMessageCallback({
        type: 'LEAVE_ROOM',
        senderPeerId: member.id,
        senderName: member.info?.name || '',
        payload: member.id
      });
    });
  }

  // CLIENT: Connect to a host (subscribe to presence channel)
  public joinRoom(hostRoomId: string): Promise<void> {
    this.isHost = false;
    this.roomId = hostRoomId;

    if (!this.pusher) return Promise.reject(new Error('Pusher not initialized'));

    return new Promise((resolve, reject) => {
      let resolvedOrRejected = false;

      // 12-second timeout
      const timeoutId = setTimeout(() => {
        if (!resolvedOrRejected) {
          resolvedOrRejected = true;
          this.disconnect();
          reject(new Error('Connection timed out. Check your internet or firewall settings.'));
        }
      }, 12000);

      // Subscribe to the channel. Note: hostRoomId has format "160p-CODE"
      const channelName = `presence-${hostRoomId}`;
      this.channel = this.pusher!.subscribe(channelName);

      this.channel.bind('pusher:subscription_succeeded', (members: any) => {
        console.log('Client connected to Pusher channel successfully:', channelName);
        
        // Verify if the host is in the presence channel members
        const hostExists = !!members.get(hostRoomId);
        if (!hostExists) {
          console.warn('Host is not present in this room:', hostRoomId);
          if (!resolvedOrRejected) {
            resolvedOrRejected = true;
            clearTimeout(timeoutId);
            this.disconnect();
            reject(new Error('Room not found or host is offline. Make sure the code is correct.'));
          }
          return;
        }

        if (!resolvedOrRejected) {
          resolvedOrRejected = true;
          clearTimeout(timeoutId);
          resolve();
        }
      });

      this.channel.bind('pusher:subscription_error', (status: any) => {
        console.error('Pusher connection error:', status);
        if (!resolvedOrRejected) {
          resolvedOrRejected = true;
          clearTimeout(timeoutId);
          this.disconnect();
          reject(new Error(`Failed to join room: ${status.message || 'Subscription error'}`));
        }
      });

      this.channel.bind('client-game-msg', (data: MpMessage) => {
        console.log('Client received event from Pusher:', data.type);
        this.handleIncomingEvent(data);
      });

      // Detect host disconnection
      this.channel.bind('pusher:member_removed', (member: any) => {
        // If the member that left matches the host's room ID
        if (member.id === hostRoomId || member.id.includes(this.roomId)) {
          console.log('Host disconnected from Pusher channel');
          this.onMessageCallback({
            type: 'LEAVE_ROOM',
            senderPeerId: hostRoomId,
            senderName: 'Host',
            payload: hostRoomId
          });
        }
      });
    });
  }

  // Broadcast message to all channel subscribers via client-events
  public send(type: MpMessageType, payload: any, senderName: string = '') {
    let msg: MpMessage = {
      type,
      senderPeerId: this.peerId,
      senderName: senderName || this.userName,
      payload
    };

    if (!this.channel) {
      console.warn('Cannot send: Channel is not active');
      return;
    }

    if (this.isHost && (type === 'LOBBY_UPDATE' || type === 'DRAFT_UPDATE')) {
      // Host overrides isHost for the client to be false
      msg.payload = { ...payload, isHost: false };
    }

    const msgString = JSON.stringify(msg);
    // Limit is 10 KB (10240 bytes). We chunk if the serialized string exceeds 8000 characters to be safe.
    const CHUNK_SIZE = 8000;

    if (msgString.length > CHUNK_SIZE) {
      const chunkId = `chk-${this.peerId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const total = Math.ceil(msgString.length / CHUNK_SIZE);
      console.log(`Payload size ${msgString.length} exceeds limit. Chunking into ${total} parts with ID: ${chunkId}`);
      
      const sendChunk = (i: number) => {
        if (i >= total) return;
        if (!this.channel) return;
        
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, msgString.length);
        const chunkData = msgString.substring(start, end);
        
        const chunkMsg = {
          type: 'CHUNK' as MpMessageType,
          senderPeerId: this.peerId,
          senderName: senderName || this.userName,
          payload: {
            chunkId,
            index: i,
            total,
            data: chunkData
          }
        };
        
        this.channel.trigger('client-game-msg', chunkMsg);
        
        if (i + 1 < total) {
          setTimeout(() => sendChunk(i + 1), 30);
        }
      };
      
      sendChunk(0);
    } else {
      this.channel.trigger('client-game-msg', msg);
    }
  }

  // Disconnect from channel and reset state
  public disconnect() {
    if (this.channel) {
      if (this.pusher) {
        this.pusher.unsubscribe(this.channel.name);
      }
      this.channel = null;
    }
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
    this.peerId = '';
    this.roomId = '';
    this.isHost = false;
    this.userName = '';
    this.chunkStore = {};
  }
}
