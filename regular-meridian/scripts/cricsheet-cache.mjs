import { createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { inflateRawSync } from 'node:zlib';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const cacheDirectory = path.join(projectRoot, '.cache', 'cricsheet');
export const matchesDirectory = path.join(cacheDirectory, 'matches');
export const peopleCsvPath = path.join(cacheDirectory, 'people.csv');
export const namesCsvPath = path.join(cacheDirectory, 'names.csv');
export const matchesZipPath = path.join(cacheDirectory, 'ipl_json.zip');
const metadataPath = path.join(cacheDirectory, 'download-metadata.json');

const sources = [
  [peopleCsvPath, 'https://cricsheet.org/register/people.csv'],
  [namesCsvPath, 'https://cricsheet.org/register/names.csv'],
];

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function download(url, filePath) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Cricsheet download failed (${response.status}): ${url}`);
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.part`;
  await pipeline(response.body, createWriteStream(temporaryPath));
  await rm(filePath, { force: true });
  await rename(temporaryPath, filePath);
}

export async function ensureRegisterFiles({ refresh = false } = {}) {
  await mkdir(cacheDirectory, { recursive: true });
  for (const [filePath, url] of sources) {
    if (refresh || !(await exists(filePath))) await download(url, filePath);
  }
}

async function extractJsonFiles(zipBuffer, outputDirectory) {
  let endRecord = -1;
  const searchStart = Math.max(0, zipBuffer.length - 0xffff - 22);
  for (let offset = zipBuffer.length - 22; offset >= searchStart; offset -= 1) {
    if (zipBuffer.readUInt32LE(offset) === 0x06054b50) {
      endRecord = offset;
      break;
    }
  }
  if (endRecord < 0) throw new Error('The Cricsheet ZIP has no end-of-central-directory record.');

  const entryCount = zipBuffer.readUInt16LE(endRecord + 10);
  let cursor = zipBuffer.readUInt32LE(endRecord + 16);
  let extracted = 0;

  for (let index = 0; index < entryCount; index += 1) {
    if (zipBuffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error(`Unexpected ZIP central-directory record at byte ${cursor}.`);
    }
    const flags = zipBuffer.readUInt16LE(cursor + 8);
    const method = zipBuffer.readUInt16LE(cursor + 10);
    const compressedSize = zipBuffer.readUInt32LE(cursor + 20);
    const uncompressedSize = zipBuffer.readUInt32LE(cursor + 24);
    const nameLength = zipBuffer.readUInt16LE(cursor + 28);
    const extraLength = zipBuffer.readUInt16LE(cursor + 30);
    const commentLength = zipBuffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = zipBuffer.readUInt32LE(cursor + 42);
    const entryName = zipBuffer.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    cursor += 46 + nameLength + extraLength + commentLength;

    if (!entryName.toLowerCase().endsWith('.json') || entryName.startsWith('__MACOSX/')) continue;
    if ((flags & 1) !== 0) throw new Error(`Encrypted ZIP entry is not supported: ${entryName}`);
    const safeName = entryName.replaceAll('\\', '/');
    if (safeName.startsWith('/') || safeName.split('/').some((part) => part === '..')) {
      throw new Error(`Unsafe path in Cricsheet ZIP: ${entryName}`);
    }
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new Error(`ZIP64 entry is not supported: ${entryName}`);
    }

    const localNameLength = zipBuffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = zipBuffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = zipBuffer.subarray(dataOffset, dataOffset + compressedSize);
    let content;
    if (method === 0) content = compressed;
    else if (method === 8) content = inflateRawSync(compressed);
    else throw new Error(`Unsupported ZIP compression method ${method} in ${entryName}`);
    if (content.length !== uncompressedSize) throw new Error(`Unexpected uncompressed size for ${entryName}`);

    const destination = path.join(outputDirectory, safeName);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);
    extracted += 1;
  }
  return extracted;
}

export async function ensureCricsheetCache({ refresh = false } = {}) {
  await ensureRegisterFiles({ refresh });
  await mkdir(cacheDirectory, { recursive: true });
  if (refresh) {
    await rm(matchesZipPath, { force: true });
    await rm(matchesDirectory, { recursive: true, force: true });
  }

  if (!(await exists(matchesZipPath))) {
    await download('https://cricsheet.org/downloads/ipl_json.zip', matchesZipPath);
    await writeFile(metadataPath, JSON.stringify({ downloadDate: new Date().toISOString().slice(0, 10) }, null, 2) + '\n');
  }

  let matchFiles = [];
  if (await exists(matchesDirectory)) {
    matchFiles = (await readdir(matchesDirectory, { recursive: true })).filter((name) => name.toLowerCase().endsWith('.json'));
  }
  if (matchFiles.length === 0) {
    const zip = await readFile(matchesZipPath);
    const extracted = await extractJsonFiles(zip, matchesDirectory);
    if (extracted === 0) throw new Error('No JSON match files were found in the Cricsheet archive.');
    matchFiles = (await readdir(matchesDirectory, { recursive: true })).filter((name) => name.toLowerCase().endsWith('.json'));
  }

  let metadata = { downloadDate: new Date().toISOString().slice(0, 10) };
  if (await exists(metadataPath)) metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
  return {
    cacheDirectory,
    matchesDirectory,
    matchFiles: matchFiles.map((name) => path.join(matchesDirectory, name)),
    downloadDate: metadata.downloadDate,
  };
}

export async function parseCsvFile(filePath) {
  const text = (await readFile(filePath, 'utf8')).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  const [headers, ...dataRows] = rows;
  if (!headers) return [];
  return dataRows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])));
}
