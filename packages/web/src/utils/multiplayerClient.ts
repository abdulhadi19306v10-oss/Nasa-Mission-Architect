import { SpacecraftDesign } from '@sim/index';

export interface PeerInfo {
  id: string;
  role: string;
}

export type ServerStatus = 'offline' | 'connecting' | 'connected';

export interface MultiplayerCallbacks {
  onStatusChange: (status: ServerStatus) => void;
  onPeersUpdated: (peers: PeerInfo[], eventNote?: string) => void;
  onRemoteDesign: (design: SpacecraftDesign, updatedByRole?: string) => void;
}

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private status: ServerStatus = 'offline';
  private callbacks: MultiplayerCallbacks | null = null;
  private pendingJoin: { roomCode: string; role: string; design: SpacecraftDesign } | null = null;

  public setCallbacks(cb: MultiplayerCallbacks) {
    this.callbacks = cb;
  }

  public getStatus(): ServerStatus {
    return this.status;
  }

  private setStatus(next: ServerStatus) {
    this.status = next;
    this.callbacks?.onStatusChange(next);
  }

  public joinRoom(roomCode: string, role: string, design: SpacecraftDesign) {
    this.disconnect();
    this.pendingJoin = { roomCode, role, design };
    this.setStatus('connecting');

    const defaultHost =
      typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    const wsUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_WS_URL || `ws://${defaultHost}:3001`;

    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      const connectTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          this.setStatus('offline');
        }
      }, 2000);

      ws.onopen = () => {
        clearTimeout(connectTimeout);
        this.setStatus('connected');
        if (this.pendingJoin) {
          ws.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              payload: this.pendingJoin
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PEER_JOINED' && msg.payload) {
            this.callbacks?.onPeersUpdated(
              msg.payload.activeRoles || [],
              `${msg.payload.role || 'Teammate'} joined room`
            );
            if (msg.payload.design) {
              this.callbacks?.onRemoteDesign(msg.payload.design, 'Room Host');
            }
          } else if (msg.type === 'PEER_LEFT' && msg.payload) {
            this.callbacks?.onPeersUpdated(
              msg.payload.activeRoles || [],
              `${msg.payload.role || 'Teammate'} left room`
            );
          } else if (msg.type === 'DESIGN_UPDATED' && msg.payload?.design) {
            this.callbacks?.onRemoteDesign(msg.payload.design, msg.payload.updatedByRole);
          }
        } catch {
          // Ignore malformed peer packets
        }
      };

      ws.onerror = () => {
        clearTimeout(connectTimeout);
        this.setStatus('offline');
      };

      ws.onclose = () => {
        clearTimeout(connectTimeout);
        this.ws = null;
        this.setStatus('offline');
      };
    } catch {
      this.setStatus('offline');
    }
  }

  public sendDesignUpdate(design: SpacecraftDesign) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'UPDATE_DESIGN',
          payload: { design }
        })
      );
    }
  }

  public disconnect() {
    this.pendingJoin = null;
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'LEAVE_ROOM', payload: {} }));
        }
        this.ws.close();
      } catch {
        // Ignore close errors
      }
      this.ws = null;
    }
    this.setStatus('offline');
  }
}

export const multiplayerClient = new MultiplayerClient();
