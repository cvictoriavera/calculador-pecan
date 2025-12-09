import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer package.json para obtener nombre
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const pluginName = packageJson.name;

// Leer la versión desde el archivo principal del plugin
const pluginFilePath = path.join(__dirname, '..', 'calculador-pecan.php');
const pluginFileContent = fs.readFileSync(pluginFilePath, 'utf8');
const versionMatch = pluginFileContent.match(/Version:\s*([^\s]+)/);
const pluginVersion = versionMatch ? versionMatch[1] : 'unknown';

// Nombre del archivo zip
const zipFileName = `${pluginName}-${pluginVersion}.zip`;
const outputPath = path.join(__dirname, '..', zipFileName);

// Crear el archivo zip
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Mejor compresión
});

// Escuchar eventos
output.on('close', () => {
  console.log(`Plugin empaquetado: ${zipFileName} (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Agregar archivos del plugin
// Incluir: calculador-pecan.php, templates/, dist/, README.md, etc.
// Excluir: src/, node_modules/, scripts/, .git/, etc.

const filesToInclude = [
  'calculador-pecan.php',
  'includes/',
  'templates/',
  'dist/',
  'README.md'
];

filesToInclude.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    if (fs.statSync(filePath).isDirectory()) {
      archive.directory(filePath, file);
    } else {
      archive.file(filePath, { name: file });
    }
  }
});

// Finalizar el archive
archive.finalize();