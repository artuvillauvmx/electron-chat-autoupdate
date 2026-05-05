# Cambios Para Publicar Las Versiones 1.1.0 Y 1.2.0

## Objetivo

Esta guia indica que codigo agregar y en que archivo para crear dos actualizaciones de la app:

- `v1.1.0`: agregar envio de emojis al chat.
- `v1.2.0`: agregar envio de archivos y descarga por parte de otros usuarios.

La idea es que primero publiquen `v1.0.0`, instalen la app, despues publiquen `v1.1.0` y finalmente `v1.2.0`.

## Antes De Empezar

Trabajar sobre el proyecto:

```powershell
cd "C:\Users\Man_S\Documents\Docencia\Despliegue_Software\Clase_05_GitHub_Releases\electron-chat-autoupdate"
```

Antes de cada version, probar:

```powershell
npm start
```

Y antes de publicar, validar build:

```powershell
npm run dist
```

## Version 1.1.0: Emojis En El Chat

### 1. Cambiar Version En `package.json`

Archivo:

```text
package.json
```

Cambiar:

```json
"version": "1.0.0"
```

por:

```json
"version": "1.1.0"
```

## 2. Agregar Barra De Emojis En `src/index.html`

Archivo:

```text
src/index.html
```

Buscar esta parte:

```html
<form id="chatForm" class="composer">
  <input id="messageInput" type="text" autocomplete="off" placeholder="Escribe un mensaje..." required>
  <button type="submit">Enviar</button>
</form>
```

Reemplazar por:

```html
<form id="chatForm" class="composer">
  <div class="emoji-bar" aria-label="Emojis rapidos">
    <button type="button" data-emoji=":)">:)</button>
    <button type="button" data-emoji=":D">:D</button>
    <button type="button" data-emoji="<3">&lt;3</button>
    <button type="button" data-emoji=";)">;)</button>
  </div>

  <input id="messageInput" type="text" autocomplete="off" placeholder="Escribe un mensaje..." required>
  <button type="submit">Enviar</button>
</form>
```

## 3. Agregar Logica De Emojis En `src/renderer.js`

Archivo:

```text
src/renderer.js
```

Buscar la zona donde estan las constantes iniciales, cerca de:

```javascript
const networkStatus = document.querySelector('#networkStatus');
```

Debajo agregar:

```javascript
const emojiButtons = document.querySelectorAll('[data-emoji]');
```

Luego buscar esta parte:

```javascript
connectButton.addEventListener('click', () => {
  connectToRoom();
});
```

Debajo agregar:

```javascript
emojiButtons.forEach((button) => {
  button.addEventListener('click', () => {
    messageInput.value = `${messageInput.value} ${button.dataset.emoji}`.trim();
    messageInput.focus();
  });
});
```

## 4. Agregar Estilos En `src/styles.css`

Archivo:

```text
src/styles.css
```

Agregar al final:

```css
.emoji-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.emoji-bar button {
  min-width: 42px;
  min-height: 42px;
  padding: 0 10px;
  border: 1px solid var(--line);
  color: var(--accent-dark);
  background: var(--soft);
}
```

## 5. Probar La Version 1.1.0

```powershell
npm start
```

Validar:

- aparecen botones de emojis;
- al presionar un emoji, se agrega al campo de mensaje;
- el mensaje enviado llega a otros usuarios conectados.

## 6. Publicar `v1.1.0`

```powershell
git add .
git commit -m "Agrega emojis al chat"
git tag -a v1.1.0 -m "Version 1.1.0 con emojis"
git push origin main
git push origin v1.1.0
```

## Version 1.2.0: Archivos Enviados Y Descargables

Esta version permite seleccionar un archivo, enviarlo por el canal del chat y que el otro usuario pueda descargarlo.

Importante: para clase conviene usar archivos pequenos, por ejemplo `.txt`, `.png` o `.pdf` ligeros.

## 1. Cambiar Version En `package.json`

Archivo:

```text
package.json
```

Cambiar:

```json
"version": "1.1.0"
```

por:

```json
"version": "1.2.0"
```

## 2. Agregar Boton De Archivo En `src/index.html`

Archivo:

```text
src/index.html
```

Buscar el formulario:

```html
<form id="chatForm" class="composer">
```

Dentro del formulario, antes del `input` de mensaje, agregar:

```html
<label class="file-picker">
  Archivo
  <input id="fileInput" type="file">
</label>
```

El formulario debe quedar parecido a:

