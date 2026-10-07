// Extracted original-client models have content-hash provenance, not a Git origin.
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { root } from './import-model.mjs';
import { atlasPages, component, fileRecord, modelPrefix, safePath, spineVersion, validateManifest } from './manifest.mjs';

export async function importOriginalModels({ metadata, bundle, extractedRoot }) {
  const info = JSON.parse(await readFile(metadata, 'utf8'));
  const original = await readFile(bundle);
  const sourceBundle = info.sourceBundle;
  if (original.length !== sourceBundle.bytes
    || createHash('md5').update(original).digest('hex') !== sourceBundle.md5
    || createHash('sha256').update(original).digest('hex') !== sourceBundle.sha256)
    throw new Error('Original model bundle bytes do not match the reviewed source');
  const manifestPath = path.join(root, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const [id, record] of Object.entries(info.models)) {
    component(id);
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
    // These original token containers have one auto-facing skeleton. Both
    // renderer facings refer to that same source, rather than a costume model.
    for (const facing of ['front', 'back']) {
      const key = `operator/${id}/default/${facing}`;
      const source = { key: 'global-client', kind: 'assetbundle',
        bundle: sourceBundle, directory: sourceBundle.path,
        extractedSkeleton: skel, facingAlias: 'single-original-model',
        transforms: sourceBundle.transforms };
      const prefix = modelPrefix(key, source);
      await mkdir(path.join(root, prefix), { recursive: true });
      for (const [name, data] of bytes) {
        const destination = path.join(root, prefix, name);
        try {
          const existing = await readFile(destination);
          if (!existing.equals(data)) throw new Error(`${id}: immutable model file changed`);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
          await writeFile(destination, data);
        }
      }
      const file = name => fileRecord(`${prefix}${name}`, bytes.get(name));
      manifest.models[key] = { kind: 'operator', id, variant: 'default', facing, source,
        spineVersion: record.spineVersion, skeleton: file(skel), atlas: file(atlas),
        textures: pages.map(file), premultipliedAlpha: true,
        animations: record.durations, animationRoles: record.animationRoles,
        hits: record.hits, bounds: record.bounds,
        ...(bytes.has('avatar.png') ? { avatar: { ...file('avatar.png'), source: info.avatarSource } } : {}),
      };
    }
  }
  await validateManifest(manifest, root);
  await writeFile(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`);
  await rename(`${manifestPath}.tmp`, manifestPath);
  return Object.keys(info.models);
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const { values } = parseArgs({ options: {
    metadata: { type: 'string' }, bundle: { type: 'string' }, 'extracted-root': { type: 'string' },
  } });
  if (!values.metadata || !values.bundle || !values['extracted-root']) throw new Error('Required: --metadata --bundle --extracted-root');
  console.log(await importOriginalModels({ metadata: values.metadata, bundle: values.bundle, extractedRoot: values['extracted-root'] }));
}
