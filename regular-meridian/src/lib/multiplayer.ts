import type { Player, MpPlayer, MpSettings, MpState, MatchResult, MatchPrepConfig } from './types';

// Message schema for multiplayer actions
export type MpMessageType =
  | 'CLIENT_JOIN'
  | 'LOBBY_UPDATE'
  | 'START_DRAFT'
  | 'PICK_PLAYER'
  | 'DRAFT_UPDATE'
  | 'SUBMIT_TACTICS'
  | 'TACTICS_UPDATE'
  | 'SIMULATE_ROUND'
  | 'MATCH_RESULTS'
  | 'LEAVE_ROOM'
  | 'SELECT_FRANCHISE'
  | 'PLACE_BID'
  | 'FORCE_START_SEASON'
  | 'SKIP_PLAYER'
  | 'SEND_CHAT';

export interface MpMessage {
  type: MpMessageType;
  senderPeerId: string;
  senderName: string;
  payload: any;
}

// Generate a random room code (5 uppercase alphanumeric characters)
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omitted confusing chars like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class MultiplayerManager {
  private peer: any = null;
  private hostConnectionMap: Map<string, any> = new Map(); // peerId -> DataConnection
  private clientConnection: any = null; // DataConnection to host
  
  public isHost: boolean = false;
  public peerId: string = '';
  public roomId: string = '';
  
  private onStateChangeCallback: (state: MpState) => void = () => {};
  private onMessageCallback: (msg: MpMessage) => void = () => {};

  constructor() {}

  // Initialize PeerJS
  public async init(customPeerId?: string): Promise<string> {
    if (typeof window === 'undefined') return '';
    
    // Dynamically import peerjs to prevent SSR issues during build time
    const { Peer } = await import('peerjs');

    return new Promise((resolve, reject) => {
      // If we already have a peer running, destroy it first
      if (this.peer) {
        this.peer.destroy();
      }

      const peerOptions = {
        debug: 1, // Only print warnings and errors
        host: '0.peerjs.com',
        secure: true,
        port: 443,
        path: '/',
        key: 'peerjs',
        config: {
          iceServers: [
            // Public Google STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // Public Metered STUN Server
            { urls: 'stun:openrelay.metered.ca:80' },
            // Public Open Relay Project TURN servers (provides NAT traversal fallback)
            {
              urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:443',
                'turn:openrelay.metered.ca:443?transport=tcp'
              ],
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ]
        }
      };
      this.peer = customPeerId ? new Peer(customPeerId, peerOptions) : new Peer(peerOptions);

      this.peer.on('open', (id: string) => {
        this.peerId = id;
        resolve(id);
      });

      this.peer.on('disconnected', () => {
        console.log('PeerJS disconnected from signaling server. Reconnecting...');
        if (this.peer && !this.peer.destroyed) {
          this.peer.reconnect();
        }
      });

      this.peer.on('error', (err: any) => {
        console.error('PeerJS error:', err);
        reject(err);
      });

      this.peer.on('close', () => {
        console.log('PeerJS connection closed');
      });
    });
  }

  public subscribeToState(callback: (state: MpState) => void) {
    this.onStateChangeCallback = callback;
  }

  public subscribeToMessages(callback: (msg: MpMessage) => void) {
    this.onMessageCallback = callback;
  }

  // HOST: Start hosting a lobby
  public startHosting(roomId: string, state: MpState) {
    this.isHost = true;
    this.roomId = roomId;
    this.hostConnectionMap.clear();

    if (!this.peer) return;

    this.peer.on('connection', (conn: any) => {
      console.log('Host received client connection request:', conn.peer);
      
      conn.on('open', () => {
        this.hostConnectionMap.set(conn.peer, conn);
        
        // Send current lobby state as soon as connection is open
        conn.send({
          type: 'LOBBY_UPDATE',
          senderPeerId: this.peerId,
          senderName: 'Host',
          payload: { ...state, isHost: false }
        });
      });

      conn.on('data', (data: MpMessage) => {
        console.log('Host received data:', data.type, 'from:', data.senderPeerId);
        this.onMessageCallback(data);
      });

      conn.on('close', () => {
        console.log('Client disconnected:', conn.peer);
        this.hostConnectionMap.delete(conn.peer);
        this.onMessageCallback({
          type: 'LEAVE_ROOM',
          senderPeerId: conn.peer,
          senderName: '',
          payload: conn.peer
        });
      });

      conn.on('error', (err: any) => {
        console.error('Connection error for peer:', conn.peer, err);
        this.hostConnectionMap.delete(conn.peer);
      });
    });
  }

  // CLIENT: Connect to a host
  public joinRoom(hostRoomId: string): Promise<void> {
    this.isHost = false;
    this.roomId = hostRoomId;

    if (!this.peer) return Promise.reject(new Error('Peer not initialized'));

    return new Promise((resolve, reject) => {
      let resolvedOrRejected = false;

      // Timeout of 12 seconds
      const timeoutId = setTimeout(() => {
        if (!resolvedOrRejected) {
          resolvedOrRejected = true;
          cleanup();
          if (this.clientConnection) {
            this.clientConnection.close();
            this.clientConnection = null;
          }
          reject(new Error('Connection timed out. The host may be offline or you may have a firewall issue.'));
        }
      }, 12000);

      // Handle peer errors during connection
      const peerErrorHandler = (err: any) => {
        console.error('Peer error during connect:', err);
        if (!resolvedOrRejected) {
          resolvedOrRejected = true;
          cleanup();
          if (this.clientConnection) {
            this.clientConnection.close();
            this.clientConnection = null;
          }
          if (err.type === 'peer-unavailable') {
            reject(new Error('Room not found. Verify the room code and ensure the host has started the lobby.'));
          } else {
            reject(new Error(`Failed to connect: ${err.message || err.type || 'Unknown peer error'}`));
          }
        }
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        if (this.peer) {
          this.peer.off('error', peerErrorHandler);
        }
      };

      // Listen for peer errors
      this.peer.on('error', peerErrorHandler);

      this.clientConnection = this.peer.connect(hostRoomId, {
        reliable: true
      });

      this.clientConnection.on('open', () => {
        console.log('Client connected to host successfully:', hostRoomId);
        if (!resolvedOrRejected) {
          resolvedOrRejected = true;
          cleanup();
          resolve();
        }
      });

      this.clientConnection.on('data', (data: MpMessage) => {
        console.log('Client received data:', data.type);
        this.onMessageCallback(data);
      });

      this.clientConnection.on('close', () => {
        console.log('Disconnected from host room');
        this.clientConnection = null;
        cleanup();
        // Trigger a fake leave message to reset client state
        this.onMessageCallback({
          type: 'LEAVE_ROOM',
          senderPeerId: hostRoomId,
          senderName: 'Host',
          payload: hostRoomId
        });
      });

      this.clientConnection.on('error', (err: any) => {
        console.error('Client connection error:', err);
        if (!resolvedOrRejected) {
          resolvedOrRejected = true;
          cleanup();
          reject(new Error(`Connection error: ${err.message || 'Unknown connection error'}`));
        }
      });
    });
  }

  // Broadcast message to all connected peers (Host) or send to host (Client)
  public send(type: MpMessageType, payload: any, senderName: string = '') {
    const msg: MpMessage = {
      type,
      senderPeerId: this.peerId,
      senderName,
      payload
    };

    if (this.isHost) {
      // Send to all clients
      this.hostConnectionMap.forEach((conn) => {
        if (conn.open) {
          // If we send LOBBY_UPDATE or DRAFT_UPDATE, override isHost for the client to be false
          if (type === 'LOBBY_UPDATE' || type === 'DRAFT_UPDATE') {
            conn.send({
              ...msg,
              payload: { ...payload, isHost: false }
            });
          } else {
            conn.send(msg);
          }
        }
      });
    } else {
      // Send to host only
      if (this.clientConnection && this.clientConnection.open) {
        this.clientConnection.send(msg);
      } else {
        console.warn('Cannot send: Client connection is not open');
      }
    }
  }

  // Cleanup connections
  public disconnect() {
    if (this.isHost) {
      this.hostConnectionMap.forEach((conn) => {
        conn.close();
      });
      this.hostConnectionMap.clear();
    } else if (this.clientConnection) {
      this.clientConnection.close();
      this.clientConnection = null;
    }
    
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    this.peerId = '';
    this.roomId = '';
    this.isHost = false;
  }
}

