import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const buildPath = path.join(process.cwd(), 'build');

// Create the build folder if it doesn't exist
if (!fs.existsSync(buildPath)) {
  fs.mkdirSync(buildPath);
}

// Copy the necessary files to the build folder
const filesToCopy = [
  'block.js',
  'transaction.js',
  'validator.js',
  'storage.js',
  'pos_blockchain.js',
  'shard.js',
  'index.js'
];

filesToCopy.forEach((file) => {
  fs.copyFileSync(path.join(process.cwd(), file), path.join(buildPath, file));
});

console.log('Build completed successfully.');
