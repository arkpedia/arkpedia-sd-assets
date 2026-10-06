import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './import-model.mjs';
import { validateManifest } from './manifest.mjs';

const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
await validateManifest(manifest, root);
console.log(`Validated ${Object.keys(manifest.models).length} complete models`);
