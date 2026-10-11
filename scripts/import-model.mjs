import { readFile, writeFile, mkdir, rename, rm, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { gitSource } from './source-git.mjs';
import { atlasPages, component, fileRecord, safePath, spineVersion, validateManifest } from './manifest.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const encoded = (p) => p.split('/').map(encodeURIComponent).join('/');
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'arkpedia-sd-assets' };
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (token) headers.Authorization = `Bearer ${token}`;

async function response(url, authenticated = false) {
  const result = await fetch(url, { headers: authenticated ? headers : undefined, signal: AbortSignal.timeout(60000) });
  if (!result.ok) throw new Error(`Download failed (${result.status}): ${url}`);
  return result;
}
const api = async (url) => (await response(`https://api.github.com/${url}`, true)).json();

/** Publish complete immutable model files first; replace the manifest only after validation. */
export async function importModel({ source: sourceName, directory, id, variant = 'default', facing = 'default', commit, sourceRoot }) {
  const sources = JSON.parse(await readFile(path.join(root, 'sources.json'), 'utf8'));
  const source = sources[sourceName];
  if (!source) throw new Error(`Unknown source: ${sourceName}`);
  component(id); component(variant); safePath(directory);
  if (!directory.startsWith(`${source.root}/`) || !['front', 'back', 'default'].includes(facing)) throw new Error('Invalid source directory or facing');
  commit ||= (await api(`repos/${source.repository}/commits/${encodeURIComponent(source.ref)}`)).sha;
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Expected a full upstream commit SHA');
  // A filtered Git checkout provides the same pinned tree without one API
  // request per facing. Read blobs from Git, never uncommitted checkout files.
  const localSource = sourceRoot ? gitSource(sourceRoot, source.repository, commit) : null;
  const listing = sourceRoot
    ? localSource.listing(directory)
    : await api(`repos/${source.repository}/contents/${encoded(directory)}?ref=${commit}`);
  if (!Array.isArray(listing)) throw new Error('Expected a model directory');
  const files = listing.filter((file) => file.type === 'file');
  const skeletons = files.filter((file) => file.name.endsWith('.skel'));
  const atlases = files.filter((file) => file.name.endsWith('.atlas'));
  if (skeletons.length !== 1 || atlases.length !== 1) throw new Error('Model directory must contain exactly one skeleton and atlas');
  const key = `${source.kind}/${id}/${variant}/${facing}`;
  const prefix = `models/${key}/${commit}`;
  const buffers = new Map();
  const download = async (name) => {
    safePath(name);
    if (!files.some((file) => file.name === name)) throw new Error(`Atlas page absent from upstream listing: ${name}`);
    const file = files.find(file => file.name === name);
    const url = `https://raw.githubusercontent.com/${source.repository}/${commit}/${encoded(`${directory}/${name}`)}`;
    const bytes = sourceRoot ? localSource.blob(file)
      : Buffer.from(await (await response(url)).arrayBuffer());
    if (!bytes.length) throw new Error(`Empty model file: ${name}`);
    buffers.set(name, bytes);
    return bytes;
  };
  const skel = await download(skeletons[0].name);
  const atlas = await download(atlases[0].name);
  const pages = atlasPages(atlas.toString('utf8'));
  for (const page of pages) await download(page);
  const record = (name) => fileRecord(`${prefix}/${name}`, buffers.get(name));
  const model = {
    kind: source.kind, id, variant, facing, spineVersion: spineVersion(skel),
    source: { key: sourceName, repository: source.repository, commit, directory },
    skeleton: record(skeletons[0].name), atlas: record(atlases[0].name), textures: pages.map(record),
    // Blending and animation roles require a renderer check; do not guess them from filenames.
    premultipliedAlpha: null, animations: null
  };
  const manifestPath = path.join(root, 'manifest.json');
  const previous = JSON.parse(await readFile(manifestPath, 'utf8'));
  const next = { schemaVersion: 1, models: { ...previous.models, [key]: model } };
  const stagingRoot = path.join(root, '.cache');
  await mkdir(stagingRoot, { recursive: true });
  const staging = await mkdtemp(path.join(stagingRoot, 'model-'));
  try {
    for (const [name, bytes] of buffers) await writeFile(path.join(staging, name), bytes);
    const destination = path.join(root, prefix);
    await mkdir(path.dirname(destination), { recursive: true });
    try { await rename(staging, destination); }
    catch (error) { if (!['EEXIST', 'ENOTEMPTY'].includes(error.code)) throw error; }
    // Reimports verify the existing immutable directory rather than replacing its files.
    await validateManifest(next, root);
    const temporaryManifest = path.join(stagingRoot, 'manifest.json');
    await writeFile(temporaryManifest, `${JSON.stringify(next, null, 2)}\n`);
    await rename(temporaryManifest, manifestPath);
  } finally { await rm(staging, { recursive: true, force: true }); }
  return key;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: Object.fromEntries(['source', 'source-root', 'directory', 'id', 'variant', 'facing', 'commit'].map((key) => [key, { type: 'string' }])) });
  if (!values.source || !values.directory || !values.id) throw new Error('Required: --source operators|enemies --directory upstream/path --id game_id');
  console.log(`Imported ${await importModel({ ...values, sourceRoot: values['source-root'] })}`);
}
