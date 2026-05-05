const messages = document.querySelector('#messages');
const chatForm = document.querySelector('#chatForm');
const messageInput = document.querySelector('#messageInput');
const appVersion = document.querySelector('#appVersion');
const updateStatus = document.querySelector('#updateStatus');
const checkUpdatesButton = document.querySelector('#checkUpdatesButton');
const lightThemeButton = document.querySelector('#lightThemeButton');
const darkThemeButton = document.querySelector('#darkThemeButton');
const settingsToggleButton = document.querySelector('#settingsToggleButton');
const settingsPanel = document.querySelector('#settingsPanel');
const displayNameInput = document.querySelector('#displayNameInput');
const serverInput = document.querySelector('#serverInput');
const roomInput = document.querySelector('#roomInput');
const connectButton = document.querySelector('#connectButton');
const contactsList = document.querySelector('#contactsList');
const activeCount = document.querySelector('#activeCount');
const networkStatus = document.querySelector('#networkStatus');

const randomNames = [
  'Luna Rojas',
  'Mateo Solis',
  'Nora Vidal',
  'Iker Mora',
  'Alma Cano',
  'Leo Reyes',
  'Vera Mendez',
  'Gael Ruiz',
  'Mila Torres',
  'Dante Paredes'
];

const peers = new Map();
let socket = null;
let localPeerId = null;
let localName = '';
let isConnectedToRoom = false;

function addMessage(author, text, variant = '') {
  const message = document.createElement('article');
  message.className = `message ${variant}`;

  const authorElement = document.createElement('span');
  authorElement.className = 'message-author';
  authorElement.textContent = author;

  const textElement = document.createElement('p');
  textElement.textContent = text;

  message.append(authorElement, textElement);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  lightThemeButton.classList.toggle('active', theme === 'light');
  darkThemeButton.classList.toggle('active', theme === 'dark');
}

function getRandomName() {
  return randomNames[Math.floor(Math.random() * randomNames.length)];
}

function sendSignal(target, payload) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'signal',
      target,
      payload
    }));
  }
}

function createPeerRecord(id, name) {
  if (!peers.has(id)) {
    peers.set(id, {
      id,
      name,
      connection: null,
      channel: null,
      status: 'Conectando'
    });
  }

  return peers.get(id);
}

function renderContacts() {
  contactsList.replaceChildren();
  const contacts = [...peers.values()];
  activeCount.textContent = contacts.filter((peer) => peer.status === 'Disponible').length;

  if (!isConnectedToRoom) {
    const empty = document.createElement('p');
    empty.className = 'empty-contacts';
    empty.textContent = 'Conecta la app a una sala local para ver contactos.';
    contactsList.append(empty);
    return;
  }

  if (contacts.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-contacts';
    empty.textContent = 'Esperando contactos disponibles en la red local...';
    contactsList.append(empty);
    return;
  }

  contacts.forEach((peer) => {
    const item = document.createElement('button');
    item.className = 'contact-item';
    item.type = 'button';

    const avatar = document.createElement('span');
    avatar.className = 'contact-avatar';
    avatar.textContent = peer.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);

    const meta = document.createElement('span');
    meta.className = 'contact-meta';

    const name = document.createElement('strong');
    name.textContent = peer.name;

    const state = document.createElement('small');
    state.textContent = peer.status;

    meta.append(name, state);
    item.append(avatar, meta);

    item.addEventListener('click', () => {
      addMessage(peer.name, peer.status === 'Disponible'
        ? 'Disponible en la sala local.'
        : 'Estableciendo conexion...');
    });

    contactsList.append(item);
  });
}

function setPeerStatus(id, status) {
  const peer = peers.get(id);
  if (!peer) {
    return;
  }

  peer.status = status;
  renderContacts();
}

function setupDataChannel(peer, channel) {
  peer.channel = channel;

  channel.onopen = () => {
    setPeerStatus(peer.id, 'Disponible');
    addMessage('Red local', `${peer.name} esta disponible en la sala.`);
  };

  channel.onclose = () => {
    setPeerStatus(peer.id, 'Desconectado');
  };

  channel.onmessage = (event) => {
    let payload;

    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }

    if (payload.type === 'chat') {
      addMessage(peer.name, payload.text);
    }
  };
}

