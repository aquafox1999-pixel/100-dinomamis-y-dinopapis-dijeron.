'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = function setupCards(app, io) {
  const directory = path.join(__dirname, 'public', 'img', 'tarjetas');
  const manifest = path.join(__dirname, 'cards.json');
  let pendingWrite = Promise.resolve();
  fs.mkdirSync(directory, { recursive: true });
  if (!fs.existsSync(manifest)) fs.writeFileSync(manifest, '[]\n');

  function readCards() {
    const cards = JSON.parse(fs.readFileSync(manifest, 'utf8').replace(/^\uFEFF/, ''));
    if (!Array.isArray(cards) || cards.some(name => typeof name !== 'string' ||
      /[\\/]/.test(name) || !/\.(png|jpe?g|gif|webp)$/i.test(name))) {
      throw new Error('cards.json debe contener un arreglo de nombres de imagen.');
    }
    return cards;
  }
  readCards(); // Detecta un manifiesto incorrecto antes de aceptar subidas.

  function authenticate(req, res, next) {
    res.set('Cache-Control', 'no-store');
    const password = process.env.UPLOAD_PASSWORD;
    if (!password) return res.status(503).send('Configura UPLOAD_PASSWORD para habilitar las subidas.');
    const authorization = req.get('authorization') || '';
    const credentials = authorization.startsWith('Basic ')
      ? Buffer.from(authorization.slice(6), 'base64').toString('utf8') : '';
    const expected = 'admin:' + password;
    const hash = value => crypto.createHash('sha256').update(value).digest();
    if (!crypto.timingSafeEqual(hash(credentials), hash(expected))) {
      res.set('WWW-Authenticate', 'Basic realm="Tarjetas", charset="UTF-8"');
      return res.status(401).send('Acceso privado.');
    }
    next();
  }

  app.get(['/upload', '/upload.html'], authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'upload.html'));
  });

  app.get('/cards.json', (req, res, next) => {
    try {
      res.set('Cache-Control', 'no-store').json(readCards());
    } catch (error) { next(error); }
  });

  let upload;
  function receiveUpload(req, res, callback) {
    if (upload) return upload(req, res, callback);
    let multer;
    try {
      multer = require('multer');
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') return callback(error);
      return res.status(503).json({ error: 'Falta instalar multer. Ejecuta npm install multer y reinicia el servidor.' });
    }
    upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
      fileFilter(req, file, callback) {
        if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.mimetype)) {
          return callback(new Error('Solo se admiten imagenes PNG, JPG, GIF o WebP.'));
        }
        callback(null, true);
      }
    }).single('card');
    upload(req, res, callback);
  }

  function imageExtension(buffer) {
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return '.png';
    if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return '.jpg';
    if (['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) return '.gif';
    if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP') return '.webp';
    return null;
  }

  app.post('/api/cards', authenticate, (req, res) => {
    // El formulario y el POST viven en el mismo origen.
    const origin = req.get('origin');
    const publicHost = (req.get('x-forwarded-host') || req.get('host')).split(',')[0].trim();
    const publicOrigin = req.protocol + '://' + publicHost;
    const configuredOrigin = (process.env.PUBLIC_URL || '').trim().replace(/\/+$/, '');
    if (origin && origin !== publicOrigin && origin !== configuredOrigin) {
      return res.status(403).json({ error: 'Origen no permitido.' });
    }
    receiveUpload(req, res, error => {
      if (error) return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error:
        error.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera el limite de 10 MB.' : error.message });
      if (!req.file) return res.status(400).json({ error: 'Selecciona una imagen.' });
      const extension = imageExtension(req.file.buffer);
      if (!extension) return res.status(400).json({ error: 'El archivo no contiene una imagen compatible.' });
      const filename = crypto.randomUUID() + extension;
      const destination = path.join(directory, filename);
      const temporary = manifest + '.' + crypto.randomUUID() + '.tmp';
      // Serializa las actualizaciones para conservar todas las subidas simultaneas.
      // El disco se escribe sin bloquear el reloj ni los eventos del juego.
      pendingWrite = pendingWrite.then(async () => {
        try {
          const cards = readCards();
          await fs.promises.writeFile(destination, req.file.buffer, { flag: 'wx' });
          cards.push(filename);
          await fs.promises.writeFile(temporary, JSON.stringify(cards, null, 2) + '\n', { flag: 'wx' });
          await fs.promises.rename(temporary, manifest);
          io.emit('cards:updated');
          res.status(201).json({ filename: filename });
        } catch (saveError) {
          await Promise.all([destination, temporary].map(file => fs.promises.unlink(file).catch(() => {})));
          console.error('No se pudo guardar la tarjeta:', saveError.message);
          res.status(500).json({ error: 'No se pudo guardar la tarjeta. Intenta de nuevo.' });
        }
      });
    });
  });
};
