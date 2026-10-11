import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { gitSource } from './source-git.mjs';
import { atlasPages, component, fileRecord, safePath, spineVersion, validateManifest } from './manifest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPSTREAM = 'fexli/ArknightsResource';

/** Exact original identity, including separate dormitory and skin prefabs. */
export function websiteIdentity(directory) {
  safePath(directory);
  const [spine, id, prefab, originalFacing, ...extra] = directory.split('/');
  if (spine !== 'spine' || !id?.startsWith('char_') || !prefab || extra.length) throw new Error(`Not an operator model directory: ${directory}`);
  const walking = prefab.startsWith('build_');
  const variantPrefab = walking ? prefab.slice(6) : prefab;
  const facing = walking && originalFacing === 'Spine' ? 'walk'
    : originalFacing === 'Spine' ? 'front' : originalFacing?.toLowerCase();
  if (!['front', 'back', 'walk'].includes(facing)) throw new Error(`Unknown original facing: ${directory}`);
  component(id); component(variantPrefab);
  return { id, variant: variantPrefab === id ? 'default' : variantPrefab, facing };
}

/** Copy pinned Git blobs unchanged; publish the complete manifest only once all files validate. */
export async function importWebsiteChibis({ index, sourceRoot, destinationRoot = root, log = console.log }) {
  const manifestPath = path.join(destinationRoot, 'manifest.json');
  const previous = JSON.parse(await readFile(manifestPath, 'utf8'));
  const next = { ...previous, models: { ...previous.models }, websiteSkins: { ...previous.websiteSkins } };
  const sources = new Map();
  const imported = new Map();
  const existing = new Map(Object.entries(previous.models).map(([key, model]) => [model.skeleton.path, key]));
  let count = 0;
  for (const [skin, facings] of Object.entries(index)) {
    const references = {};
    for (const [facing, model] of Object.entries(facings)) {
      const url = new URL(model.skeleton);
      const [, owner, repo, commit, ...bits] = url.pathname.split('/');
      if (url.origin !== 'https://raw.githubusercontent.com' || !/^[a-f0-9]{40}$/.test(commit)) throw new Error(`Not a pinned asset: ${model.skeleton}`);
      const repository = `${owner}/${repo}`;
      const relative = bits.join('/');
      safePath(relative);
      let key;
      if (repository === 'arkpedia/arkpedia-sd-assets') {
        key = existing.get(relative);
        if (!key) throw new Error(`Existing SD model absent from manifest: ${relative}`);
      } else if (repository === UPSTREAM) {
        const directory = path.posix.dirname(relative);
        const identity = websiteIdentity(directory);
        if (identity.facing !== facing) throw new Error(`${skin}: facing mismatch at ${directory}`);
        key = `operator/${identity.id}/${identity.variant}/${identity.facing}`;
        const sourceKey = `${commit}/${directory}`;
        const signature = JSON.stringify([model.skeleton, model.atlas, Object.entries(model.textures).sort(), model.premultipliedAlpha]);
        if (imported.has(sourceKey) && imported.get(sourceKey) !== signature) throw new Error(`Conflicting website references: ${directory}`);
        if (!imported.has(sourceKey)) {
          const retained = next.models[key];
          let source = sources.get(commit);
          if (!source) { source = gitSource(sourceRoot, UPSTREAM, commit); sources.set(commit, source); }
          const listing = source.listing(directory).filter(file => file.type === 'file');
          const read = name => {
            safePath(name);
            const file = listing.find(file => file.name === name);
            if (!file) throw new Error(`Missing original file: ${directory}/${name}`);
            return source.blob(file);
          };
          const skeletonName = path.posix.basename(relative);
          const atlasUrl = new URL(model.atlas);
          const base = `https://raw.githubusercontent.com/${UPSTREAM}/${commit}/${directory}/`;
          if (!model.atlas.startsWith(base) || path.posix.dirname(atlasUrl.pathname) !== path.posix.dirname(url.pathname)) throw new Error(`Mismatched atlas: ${skin}/${facing}`);
          const atlasName = path.posix.basename(atlasUrl.pathname);
          const skeleton = read(skeletonName), atlas = read(atlasName);
          const pages = atlasPages(atlas.toString('utf8'));
          if (JSON.stringify([...pages].sort()) !== JSON.stringify(Object.keys(model.textures).sort())
            || pages.some(page => model.textures[page] !== base + page)) throw new Error(`Mismatched textures: ${skin}/${facing}`);
          const prefix = `models/${key}/${commit}`;
          const files = new Map([[skeletonName, skeleton], [atlasName, atlas], ...pages.map(page => [page, read(page)])]);
          for (const [name, bytes] of files) {
            const at = path.join(destinationRoot, prefix, name);
            await mkdir(path.dirname(at), { recursive: true });
            try { await writeFile(at, bytes, { flag: 'wx' }); }
            catch (error) {
              if (error.code !== 'EEXIST' || !(await readFile(at)).equals(bytes)) throw error;
            }
          }
          const record = name => fileRecord(`${prefix}/${name}`, files.get(name));
          const candidate = { kind: 'operator', ...identity, spineVersion: spineVersion(skeleton),
            source: { key: 'operators', repository: UPSTREAM, commit, directory },
            skeleton: record(skeletonName), atlas: record(atlasName), textures: pages.map(record),
            premultipliedAlpha: model.premultipliedAlpha, animations: null };
          if (retained) {
            for (const field of ['source', 'skeleton', 'atlas', 'textures', 'premultipliedAlpha', 'spineVersion']) {
              if (JSON.stringify(retained[field]) !== JSON.stringify(candidate[field])) throw new Error(`Refusing to replace existing model: ${key}/${field}`);
            }
          } else next.models[key] = candidate;
          imported.set(sourceKey, signature);
          if (!retained && ++count % 100 === 0) log(`Copied ${count} original model directories`);
        }
      } else throw new Error(`Unexpected chibi repository: ${repository}`);
      references[facing] = key;
    }
    next.websiteSkins[skin] = references;
  }
  await validateManifest(next, destinationRoot);
  await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(next, null, 2)}\n`);
  await rename(`${manifestPath}.tmp`, manifestPath);
  log(`Imported ${count} models; retained ${Object.keys(previous.models).length} existing entries; mapped ${Object.keys(next.websiteSkins).length} website skins`);
  return next;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { index: { type: 'string' }, 'source-root': { type: 'string' } } });
  if (!values.index || !values['source-root']) throw new Error('Required: --index website/data/chibi-art.json --source-root pinned/upstream/checkout');
  await importWebsiteChibis({ index: JSON.parse(await readFile(values.index, 'utf8')), sourceRoot: values['source-root'] });
}