async function createPeerConnection(id, name, initiator) {
  const peer = createPeerRecord(id, name);
  if (peer.connection) {
    return peer.connection;
  }

  const connection = new RTCPeerConnection({ iceServers: [] });
  peer.connection = connection;

  connection.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal(id, {
        type: 'candidate',
        candidate: event.candidate
      });
    }
  };

  connection.onconnectionstatechange = () => {
    if (connection.connectionState === 'failed' || connection.connectionState === 'disconnected') {
      setPeerStatus(id, 'Desconectado');
    }
  };

  connection.ondatachannel = (event) => {
    setupDataChannel(peer, event.channel);
  };

  if (initiator) {
    setupDataChannel(peer, connection.createDataChannel('chat'));
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    sendSignal(id, {
      type: 'offer',
      description: connection.localDescription
    });
  }

  renderContacts();
  return connection;
}

async function handleSignal(from, payload) {
  const peer = peers.get(from);
  if (!peer) {
    return;
  }

  const connection = await createPeerConnection(from, peer.name, false);

  if (payload.type === 'offer') {
    await connection.setRemoteDescription(payload.description);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    sendSignal(from, {
      type: 'answer',
      description: connection.localDescription
    });
  }

  if (payload.type === 'answer') {
    await connection.setRemoteDescription(payload.description);
  }

  if (payload.type === 'candidate') {
    await connection.addIceCandidate(payload.candidate);
  }
}

function connectToRoom() {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.close();
  }

  peers.clear();
  renderContacts();

  localName = displayNameInput.value.trim() || getRandomName();
  displayNameInput.value = localName;
  const serverUrl = serverInput.value.trim();
  const room = roomInput.value.trim() || 'sala-local';

  networkStatus.textContent = 'Conectando';
  connectButton.disabled = true;

  socket = new WebSocket(serverUrl);

  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: 'join',
      room,
      name: localName
    }));
  };

  socket.onmessage = async (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'joined') {
      localPeerId = message.id;
      isConnectedToRoom = true;
      networkStatus.textContent = 'Conectado';
      connectButton.textContent = 'Reconectar';
      connectButton.disabled = false;
      addMessage('Red local', `Conectado como ${localName}.`, 'system');

      for (const peer of message.peers) {
        createPeerRecord(peer.id, peer.name);
        await createPeerConnection(peer.id, peer.name, true);
      }

      renderContacts();
      return;
    }

    if (message.type === 'peer-joined') {
      createPeerRecord(message.id, message.name);
      renderContacts();
      addMessage('Red local', `${message.name} entro a la sala local.`, 'system');
      return;
    }

    if (message.type === 'peer-left') {
      const peer = peers.get(message.id);
      if (peer) {
        peer.status = 'Desconectado';
        addMessage('Red local', `${peer.name} salio de la sala local.`, 'system');
        renderContacts();
      }
      return;
    }

    if (message.type === 'signal') {
      await handleSignal(message.from, message.payload);
    }
  };

  socket.onerror = () => {
    networkStatus.textContent = 'Sin conexion';
    connectButton.disabled = false;
    addMessage('Red local', 'No se pudo conectar con el servidor local.', 'system');
  };

  socket.onclose = () => {
    if (isConnectedToRoom) {
      networkStatus.textContent = 'Sin conexion';
      isConnectedToRoom = false;
      connectButton.disabled = false;
      renderContacts();
    }
  };
}

function sendChatMessage(text) {
  peers.forEach((peer) => {
    if (peer.channel?.readyState === 'open') {
      peer.channel.send(JSON.stringify({
        type: 'chat',
        text
      }));
    }
  });
}

async function loadVersion() {
  appVersion.textContent = await window.chatApp.getVersion();
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text) {
    return;
  }

  addMessage('Tu', text, 'own');
  sendChatMessage(text);
  messageInput.value = '';
});

checkUpdatesButton.addEventListener('click', async () => {
  updateStatus.textContent = await window.chatApp.checkUpdates();
});

lightThemeButton.addEventListener('click', () => {
  setTheme('light');
});

darkThemeButton.addEventListener('click', () => {
  setTheme('dark');
});

settingsToggleButton.addEventListener('click', () => {
  const isOpen = !settingsPanel.hidden;
  settingsPanel.hidden = isOpen;
  settingsToggleButton.setAttribute('aria-expanded', String(!isOpen));
  settingsToggleButton.textContent = isOpen ? 'Opciones' : 'Ocultar';
});

connectButton.addEventListener('click', () => {
  connectToRoom();
});

window.chatApp.onUpdateStatus((message) => {
  updateStatus.textContent = message;
});

loadVersion();
renderContacts();
addMessage('Chat Local', 'Conecta la app a una sala local para comenzar.');