// AI Player Pick Selector (For automatic picks when timer runs out or filling remaining slots)
export function getBestAiPick(
  playersPool: Player[],
  pickedIds: number[],
  currentRoster: Player[],
  settings: MpSettings
): Player {
  // Filter out already picked players
  const available = playersPool.filter(p => !pickedIds.includes(p.id));
  
  // Count overseas in current roster
  const overseasCount = currentRoster.filter(p => p.is_overseas).length;
  const allowOverseas = overseasCount < settings.maxOverseas;
  
  // Roster check
  const countRole = (role: string) => currentRoster.filter(p => p.role.includes(role) || (role === 'WK' && p.role === 'WK')).length;
  const hasWK = countRole('WK') >= 1;
  const batCount = countRole('BAT');
  const bowlCount = countRole('BOWL');
  
  // Remaining picks in the draft
  const remainingSlots = settings.rounds - currentRoster.length;
  
  // Filter out overseas if we hit limit
  let pool = available;
  if (!allowOverseas) {
    pool = pool.filter(p => !p.is_overseas);
  }
  
  // Prioritize critical roles if we are running low on slots
  if (remainingSlots <= 4) {
    if (!hasWK) {
      const wkPool = pool.filter(p => p.role === 'WK');
      if (wkPool.length > 0) pool = wkPool;
    } else if (batCount < 3) {
      const batPool = pool.filter(p => p.role.includes('BAT'));
      if (batPool.length > 0) pool = batPool;
    } else if (bowlCount < 3) {
      const bowlPool = pool.filter(p => p.role.includes('BOWL'));
      if (bowlPool.length > 0) pool = bowlPool;
    }
  }

  // Sort by overall descending
  pool.sort((a, b) => b.overall - a.overall);

  // Return the best available, or if empty fallback to any available
  if (pool.length > 0) {
    return pool[0];
  }
  
  // Final fallback
  const fallbackPool = available.slice().sort((a, b) => b.overall - a.overall);
  return fallbackPool[0];
}

