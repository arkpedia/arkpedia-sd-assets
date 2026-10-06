import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateStages } from '../scripts/stages.mjs';
const root = new URL('../', import.meta.url).pathname;
const manifest = JSON.parse(await readFile(new URL('../stage-manifest.json', import.meta.url)));
test('published stage geometry and textures match their hashes and buffer ranges', async () => {
  await validateStages(manifest, root);
});
test('rejects tampered stage manifest checksums and paths outside the repository', async () => {
  for (const change of [{ sha256: '0'.repeat(64) }, { path:'../manifest.json' }]) {
    const bad = structuredClone(manifest); Object.assign(bad.stages['0-1'],change);
    await assert.rejects(validateStages(bad,root), /checksum|reference/i);
  }
});
test('standard gate pack files are verified before publication', async () => {
  const bad = structuredClone(manifest);
  bad.effects.standardGates.sha256 = '0'.repeat(64);
  await assert.rejects(validateStages(bad,root), /checksum/);
});
