import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const skeletonHashes = [
  '69cacd56bed04a81d54ebe763a1fbb42b9b2cc7e48e556922942866641d04bff',
  '6082f7339d7d2118294df2a8aaebe0296eee549260cf64176e8928bc18115a8d',
  '33ea1d405bad7c7abdeded91594cf0f488906e32d8a39a894677bc5c5bb774f7',
];
for (let n = 1; n <= 3; n++) test(`default Magallan drone ${n} preserves native bindings and immutable source bytes`, async () => {
  const id = `token_10005_mgllan_drone${n}`;
  const front = manifest.models[`operator/${id}/default/front`];
  const back = manifest.models[`operator/${id}/default/back`];
  for (const model of [front, back]) {
    assert.equal(model.source.key, 'global-client');
    assert.equal(model.source.bundle.path, 'pkgrps/btl_pfb_tokens_0.ab');
    assert.equal(model.source.bundle.resourceVersion, '26-09-23-17-49-43_b9cc4a');
    assert.equal(model.source.facingAlias, 'single-original-model');
    assert.ok(model.source.originalPathIds.rgbTexturePathId);
    assert.ok(model.source.originalPathIds.alphaTexturePathId);
    assert.ok(model.source.originalPathIds.controllerPathId);
    assert.ok(model.source.originalPathIds.faceSwitcherPathId);
    assert.equal(model.skeleton.sha256, skeletonHashes[n - 1]);
    assert.equal(model.spineVersion, '3.8.99');
    assert.equal(model.premultipliedAlpha, true);
    assert.deepEqual(model.animationRoles, { idle: 'Idle', deploy: 'Start', die: 'Idle',
      attack: n === 1 ? null : 'Attack', skill: null });
    assert.equal(model.animations.Die, .5);
    assert.equal(model.animations.Start, .5);
    assert.equal(model.animations.Idle, 1);
    assert.deepEqual(model.hits, n === 1 ? {} : { Attack: [n === 2 ? .233 : .7] });
    assert.equal(model.avatar.source.commit, 'd0b5af0b004b044d322397ce5ae79632b6d9fcdd');
    for (const file of [model.skeleton, model.atlas, ...model.textures, model.avatar]) {
      const data = await readFile(new URL(file.path, root));
      assert.equal(data.length, file.bytes);
      assert.equal(createHash('sha256').update(data).digest('hex'), file.sha256);
    }
  }
  assert.equal(front.skeleton.sha256, back.skeleton.sha256);
  assert.equal(front.atlas.sha256, back.atlas.sha256);
  assert.deepEqual(front.textures.map(t => t.sha256), back.textures.map(t => t.sha256));
  assert.deepEqual(front.source.originalPathIds, back.source.originalPathIds);
});
