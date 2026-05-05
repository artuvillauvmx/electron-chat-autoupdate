const os = require('os');
const http = require('http');
const { WebSocketServer } = require('ws');

const port = Number(process.env.PORT || 8787);
const rooms = new Map();

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === 'IPv4' && !item.internal)
    .map((item) => item.address);
}

function getRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Map());
  }

  return rooms.get(roomName);
}

function send(client, payload) {
  if (client.readyState === client.OPEN) {
    client.send(JSON.stringify(payload));
  }
}

function broadcast(roomName, payload, exceptId) {
  const room = rooms.get(roomName);
  if (!room) {
    return;
  }

  room.forEach((client, peerId) => {
    if (peerId !== exceptId) {
      send(client, payload);
    }
  });
}

function createPeerId() {
  return `peer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const server = http.createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ ok: true, service: 'lan-signaling-server' }));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (client) => {
  client.peerId = createPeerId();
  client.roomName = null;
  client.peerName = null;

  client.on('message', (raw) => {
    let message;

    try {
      message = JSON.parse(raw.toString());
    } catch {
      send(client, { type: 'error', message: 'Mensaje invalido.' });
      return;
    }

    if (message.type === 'join') {
      const roomName = String(message.room || 'general').trim() || 'general';
      const peerName = String(message.name || 'Usuario local').trim() || 'Usuario local';
      const room = getRoom(roomName);
      const peers = [...room.entries()].map(([id, peer]) => ({
        id,
        name: peer.peerName
      }));

      client.roomName = roomName;
      client.peerName = peerName;
      room.set(client.peerId, client);

      send(client, {
        type: 'joined',
        id: client.peerId,
        peers
      });

      broadcast(roomName, {
        type: 'peer-joined',
        id: client.peerId,
        name: peerName
      }, client.peerId);

      return;
    }

    if (message.type === 'signal' && client.roomName) {
      const room = rooms.get(client.roomName);
      const target = room?.get(message.target);

      if (target) {
        send(target, {
          type: 'signal',
          from: client.peerId,
          payload: message.payload
        });
      }
    }
  });

  client.on('close', () => {
    if (!client.roomName) {
      return;
    }

    const room = rooms.get(client.roomName);
    room?.delete(client.peerId);

    broadcast(client.roomName, {
      type: 'peer-left',
      id: client.peerId
    });

    if (room?.size === 0) {
      rooms.delete(client.roomName);
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor de señalizacion iniciado en puerto ${port}`);
  getLocalAddresses().forEach((address) => {
    console.log(`ws://${address}:${port}`);
  });
});
