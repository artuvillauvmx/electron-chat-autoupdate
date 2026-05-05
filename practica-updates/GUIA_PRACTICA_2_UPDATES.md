# Practica: Dos Actualizaciones Con GitHub Releases

## Objetivo

Publicar tres versiones de la app:

- `v1.0.0`: chat basico
- `v1.1.0`: chat con emotes
- `v1.2.0`: chat con adjuntos simulados

La idea es que el alumno vea que una app instalada puede detectar nuevas versiones publicadas como releases.

## Antes De Publicar: Probar Que La App Corre

Entrar a la carpeta del proyecto:

```powershell
cd "C:\Users\Man_S\Documents\Docencia\Despliegue_Software\Clase_05_GitHub_Releases\electron-chat-autoupdate"
```

Instalar dependencias:

```powershell
npm install
```

Ejecutar en modo desarrollo:

```powershell
npm run signal
```

En otra terminal:

```powershell
npm start
```

Validar:

- la ventana de Electron abre correctamente
- se muestra la version `1.0.0`
- se puede conectar a `ws://localhost:8787`
- se puede enviar un mensaje entre dos ventanas o equipos conectados
- el estado de update indica que esta desactivado en modo desarrollo

Generar instalador local:

```powershell
npm run dist
```

Verificar que se generaron archivos en `dist`:

- `.exe`
- `.blockmap`
- `latest.yml`

Si esto falla localmente, no conviene publicar la release todavia.

## Version 1.0.0

Esta es la version base incluida en el proyecto.

Publicacion:

```powershell
git add .
git commit -m "Version 1.0.0 chat base"
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin main
git push origin v1.0.0
```

Cuando GitHub Actions termine, descargar e instalar el `.exe` desde GitHub Releases.

## Update 1: Version 1.1.0 Con Emotes

### 1. Cambiar Version

Editar `package.json`:

```json
"version": "1.1.0"
```

### 2. Agregar Botones De Emotes

En `src/index.html`, agregar este bloque arriba del formulario `chatForm`:

```html
<div class="emote-bar" aria-label="Emotes rapidos">
  <button type="button" data-emote=":)">:)</button>
  <button type="button" data-emote=":D">:D</button>
  <button type="button" data-emote="<3">&lt;3</button>
</div>
```

### 3. Agregar Logica De Emotes

En `src/renderer.js`, agregar:

```javascript
document.querySelectorAll('[data-emote]').forEach((button) => {
  button.addEventListener('click', () => {
    messageInput.value = `${messageInput.value} ${button.dataset.emote}`.trim();
    messageInput.focus();
  });
});
```

### 4. Agregar Estilos

En `src/styles.css`, agregar:

```css
.emote-bar {
  display: flex;
  gap: 8px;
  padding: 12px 20px 0;
}

.emote-bar button {
  min-width: 44px;
  width: auto;
  padding: 0 12px;
  color: var(--accent-dark);
  background: var(--own);
  border: 1px solid #bfd8d3;
}
```

### 5. Publicar Version

```powershell
git add .
git commit -m "Agrega emotes al chat"
git tag -a v1.1.0 -m "Version 1.1.0 con emotes"
git push origin main
git push origin v1.1.0
```

La app instalada desde `v1.0.0` debe detectar la actualizacion `v1.1.0`.

## Update 2: Version 1.2.0 Con Adjuntos Simulados

### 1. Cambiar Version

Editar `package.json`:

```json
"version": "1.2.0"
```

### 2. Agregar Input De Archivo

En `src/index.html`, dentro del formulario `chatForm`, antes del boton `Enviar`, agregar:

```html
<label class="file-button">
  Adjuntar
  <input id="fileInput" type="file">
</label>
```

### 3. Agregar Logica De Adjuntos

En `src/renderer.js`, declarar:

```javascript
const fileInput = document.querySelector('#fileInput');
let selectedFileName = '';
```

Agregar:

```javascript
fileInput.addEventListener('change', () => {
  selectedFileName = fileInput.files[0]?.name || '';
});
```

Dentro del `submit`, despues de `addMessage('Tu', text);`, agregar:

```javascript
if (selectedFileName) {
  addMessage('Adjunto', `Archivo seleccionado: ${selectedFileName}`);
  selectedFileName = '';
  fileInput.value = '';
}
```

### 4. Agregar Estilos

En `src/styles.css`, agregar:

```css
.file-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 14px;
  color: var(--accent-dark);
  background: var(--own);
  border: 1px solid #bfd8d3;
  cursor: pointer;
}

.file-button input {
  display: none;
}
```

### 5. Publicar Version

```powershell
git add .
git commit -m "Agrega adjuntos simulados al chat"
git tag -a v1.2.0 -m "Version 1.2.0 con adjuntos"
git push origin main
git push origin v1.2.0
```

La app actualizada a `v1.1.0` debe detectar la version `v1.2.0`.

## Que Debe Entregar El Alumno

- enlace al repositorio publico
- enlace a las releases `v1.0.0`, `v1.1.0` y `v1.2.0`
- captura del workflow exitoso
- captura de la app instalada
- explicacion de por que el token no va dentro de Electron
- explicacion de que assets publico GitHub Releases
