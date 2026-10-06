import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root, importModel } from './import-model.mjs';

// Refresh curated models only. Retain earlier immutable revisions and never drop an entry.
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
for (const model of Object.values(manifest.models)) {
  const { id, variant, facing, source } = model;
  console.log(`Refreshed ${await importModel({ source: source.key, directory: source.directory, id, variant, facing })}`);
}