// Get dynamic player base price based on rating and category
export function getPlayerBasePrice(overall: number, category: string, isOverseas: boolean, isMarquee: boolean): { numeric: number; formatted: string } {
  if (isMarquee) return { numeric: 200, formatted: '2.00 Cr' };
  if (isOverseas) {
    if (overall >= 85) return { numeric: 200, formatted: '2.00 Cr' };
    if (overall >= 82) return { numeric: 100, formatted: '1.00 Cr' };
    return { numeric: 50, formatted: '50 L' };
  }
  if (category === 'Capped') {
    if (overall >= 85) return { numeric: 150, formatted: '1.50 Cr' };
    if (overall >= 82) return { numeric: 100, formatted: '1.00 Cr' };
    return { numeric: 50, formatted: '50 L' };
  }
  // Uncapped
  if (overall >= 82) return { numeric: 50, formatted: '50 L' };
  return { numeric: 20, formatted: '20 L' };
}

// Get standard IPL auction bid increment based on current price
export function getBidIncrement(currentBidLakhs: number): number {
  if (currentBidLakhs < 100) return 5;     // +5L below 1Cr
  if (currentBidLakhs < 200) return 10;    // +10L between 1Cr and 2Cr
  if (currentBidLakhs < 500) return 20;    // +20L between 2Cr and 5Cr
  return 50;                               // +50L above 5Cr
}

// Calculate AI team's maximum valuation for a player during auction
export function getAiValuation(
  player: Player,
  remainingPurse: number,
  currentRoster: Player[],
  maxRoster: number
): number {
  // Base valuation correlates with overall rating
  // E.g., rating 80 -> ~50L base, rating 90 -> ~400L base, rating 95 -> ~800L base
  const overall = player.overall;
  let baseVal = 20; // fallback minimum
  
  if (overall >= 93) baseVal = 700 + (overall - 93) * 100;
  else if (overall >= 88) baseVal = 300 + (overall - 88) * 80;
  else if (overall >= 84) baseVal = 150 + (overall - 84) * 40;
  else if (overall >= 80) baseVal = 50 + (overall - 80) * 25;
  else baseVal = 20 + (overall - 75) * 6;

  // Add random variance (+/- 15%) to simulate different franchise behaviors
  const variance = 0.85 + Math.random() * 0.30;
  let valuation = Math.round(baseVal * variance);

  // Bonus for marquee or high overseas appeal
  if (player.overall >= 90) valuation += 100;
  
  // Roster check adjustment:
  const countRole = (role: string) => currentRoster.filter(p => p.role.includes(role) || (role === 'WK' && p.role === 'WK')).length;
  const isWKNeeded = countRole('WK') === 0;
  const batCount = countRole('BAT');
  const bowlCount = countRole('BOWL');
  const overseasCount = currentRoster.filter(p => p.is_overseas).length;

  // If this is a WK and AI doesn't have one yet, bump valuation!
  if (player.role === 'WK' && isWKNeeded) {
    valuation += 150;
  }
  // If role is already saturated, slash valuation!
  if (player.role.includes('BAT') && batCount >= 5) valuation = Math.round(valuation * 0.4);
  if (player.role.includes('BOWL') && bowlCount >= 5) valuation = Math.round(valuation * 0.4);

  // Overseas constraints
  if (player.is_overseas) {
    if (overseasCount >= 4) {
      return 0; // cannot bid on overseas
    } else if (overseasCount === 3) {
      valuation = Math.round(valuation * 0.7); // discount if approaching limit
    }
  }

  // Reserve Purse Rule check:
  const remainingSlots = maxRoster - currentRoster.length;
  const minRequiredReserve = (remainingSlots - 1) * 20; // keep at least 20L per remaining slot
  
  const maxPossibleBid = remainingPurse - minRequiredReserve;
  
  if (valuation > maxPossibleBid) {
    valuation = maxPossibleBid;
  }

  return Math.max(0, valuation);
}
