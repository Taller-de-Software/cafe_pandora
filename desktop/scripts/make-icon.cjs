const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const src = path.join(__dirname, '..', '..', 'images', 'logo cafepandora sin fondo.png');
const destDir = path.join(__dirname, '..', 'icons');
const dest = path.join(destDir, 'icon.png');

const png = PNG.sync.read(fs.readFileSync(src));
fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(dest, PNG.sync.write(png, { colorType: 6 }));
console.log(`icon.png generado (${png.width}x${png.height}, RGBA) en ${dest}`);
