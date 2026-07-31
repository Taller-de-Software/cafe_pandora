const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'backend', 'prisma', 'schema.prisma');
const dest = path.join(__dirname, '..', 'prisma', 'schema.prisma');

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log('schema.prisma copiado a desktop/prisma/schema.prisma');
