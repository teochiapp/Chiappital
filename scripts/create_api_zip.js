// scripts/create_api_zip.js - Crea un api.zip limpio para Hostinger
const fs = require('fs');
const path = require('path');
const archiver = require('../api/node_modules/archiver');

const apiDir = path.resolve(__dirname, '../api');
const outputFile = path.resolve(__dirname, '../api.zip');

if (fs.existsSync(outputFile)) {
  fs.unlinkSync(outputFile);
  console.log('🗑️ Archivo api.zip previo eliminado.');
}

const output = fs.createWriteStream(outputFile);
const archive = typeof archiver === 'function'
  ? archiver('zip', { zlib: { level: 9 } })
  : new archiver.ZipArchive({ zlib: { level: 9 } });

output.on('close', () => {
  const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  const sizeKB = (archive.pointer() / 1024).toFixed(1);
  console.log(`✅ api.zip creado con éxito!`);
  console.log(`📦 Tamaño: ${sizeMB > 1 ? sizeMB + ' MB' : sizeKB + ' KB'} (${archive.pointer()} bytes)`);
  console.log(`📍 Ubicación: ${outputFile}`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// Archivos y carpetas a incluir desde api/
const itemsToInclude = [
  '.env',
  '.env.example',
  'server.js',
  'index.js',
  'package.json',
  'package-lock.json',
  'database',
  'middleware',
  'routes',
  'services',
  'utils',
  'public',
];

for (const item of itemsToInclude) {
  const itemPath = path.join(apiDir, item);
  if (!fs.existsSync(itemPath)) continue;

  const stat = fs.statSync(itemPath);
  if (stat.isDirectory()) {
    archive.directory(itemPath, item);
  } else {
    archive.file(itemPath, { name: item });
  }
}

archive.finalize();
