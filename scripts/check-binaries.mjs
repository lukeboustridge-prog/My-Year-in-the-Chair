import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

function listTrackedFiles() {
  const output = execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' });
  return output.split('\n').map((line) => line.trim()).filter(Boolean);
}

function isBinary(buffer) {
  const length = Math.min(buffer.length, 8192);
  if (length === 0) {
    return false;
  }

  let suspicious = 0;

  for (let index = 0; index < length; index += 1) {
    const byte = buffer[index];
    if (byte === 0) {
      return true;
    }
    if (byte < 7 || byte === 11 || (byte > 13 && byte < 32) || byte > 126) {
      suspicious += 1;
    }
  }

  return suspicious / length > 0.3;
}

const trackedFiles = listTrackedFiles();
const binaryFiles = [];
const missingFiles = [];

for (const relativePath of trackedFiles) {
  const absolutePath = resolve(repoRoot, relativePath);
  let buffer;
  try {
    buffer = readFileSync(absolutePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      missingFiles.push(relativePath);
      continue;
    }
    throw error;
  }

  if (isBinary(buffer)) {
    binaryFiles.push(relativePath);
  }
}

if (missingFiles.length > 0) {
  console.warn('Skipped missing files (likely deleted or renamed):\n' + missingFiles.map((file) => ` - ${file}`).join('\n'));
}

if (binaryFiles.length > 0) {
  console.error('Binary files detected:\n' + binaryFiles.map((file) => ` - ${file}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('No binary files detected.');
}
