import Pusher from 'pusher-js';
import type { MpState, MpMessage, MpMessageType } from './types';

export class PusherManager {
  private pusher: Pusher | null = null;
  private channel: any = null; // Pusher Channel instance
  
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
      authEndpoint: '/api/pusher-auth',
    });

    return this.peerId;
  }

  public subscribeToState(callback: (state: MpState) => void) {
    this.onStateChangeCallback = callback;
  }

  public subscribeToMessages(callback: (msg: MpMessage) => void) {
    this.onMessageCallback = callback;
  }

  // HOST: Start hosting a lobby (subscribe to presence channel)
  public startHosting(roomId: string, state: MpState) {
    this.isHost = true;
    this.roomId = roomId;

    if (!this.pusher) return;

    // Clean subscribe to channel
    const channelName = `presence-160p-${roomId}`;
    this.channel = this.pusher.subscribe(channelName, {
      auth: {
        params: {
          name: this.userName
        }
      }
    });

    this.channel.bind('pusher:subscription_succeeded', () => {
      console.log('Host successfully created and subscribed to Pusher channel:', channelName);
    });

    this.channel.bind('client-game-msg', (data: MpMessage) => {
      console.log('Host received client event:', data.type, 'from:', data.senderPeerId);
      this.onMessageCallback(data);
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
      this.channel = this.pusher!.subscribe(channelName, {
        auth: {
          params: {
            name: this.userName
          }
        }
      });

      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log('Client connected to Pusher channel successfully:', channelName);
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
        this.onMessageCallback(data);
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
    const msg: MpMessage = {
      type,
      senderPeerId: this.peerId,
      senderName: senderName || this.userName,
      payload
    };

    if (this.channel) {
      // In Pusher, client events must start with 'client-'
      // When triggering, all other subscribers receive this event (not the sender)
      if (this.isHost && (type === 'LOBBY_UPDATE' || type === 'DRAFT_UPDATE')) {
        // Host overrides isHost for the client to be false
        const msgForClients = {
          ...msg,
          payload: { ...payload, isHost: false }
        };
        this.channel.trigger('client-game-msg', msgForClients);
      } else {
        this.channel.trigger('client-game-msg', msg);
      }
    } else {
      console.warn('Cannot send: Channel is not active');
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
  }
}
