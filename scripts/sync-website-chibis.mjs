import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { gitSource } from './source-git.mjs';
import { websiteIdentity } from './import-website-chibis.mjs';
import { atlasPages, component, fileRecord, spineVersion, validateManifest } from './manifest.mjs';

export const REPOSITORY = 'fexli/ArknightsResource';
const TABLE = 'gamedata/excel/skin_table.json';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blobHash = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

/** Discover exact native prefabs from the skin table and files at ONE upstream commit. */
export async function syncWebsiteChibis({ sourceRoot, commit, destinationRoot = root, log = console.log }) {
  const source = gitSource(sourceRoot, REPOSITORY, commit);
  const tableFile = source.tree('gamedata/excel').find(file => file.path === TABLE);
  if (!tableFile) throw new Error('Upstream skin table missing');
  const table = JSON.parse(source.blob(tableFile));
  if (!table.charSkins || Array.isArray(table.charSkins)) throw new Error('Invalid upstream skin table');
  const manifestPath = path.join(destinationRoot, 'manifest.json');
  const previous = JSON.parse(await readFile(manifestPath, 'utf8'));
  // A truncated table must not silently stop discovery while retaining stale mappings.
  for (const skin of Object.keys(previous.websiteSkins ?? {})) {
    if (!table.charSkins[skin]) throw new Error(`Upstream table lost published skin ${skin}`);
  }
  const next = { ...previous, models: { ...previous.models }, websiteSkins: { ...previous.websiteSkins }, websiteDefaultSkins: { ...previous.websiteDefaultSkins } };
  const directories = new Map();
  const prefabs = new Map();
  for (const file of source.tree('spine')) {
    if (!/^spine\/char_\w+\/[\w-]+\/(?:Front|Back|Spine)\/[^/]+$/.test(file.path)) continue;
    const directory = path.posix.dirname(file.path);
    if (!directories.has(directory)) directories.set(directory, []);
    directories.get(directory).push(file);
    if (file.path.endsWith('.skel')) {
      const prefab = directory.split('/')[2];
      const facing = websiteIdentity(directory).facing;
      if (!prefabs.has(prefab)) prefabs.set(prefab, new Map());
      const owner = directory.split('/')[1];
      if (!prefabs.get(prefab).has(owner)) prefabs.get(prefab).set(owner, {});
      const facings = prefabs.get(prefab).get(owner);
      if (facings[facing] && facings[facing] !== directory) {
        if (path.posix.dirname(facings[facing]) !== path.posix.dirname(directory)) throw new Error(`Ambiguous original prefab: ${prefab}/${facing}`);
        // Some exports include a supplementary Spine as well as explicit battle facings.
        // Prefer the native Front directory; Spine supplies front only when Front is absent.
        if (directory.endsWith('/Spine')) continue;
      }
      facings[facing] = directory;
    }
  }
  const prefabFacings = (prefab, owner) => {
    const originals = prefabs.get(prefab);
    if (!originals) return {};
    if (originals.has(owner)) return originals.get(owner);
    if (originals.size !== 1) throw new Error(`Ambiguous original operator for ${owner}/${prefab}`);
    // The exact prefab named by gamedata can be shared; never choose between operators.
    return originals.values().next().value;
  };
  const cached = new Map();
  let imported = 0, addedSkins = 0;
  const pending = [];
  const modelKey = async (directory, retainedKey) => {
    // Explicit reviewed aliases (including original-client models) are never guessed away.
    const retained = previous.models[retainedKey];
    if (retained && (retained.source.repository !== REPOSITORY || retained.source.directory !== directory)) return retainedKey;
    if (cached.has(directory)) return cached.get(directory);
    const files = directories.get(directory);
    const skeletons = files.filter(file => file.name.endsWith('.skel'));
    const atlases = files.filter(file => file.name.endsWith('.atlas'));
    if (skeletons.length !== 1 || atlases.length !== 1) throw new Error(`Incomplete or ambiguous original model: ${directory}`);
    if (retained) {
      const records = [retained.skeleton, retained.atlas, ...retained.textures];
      const unchanged = await Promise.all(records.map(async record => {
        const file = files.find(entry => entry.name === path.posix.basename(record.path));
        return file && blobHash(await readFile(path.join(destinationRoot, record.path))) === file.blob;
      }));
      if (unchanged.every(Boolean)) { cached.set(directory, retainedKey); return retainedKey; }
    }
    const identity = websiteIdentity(directory);
    // Keep reviewed simulator records intact; automation owns separate website variants.
    const variant = `website_${directory.split('/')[2].replace(/^build_/, '')}`;
    component(variant);
    const key = `operator/${identity.id}/${variant}/${identity.facing}`;
    const skeleton = source.blob(skeletons[0]), atlas = source.blob(atlases[0]);
    const version = spineVersion(skeleton);
    if (!version.startsWith('3.8.')) throw new Error(`Website renderer does not support Spine ${version}: ${directory}`);
    const pages = atlasPages(atlas.toString('utf8'));
    const bytes = new Map([[skeletons[0].name, skeleton], [atlases[0].name, atlas]]);
    for (const page of pages) {
      const file = files.find(entry => entry.name === page);
      if (!file) throw new Error(`Missing original atlas page: ${directory}/${page}`);
      bytes.set(page, source.blob(file));
    }
    const prefix = `models/${key}/${commit}`;
    for (const [name, buffer] of bytes) {
      if (!/^[A-Za-z0-9_.-]+$/.test(name)) throw new Error(`Unsupported website asset filename: ${directory}/${name}`);
      if (!buffer.length) throw new Error(`Empty original file: ${directory}/${name}`);
      const target = path.join(destinationRoot, prefix, name);
      await mkdir(path.dirname(target), { recursive: true });
      try { await writeFile(target, buffer, { flag: 'wx' }); }
      catch (error) { if (error.code !== 'EEXIST' || !(await readFile(target)).equals(buffer)) throw error; }
    }
    const record = name => fileRecord(`${prefix}/${name}`, bytes.get(name));
    next.models[key] = { kind: 'operator', ...identity, variant, spineVersion: version,
      source: { key: 'operators', repository: REPOSITORY, commit, directory },
      skeleton: record(skeletons[0].name), atlas: record(atlases[0].name), textures: pages.map(record),
      // This mirror's viewer-ready PNG export uses straight alpha, as in the original website importer.
      premultipliedAlpha: retained?.premultipliedAlpha ?? false, animations: null };
    cached.set(directory, key);
    imported++;
    return key;
  };
  for (const [skin, data] of Object.entries(table.charSkins)) {
    if (!data.charId?.startsWith('char_')) continue;
    if (!/^char_[\w]+(?:@[\w]+)?#\d+\+?$/.test(skin)) throw new Error(`Invalid website skin ID: ${skin}`);
    const prefab = data.battleSkin?.skinOrPrefabId;
    const defaultBattle = !prefab || prefab === 'DefaultSkin';
    const battle = (defaultBattle ? data.tmplId || data.charId : prefab).replaceAll('#', '_');
    component(battle);
    const existing = previous.websiteSkins?.[skin] ?? {};
    const battleDirectories = prefabFacings(battle, data.tmplId || data.charId);
    const template = data.tmplId && data.tmplId !== data.charId;
    const reviewedFacings = {};
    if (template && defaultBattle) for (const facing of ['front', 'back']) {
      const key = `operator/${data.tmplId}/default/${facing}`;
      const model = previous.models[key];
      if (model?.kind === 'operator' && typeof model.premultipliedAlpha === 'boolean' && model.spineVersion.startsWith('3.8.')) reviewedFacings[facing] = key;
    }
    if (!battleDirectories.front && !battleDirectories.back && !reviewedFacings.front && !reviewedFacings.back && !existing.front && !existing.back) { pending.push(skin); continue; }
    const facings = { ...existing };
    for (const facing of ['front', 'back']) {
      if (reviewedFacings[facing]) facings[facing] = reviewedFacings[facing];
      else if (battleDirectories[facing]) {
        const retained = template && defaultBattle && previous.models[existing[facing]]?.id !== data.tmplId ? undefined : existing[facing];
        facings[facing] = await modelKey(battleDirectories[facing], retained);
      }
    }
    const building = (data.buildingId || battle).replaceAll('#', '_');
    component(building);
    const buildingOwner = /^char_\d+_[A-Za-z0-9]+/.exec(building)?.[0] || data.charId;
    const walk = prefabFacings(`build_${building}`, buildingOwner).walk;
    if (walk) {
      const retained = template && previous.models[existing.walk]?.source.directory !== walk ? undefined : existing.walk;
      facings.walk = await modelKey(walk, retained);
    }
    next.websiteSkins[skin] = facings;
    if (template && defaultBattle && data.isBuySkin !== true && skin.split('#')[0] === data.tmplId) {
      if (!next.websiteDefaultSkins[data.tmplId] || skin === `${data.tmplId}#1`) next.websiteDefaultSkins[data.tmplId] = skin;
    }
    if (!previous.websiteSkins?.[skin]) addedSkins++;
  }
  next.websiteSource = { repository: REPOSITORY, commit, table: TABLE, pending: pending.sort() };
  await validateManifest(next, destinationRoot);
  const text = `${JSON.stringify(next, null, 2)}\n`;
  if (await readFile(manifestPath, 'utf8') !== text) {
    await writeFile(`${manifestPath}.tmp`, text);
    await rename(`${manifestPath}.tmp`, manifestPath);
  }
  log(`Imported ${imported} models; added ${addedSkins} skins; published ${Object.keys(next.websiteSkins).length} skins; ${pending.length} awaiting upstream battle files.`);
  if (pending.length) log(`Pending original models: ${pending.join(', ')}`);
  return next;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { 'source-root': { type: 'string' }, commit: { type: 'string' } } });
  if (!values['source-root']) throw new Error('Required: --source-root upstream/git/checkout [--commit full-SHA]');
  const commit = values.commit || execFileSync('git', ['rev-parse', 'origin/main'], { cwd: values['source-root'], encoding: 'utf8' }).trim();
  await syncWebsiteChibis({ sourceRoot: values['source-root'], commit });
}
