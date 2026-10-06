import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from './import-model.mjs';
import { validateManifest } from './manifest.mjs';

const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
await validateManifest(manifest, root);
console.log(`Validated ${Object.keys(manifest.models).length} complete models`);
const { validateStages } = await import('./stages.mjs');
await validateStages(JSON.parse(await readFile(path.join(root, 'stage-manifest.json'), 'utf8')), root);
console.log('Validated stage scenery files and geometry');