```html
<form id="chatForm" class="composer">
  <div class="emoji-bar" aria-label="Emojis rapidos">
    <button type="button" data-emoji=":)">:)</button>
    <button type="button" data-emoji=":D">:D</button>
    <button type="button" data-emoji="<3">&lt;3</button>
    <button type="button" data-emoji=";)">;)</button>
  </div>

  <label class="file-picker">
    Archivo
    <input id="fileInput" type="file">
  </label>

  <input id="messageInput" type="text" autocomplete="off" placeholder="Escribe un mensaje..." required>
  <button type="submit">Enviar</button>
</form>
```

## 3. Agregar Referencia Al Archivo En `src/renderer.js`

Archivo:

```text
src/renderer.js
```

Buscar:

```javascript
const emojiButtons = document.querySelectorAll('[data-emoji]');
```

Debajo agregar:

```javascript
const fileInput = document.querySelector('#fileInput');
```

## 4. Agregar Funcion Para Leer Archivos

En `src/renderer.js`, antes de:

```javascript
function sendChatMessage(text) {
```

agregar:

```javascript
function readSelectedFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result
      });
    };

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo seleccionado.'));
    };

    reader.readAsDataURL(file);
  });
}
```

## 5. Agregar Funcion Para Enviar Archivos

En `src/renderer.js`, despues de:

```javascript
function sendChatMessage(text) {
```

y su bloque completo, agregar:

```javascript
function sendFileMessage(filePayload) {
  peers.forEach((peer) => {
    if (peer.channel?.readyState === 'open') {
      peer.channel.send(JSON.stringify({
        type: 'file',
        file: filePayload
      }));
    }
  });
}
```

## 6. Modificar Recepcion De Mensajes

En `src/renderer.js`, buscar dentro de:

```javascript
channel.onmessage = (event) => {
```

esta parte:

```javascript
if (payload.type === 'chat') {
  addMessage(peer.name, payload.text);
}
```

Debajo agregar:

```javascript
if (payload.type === 'file') {
  addFileMessage(peer.name, payload.file);
}
```

## 7. Agregar Funcion Para Mostrar Archivo Descargable

En `src/renderer.js`, despues de `addMessage`, agregar:

```javascript
function addFileMessage(author, file) {
  const message = document.createElement('article');
  message.className = 'message';

  const authorElement = document.createElement('span');
  authorElement.className = 'message-author';
  authorElement.textContent = author;

  const link = document.createElement('a');
  link.className = 'file-download';
  link.href = file.dataUrl;
  link.download = file.name;
  link.textContent = `Descargar ${file.name}`;

  const meta = document.createElement('small');
  meta.textContent = `${Math.ceil(file.size / 1024)} KB`;

  message.append(authorElement, link, meta);
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}
```

## 8. Modificar El Envio Del Formulario

En `src/renderer.js`, buscar:

```javascript
chatForm.addEventListener('submit', (event) => {
```

Reemplazar todo ese bloque por:

```javascript
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();
  const selectedFile = fileInput.files[0];

  if (!text && !selectedFile) {
    return;
  }

  if (text) {
    addMessage('Tu', text, 'own');
    sendChatMessage(text);
  }

  if (selectedFile) {
    const filePayload = await readSelectedFile(selectedFile);
    addFileMessage('Tu', filePayload);
    sendFileMessage(filePayload);
    fileInput.value = '';
  }

  messageInput.value = '';
});
```

## 9. Agregar Estilos De Archivos En `src/styles.css`

Archivo:

```text
src/styles.css
```

Agregar al final:

```css
.file-picker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--accent-dark);
  background: var(--soft);
  font-weight: 700;
  cursor: pointer;
}

.file-picker input {
  display: none;
}

.file-download {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  margin: 4px 0;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--accent-dark);
  background: var(--soft);
  font-weight: 700;
  text-decoration: none;
}

.file-download:hover {
  text-decoration: underline;
}

.message small {
  display: block;
  color: var(--muted);
}
```

## 10. Probar La Version 1.2.0

Para probar archivos correctamente:

1. iniciar servidor:

```powershell
npm run signal
```

2. abrir dos instancias de la app o usar dos equipos;
3. conectar ambas apps a la misma sala;
4. seleccionar un archivo pequeno;
5. enviar;
6. verificar que el otro usuario ve el enlace de descarga;
7. descargar el archivo.

## 11. Publicar `v1.2.0`

```powershell
git add .
git commit -m "Agrega envio y descarga de archivos"
git tag -a v1.2.0 -m "Version 1.2.0 con archivos"
git push origin main
git push origin v1.2.0
```

## Recomendaciones Para La Clase

- Usar archivos pequenos para evitar saturar el canal WebRTC.
- No enviar archivos sensibles.
- Explicar que en una app real se agregarian limites de tamano, validacion de tipo y escaneo de seguridad.
- Recalcar que los archivos no pasan por GitHub Releases; viajan por el canal de chat entre usuarios conectados.
- GitHub Releases solo se usa para distribuir versiones de la app.
