import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function safePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') ||
      value.split('/').some((part) => !part || part === '.' || part === '..') ||
      /[\r\n?#:%]/.test(value)) throw new Error(`Unsafe relative path: ${value}`);
  return value;
}

export function component(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)) {
    throw new Error(`Invalid model identifier: ${value}`);
  }
  return value;
}

/** A page starts at the beginning or after a blank line. Region metadata follows it. */
export function atlasPages(text) {
  const pages = [...text.replace(/^\uFEFF/, '').replace(/\r/g, '').trimStart().matchAll(/(?:^|\n\s*\n)([^\n]+)\n(?=(?:size|format|filter|repeat|pma)\s*:)/g)]
    .map((match) => safePath(match[1].trim()));
  if (!pages.length || new Set(pages).size !== pages.length || pages.some((p) => !/\.png$/i.test(p))) {
    throw new Error('Atlas must declare unique PNG texture pages');
  }
  return pages;
}

/** Read only the two strings in the Spine binary header; this is not a skeleton decoder. */
export function spineVersion(bytes) {
  let offset = 0;
  const string = () => {
    let length = 0;
    let shift = 0;
    let byte;
    do {
      if (offset >= bytes.length || shift > 28) throw new Error('Invalid Spine header');
      byte = bytes[offset++];
      length += (byte & 127) * 2 ** shift;
      shift += 7;
    } while (byte & 128);
    if (length < 2 || offset + length - 1 > bytes.length) throw new Error('Invalid Spine header string');
    const result = bytes.subarray(offset, offset + length - 1).toString('utf8');
    offset += length - 1;
    return result;
  };
  string(); // skeleton hash
  const version = string();
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(version)) throw new Error(`Unrecognized Spine version: ${version}`);
  return version;
}

export function fileRecord(relativePath, bytes) {
  return { path: safePath(relativePath), bytes: bytes.length, sha256: sha256(bytes) };
}

/** Model identity is pinned either to a Git tree or to the verified original bundle bytes. */
export function modelPrefix(key, source) {
  if (source?.kind === 'assetbundle') {
    const b = source.bundle;
    if (!b || !/^[a-f0-9]{64}$/.test(b.sha256) || !/^[a-f0-9]{32}$/.test(b.md5)
      || !Number.isSafeInteger(b.bytes) || b.bytes <= 0
      || !/^[a-z0-9_-]+$/i.test(b.resourceVersion)) throw new Error(`${key}: missing verified original bundle`);
    const url = new URL(b.url);
    if (url.protocol !== 'https:' || url.hostname !== 'ark-us-static-online.yo-star.com'
      || !url.pathname.includes(`/${b.resourceVersion}/`)) throw new Error(`${key}: invalid original bundle URL`);
    safePath(b.path);
    return `models/${key}/${b.sha256}/`;
  }
  if (!source || !/^[\w-]+\/[\w.-]+$/.test(source.repository) || !/^[a-f0-9]{40}$/.test(source.commit))
    throw new Error(`${key}: missing pinned source`);
  return `models/${key}/${source.commit}/`;
}

export async function validateManifest(manifest, root) {
  if (manifest.schemaVersion !== 1 || !manifest.models || Array.isArray(manifest.models) || typeof manifest.models !== 'object') {
    throw new Error('Expected SD manifest schemaVersion 1');
  }
  for (const [key, model] of Object.entries(manifest.models)) {
    if (!['operator', 'enemy'].includes(model.kind) || !['front', 'back', 'default'].includes(model.facing)) throw new Error(`${key}: invalid kind or facing`);
    if (key !== `${model.kind}/${component(model.id)}/${component(model.variant)}/${model.facing}`) throw new Error(`${key}: identity mismatch`);
    const source = model.source;
    const prefix = modelPrefix(key, source);
    safePath(source.directory);
    if (!/^\d+\.\d+(?:\.\d+)?$/.test(model.spineVersion)) throw new Error(`${key}: missing Spine version`);
    if (!Array.isArray(model.textures) || !model.textures.length) throw new Error(`${key}: missing textures`);
    const files = [model.skeleton, model.atlas, ...model.textures, ...(model.avatar ? [model.avatar] : [])];
    if (files.some((file) => !file || typeof file.path !== 'string') || new Set(files.map((file) => file.path)).size !== files.length) throw new Error(`${key}: duplicate or missing files`);
    for (const file of files) {
      safePath(file.path);
      if (!file.path.startsWith(prefix) || !/^[a-f0-9]{64}$/.test(file.sha256) || !Number.isSafeInteger(file.bytes) || file.bytes <= 0) throw new Error(`${key}: invalid file record`);
      const bytes = await readFile(path.join(root, file.path));
      if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`${key}: corrupt file ${file.path}`);
    }
    if (!model.skeleton.path.endsWith('.skel') || !model.atlas.path.endsWith('.atlas')) throw new Error(`${key}: incorrect file type`);
    if (spineVersion(await readFile(path.join(root, model.skeleton.path))) !== model.spineVersion) throw new Error(`${key}: incorrect skeleton version`);
    const atlas = await readFile(path.join(root, model.atlas.path), 'utf8');
    const expected = atlasPages(atlas).map((page) => `${path.posix.dirname(model.atlas.path)}/${page}`).sort();
    const actual = model.textures.map((file) => file.path).sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error(`${key}: atlas texture pages do not match manifest`);
  }
}
