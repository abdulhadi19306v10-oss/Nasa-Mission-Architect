import { WebSocketServer, WebSocket } from 'ws';

interface ClientConnection {
  ws: WebSocket;
  id: string;
  roomCode?: string;
  role?: string;
}

interface RoomState {
  code: string;
  createdAt: number;
  clients: Map<string, ClientConnection>;
  sharedDesign: any;
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const wss = new WebSocketServer({ port: PORT });
const rooms = new Map<string, RoomState>();

console.log(`[Mission Architect] Multiplayer room server started on port ${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  const clientId = Math.random().toString(36).substring(2, 10);
  const client: ClientConnection = { ws, id: clientId };

  console.log(`[Client Connected] ID: ${clientId}`);

  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      const { type, payload } = data;

      switch (type) {
        case 'JOIN_ROOM': {
          const { roomCode, role, design } = payload;
          let room = rooms.get(roomCode);

          if (!room) {
            room = {
              code: roomCode,
              createdAt: Date.now(),
              clients: new Map(),
              sharedDesign: design
            };
            rooms.set(roomCode, room);
            console.log(`[Room Created] Code: ${roomCode}`);
          }

          client.roomCode = roomCode;
          client.role = role;
          room.clients.set(clientId, client);

          // Notify all peers in room
          broadcastToRoom(roomCode, {
            type: 'PEER_JOINED',
            payload: {
              clientId,
              role,
              activeRoles: Array.from(room.clients.values()).map((c) => ({
                id: c.id,
                role: c.role
              })),
              design: room.sharedDesign
            }
          });
          break;
        }

        case 'UPDATE_DESIGN': {
          if (!client.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (room) {
            room.sharedDesign = payload.design;
            // Broadcast design change to all peers except sender
            broadcastToRoom(
              client.roomCode,
              {
                type: 'DESIGN_UPDATED',
                payload: {
                  design: payload.design,
                  updatedByRole: client.role
                }
              },
              clientId
            );
          }
          break;
        }

        case 'LEAVE_ROOM': {
          handleLeave(client);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('[Error handling message]', err);
    }
  });

  ws.on('close', () => {
    console.log(`[Client Disconnected] ID: ${clientId}`);
    handleLeave(client);
  });
});

function handleLeave(client: ClientConnection) {
  if (client.roomCode) {
    const room = rooms.get(client.roomCode);
    if (room) {
      room.clients.delete(client.id);
      if (room.clients.size === 0) {
        rooms.delete(client.roomCode);
        console.log(`[Room Closed] Code: ${client.roomCode}`);
      } else {
        broadcastToRoom(client.roomCode, {
          type: 'PEER_LEFT',
          payload: {
            clientId: client.id,
            role: client.role,
            activeRoles: Array.from(room.clients.values()).map((c) => ({
              id: c.id,
              role: c.role
            }))
          }
        });
      }
    }
    client.roomCode = undefined;
  }
}

function broadcastToRoom(roomCode: string, message: any, excludeClientId?: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const messageStr = JSON.stringify(message);
  for (const [id, peer] of room.clients.entries()) {
    if (id !== excludeClientId && peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.send(messageStr);
    }
  }
}
