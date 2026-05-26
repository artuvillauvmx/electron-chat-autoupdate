# Electron Chat AutoUpdate

Proyecto de practica para publicar una aplicacion Electron en GitHub Releases y permitir actualizaciones automaticas desde un repositorio publico.

Este repositorio tambien se utiliza en la practica de Jenkins para automatizar construccion, despliegue local del backend y publicacion del cliente.

## Objetivo

El alumno debe entender este flujo:

```text
codigo fuente
  -> tag de Git
  -> GitHub Actions
  -> instalador publicado en GitHub Releases
  -> app instalada consulta actualizaciones
  -> usuario recibe nueva version
```

## Requisitos

- Node.js 20 o superior
- Git
- GitHub CLI opcional
- cuenta de GitHub
- repositorio publico

## Configuracion Inicial

Editar `package.json` y cambiar:

```json
"owner": "CAMBIAR_USUARIO_GITHUB",
"repo": "electron-chat-autoupdate"
```

por el usuario y repositorio real.

Ejemplo:

```json
"owner": "man-s",
"repo": "electron-chat-autoupdate"
```

## Instalacion Local

```powershell
npm install
npm start
```

En modo desarrollo el auto-update se muestra desactivado porque Electron solo debe buscar actualizaciones cuando la app esta empaquetada e instalada.

## Como Correr La App En Clase

### 1. Entrar A La Carpeta Del Proyecto

```powershell
cd "C:\Users\Man_S\Documents\Docencia\Despliegue_Software\Clase_05_GitHub_Releases\electron-chat-autoupdate"
```

### 2. Instalar Dependencias

```powershell
npm install
```

Este comando descarga Electron, electron-builder y electron-updater.

### 3. Iniciar El Servidor De Sala Local

En una computadora de la red local, normalmente la del docente, ejecutar:

```powershell
npm run signal
```

El servidor imprimira direcciones parecidas a:

```text
ws://192.168.1.25:8787
```

Esa direccion es la que usaran los alumnos dentro de la app.

El servidor no guarda cuentas ni mensajes. Solo ayuda a que las apps se encuentren y negocien la conexion WebRTC.

### 4. Ejecutar En Modo Desarrollo

```powershell
npm start
```

En este modo la app debe abrir una ventana con el chat.

Lo que el alumno debe verificar:

- aparece la version `1.0.0`
- puede escribir su nombre
- puede indicar la direccion del servidor local
- puede usar la misma sala que el grupo
- al conectarse otros equipos, aparecen en contactos
- los mensajes se envian entre las apps conectadas

### 5. Generar Instalador Local

```powershell
npm run dist
```

Esto genera archivos dentro de `dist`, incluyendo:

- instalador `.exe`
- archivo `.blockmap`
- `latest.yml`

Estos archivos son importantes porque Electron necesita metadata para saber si hay actualizaciones disponibles.

### 6. Probar Como App Instalada

Despues de generar el build, instalar:

```text
dist\Electron Chat AutoUpdate-1.0.0-Setup.exe
```

La prueba real de auto-update no se hace con `npm start`.

La prueba real se hace con la app instalada desde una release anterior.

## Como Crear El Servidor De Chat Local

El error de conexion normalmente aparece porque la app necesita que antes este corriendo el servidor de sala local.

La app no crea ese servidor automaticamente.

### 1. Elegir La Computadora Servidor

En clase, normalmente la computadora del docente funcionara como servidor.

Todos los demas equipos se conectaran a esa computadora.

### 2. Ejecutar El Servidor

En la computadora servidor:

```powershell
cd "C:\Users\Man_S\Documents\Docencia\Despliegue_Software\Clase_05_GitHub_Releases\electron-chat-autoupdate"
npm run signal
```

Debe aparecer una salida parecida a:

```text
Servidor de señalizacion iniciado en puerto 8787
ws://192.168.1.25:8787
```

La direccion `ws://192.168.1.25:8787` es solo un ejemplo. Cada red puede mostrar una IP distinta.

### 3. Conectar Desde La Misma Computadora

Si la app se abre en la misma computadora donde corre el servidor, usar:

```text
ws://localhost:8787
```

### 4. Conectar Desde Otros Equipos

Si la app se abre desde otra computadora, no usar `localhost`.

Usar la IP que mostro el servidor, por ejemplo:

```text
ws://192.168.1.25:8787
```

Esto es importante:

- `localhost` siempre apunta a la computadora actual
- si un alumno usa `localhost`, esta intentando conectarse a su propio equipo
- para conectarse al equipo del docente, debe usar la IP del docente

### 5. Usar La Misma Sala

Todos deben escribir el mismo nombre de sala, por ejemplo:

```text
sala-local
```

Si dos alumnos usan nombres de sala distintos, no se veran entre ellos.

### 6. Revisar Firewall Si Hay Error

Si los alumnos no pueden conectarse:

- confirmar que todos estan en la misma red Wi-Fi o LAN
- confirmar que la terminal con `npm run signal` sigue abierta
- permitir conexiones entrantes al puerto `8787` en el firewall de Windows
- verificar que la IP escrita en la app coincide con la IP que mostro el servidor

### 7. Prueba Rapida En Una Sola Maquina

Abrir una terminal:

```powershell
npm run signal
```

Abrir la app:

```powershell
npm start
```

En la app usar:

```text
Servidor local: ws://localhost:8787
Sala: sala-local
```

Presionar `Conectar`.

Si se conecta correctamente en la misma maquina, el servidor funciona. Si falla desde otros equipos, el problema normalmente esta en red, IP o firewall.

## Build Local

```powershell
npm run dist
```

Esto genera el instalador en `dist`.

Para esta practica de laboratorio se desactiva la firma de codigo en Windows:

```json
"signAndEditExecutable": false,
"verifyUpdateCodeSignature": false
```

En una aplicacion de produccion real, lo correcto es firmar el instalador y las actualizaciones. Aqui se desactiva para que los alumnos puedan completar la practica sin comprar ni configurar un certificado de firma.

## Release En Produccion

El workflow `.github/workflows/release.yml` se activa cuando se sube un tag con formato:

```text
v1.0.0
v1.1.0
v1.2.0
```

Secuencia:

```powershell
git add .
git commit -m "Version inicial del chat"
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin main
git push origin v1.0.0
```

GitHub Actions construira el instalador y lo publicara como asset de GitHub Releases.

## Importante Sobre Tokens

La app Electron no contiene tokens de GitHub.

El token se usa solo en GitHub Actions:

```yaml
GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Ese token existe durante el workflow y permite publicar la release. No queda dentro del instalador.

## Prueba De Auto-Update

1. Publicar `v1.0.0`.
2. Descargar e instalar la app desde GitHub Releases.
3. Hacer cambios para `v1.1.0`.
4. Cambiar `"version"` en `package.json` a `1.1.0`.
5. Crear y subir el tag `v1.1.0`.
6. Abrir la app instalada.
7. La app debe detectar la nueva version.

Para que auto-update funcione correctamente, el usuario debe ejecutar una version instalada desde un release anterior.
