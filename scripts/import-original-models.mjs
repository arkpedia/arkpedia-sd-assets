// Extracted original-client models have content-hash provenance, not a Git origin.
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { root } from './import-model.mjs';
import { atlasPages, component, fileRecord, modelPrefix, safePath, spineVersion, validateManifest } from './manifest.mjs';

async function prepareOriginalModels({ metadata, bundle, extractedRoot, destinationRoot }, manifest) {
  const info = JSON.parse(await readFile(metadata, 'utf8'));
  const original = await readFile(bundle);
  const sourceBundle = info.sourceBundle;
  if (original.length !== sourceBundle.bytes
    || createHash('md5').update(original).digest('hex') !== sourceBundle.md5
    || createHash('sha256').update(original).digest('hex') !== sourceBundle.sha256)
    throw new Error('Original model bundle bytes do not match the reviewed source');
  for (const [id, originalRecord] of Object.entries(info.models)) {
    component(id);
    const kind = originalRecord.kind ?? 'operator';
    if (!['operator', 'enemy'].includes(kind) || kind === 'enemy' && !id.startsWith('enemy_'))
      throw new Error(`${id}: invalid original model kind`);
    if (kind === 'enemy' && originalRecord.facings) throw new Error(`${id}: enemy imports require one original default skeleton`);
    const facings = kind === 'enemy' ? ['default'] : originalRecord.facings ? Object.keys(originalRecord.facings) : ['front', 'back'];
    if (originalRecord.facings && (!originalRecord.facings.front || !originalRecord.facings.back
      || facings.some(facing => !['front', 'back', 'down'].includes(facing))))
      throw new Error(`${id}: expected exactly front and back original facings, with optional native down`);
    if (originalRecord.facings?.down && (!id.startsWith('token_')
      || ['skeletonAnimationPathId', 'skeletonDataAssetPathId', 'textAssetPathId'].some(key =>
        typeof originalRecord.facings.down.originalPathIds?.[key] !== 'string'
        || !/^-?[1-9]\d*$/.test(originalRecord.facings.down.originalPathIds[key]))))
      throw new Error(`${id}: native down facing requires an original token skeleton chain`);
    for (const facing of facings) {
      const record = originalRecord.facings?.[facing] ?? originalRecord;
      const roles = record.animationRoles;
      if (typeof roles?.idle !== 'string' || !Object.hasOwn(record.durations ?? {}, roles.idle)
        || ['deploy', 'die'].some(role => roles[role] != null
          && (typeof roles[role] !== 'string' || !Object.hasOwn(record.durations ?? {}, roles[role]))))
        throw new Error(`${id}: original animation roles require literal existing clip names`);
      safePath(record.directory);
      const directory = path.resolve(extractedRoot, record.directory);
      const names = Object.keys(record.files);
      const skel = names.find(name => name.endsWith('.skel'));
      const atlas = names.find(name => name.endsWith('.atlas'));
      if (names.filter(name => name.endsWith('.skel')).length !== 1
        || names.filter(name => name.endsWith('.atlas')).length !== 1) throw new Error(`${id}: ambiguous original model`);
      const bytes = new Map();
      for (const name of names) {
        safePath(name);
        const data = await readFile(path.join(directory, name));
        if (data.length !== record.files[name].bytes
          || createHash('sha256').update(data).digest('hex') !== record.files[name].sha256)
          throw new Error(`${id}: extracted file changed: ${name}`);
        bytes.set(name, data);
      }
      const pages = atlasPages(bytes.get(atlas).toString('utf8'));
      if (spineVersion(bytes.get(skel)) !== record.spineVersion
        || pages.some(name => !bytes.has(name))) throw new Error(`${id}: incomplete extracted model`);
    // Preserve legacy single-skeleton aliases. Tokens such as Phantom's clone
    // instead provide the exact skeleton selected by each native animator ref.
      const key = `${kind}/${id}/default/${facing}`;
      const source = { key: `${sourceBundle.client ?? 'global'}-client`, kind: 'assetbundle',
        bundle: sourceBundle, directory: sourceBundle.path,
        extractedSkeleton: skel,
        ...(originalRecord.facings || kind === 'enemy' ? { originalPathIds: record.originalPathIds }
          : { facingAlias: 'single-original-model',
            ...(record.originalPathIds ? { originalPathIds: record.originalPathIds } : {}) }),
        transforms: sourceBundle.transforms };
      const prefix = modelPrefix(key, source);
      // Exact body bytes may be reused by several native enemy prefabs. Roles
      // remain per enemy; the canonical skeleton/atlas/pages are stored once.
      const checksum = data => createHash('sha256').update(data).digest('hex');
      const bodyHashes = [skel, atlas, ...pages].map(name => checksum(bytes.get(name)));
      const existingIndex = Object.keys(manifest.models).indexOf(key);
      const shared = kind === 'enemy' && !bytes.has('avatar.png') ? Object.entries(manifest.models).find(([otherKey, model],index) =>
        (existingIndex < 0 || index < existingIndex)
        && otherKey !== key && model.kind === 'enemy' && !model.assetAlias && model.premultipliedAlpha === true
        && model.spineVersion === record.spineVersion && model.skeleton.sha256 === bodyHashes[0]
        && model.atlas.sha256 === bodyHashes[1] && model.textures.length === pages.length
        && pages.every((_page,index) => model.textures[index].sha256 === bodyHashes[index+2])) : null;
      if (!shared) await mkdir(path.join(destinationRoot, prefix), { recursive: true });
      for (const [name, data] of shared ? [] : bytes) {
        const destination = path.join(destinationRoot, prefix, name);
        try {
          const existing = await readFile(destination);
          if (!existing.equals(data)) throw new Error(`${id}: immutable model file changed`);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
          await writeFile(destination, data);
        }
      }
      const file = name => fileRecord(`${prefix}${name}`, bytes.get(name));
      // A UI Sprite may be independently reviewed after its native skeleton.
      // Reimporting the same body source must not discard that portrait. A
      // changed body source still needs a fresh explicit avatar attachment.
      const previous = manifest.models[key];
      const retainedAvatar = !bytes.has('avatar.png') && previous?.avatar
        && JSON.stringify(previous.source) === JSON.stringify(source) ? previous.avatar : null;
      manifest.models[key] = { kind, id, variant: 'default', facing, source,
        spineVersion: record.spineVersion, skeleton: shared ? shared[1].skeleton : file(skel), atlas: shared ? shared[1].atlas : file(atlas),
        textures: shared ? shared[1].textures : pages.map(file), premultipliedAlpha: true,
        ...(shared ? {assetAlias: shared[0]} : {}),
        animations: record.durations, animationRoles: record.animationRoles,
        hits: record.hits, bounds: record.bounds,
        ...(bytes.has('avatar.png') ? { avatar: { ...file('avatar.png'), source: info.avatarSource } } : {}),
        ...(retainedAvatar ? { avatar: retainedAvatar } : {}),
      };
    }
  }
  return Object.keys(info.models);
}

// All source bundles and extracted files are checked before one manifest
// publication. A rejected batch can leave unreferenced immutable files only.
export async function importOriginalModelBatches({batches, destinationRoot = root}) {
  if (!Array.isArray(batches) || !batches.length) throw Error('Expected original model batches');
  const manifestPath = path.join(destinationRoot, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const imported = [];
  for (const batch of batches) imported.push(...await prepareOriginalModels({...batch,destinationRoot},manifest));
  await validateManifest(manifest, destinationRoot);
  await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(`${manifestPath}.tmp`, manifestPath);
  return imported;
}

export async function importOriginalModels({destinationRoot = root, ...batch}) {
  return importOriginalModelBatches({batches:[batch],destinationRoot});
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const { values } = parseArgs({ options: {
    metadata: { type: 'string' }, bundle: { type: 'string' }, 'extracted-root': { type: 'string' },
  } });
  if (!values.metadata || !values.bundle || !values['extracted-root']) throw new Error('Required: --metadata --bundle --extracted-root');
  console.log(await importOriginalModels({ metadata: values.metadata, bundle: values.bundle, extractedRoot: values['extracted-root'] }));
}
