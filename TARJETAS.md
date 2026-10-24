# Tarjetas para invitados

Antes de iniciar el servidor, instala la dependencia de subidas:

La instalacion tambien actualiza `package-lock.json`.

```powershell
npm.cmd install multer
$env:UPLOAD_PASSWORD = 'elige-una-contrasena-privada'
npm.cmd start
```

Abre `http://localhost:3000/?upload=true` (tambien funciona `/upload`).
El navegador pedira usuario y contrasena: usuario `admin` y la contrasena que
configuraste en `UPLOAD_PASSWORD`. En la nube, configura esa variable en el
proveedor y usa HTTPS. Sin esa variable, el panel permanece cerrado.

El formulario acepta una imagen PNG, JPG, GIF o WebP de hasta 10 MB por subida.
Cada subida recibe un nombre unico, se guarda en `public/img/tarjetas/` y se
agrega a `cards.json` en la raiz del proyecto. Los invitados reciben el aviso
por Socket.IO y actualizan su carrusel sin recargar.

Para preparar tarjetas manualmente, copia las imagenes a `public/img/tarjetas/`
y agrega sus nombres (sin carpetas) al arreglo de `cards.json`:

```json
["tarjeta-1.png", "tarjeta-2.jpg"]
```

El carrusel aparece debajo del tablero, con fundido y cambio cada 10 segundos.
Con una sola tarjeta queda fija; si la lista esta vacia, se oculta. Una tarjeta
inexistente se omite al siguiente cambio. Los cambios manuales del JSON se leen
al abrir o reconectar la vista; las subidas del formulario notifican de inmediato.

En Railway usa `npm start`, configura `UPLOAD_PASSWORD` y una sola instancia.
El servidor escucha en `0.0.0.0` y en el puerto de la variable `PORT` de Railway.
Las subidas funcionan en el disco temporal para el evento; pueden perderse al
reiniciar o desplegar. Si despues quieres conservarlas, monta almacenamiento
persistente para `public/img/tarjetas/` y `cards.json`. Esta version no comparte
archivos entre varias instancias. Las escrituras del manifiesto se serializan
para conservar varias subidas simultaneas y notificar solo cuando estan guardadas.
