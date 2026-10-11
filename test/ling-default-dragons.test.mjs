import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const skeletonHashes = [
  '4d46e3af2673b5c317c4fc83ab553ae8b6039292a074f1b9eb6cc3d08a01a396',
  'b9c0cbe49ab9542341f8dcbf77d90f79e997ef2beaee8fb08669ff86013b6ed8',
  '487d4382bdae9194ff1045ab27e23401a250518cc66354eaf95b4219d53a13cf',
];
for (let n = 1; n <= 3; n++) test(`default Ling dragon ${n} preserves native bindings and immutable source bytes`, async () => {
  const id = `token_10020_ling_soul${n}`;
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
    assert.deepEqual(model.animationRoles, { idle: 'Idle', deploy: 'Start', die: 'Die',
      attack: 'Attack', skill: n === 2 ? 'Skill' : null });
    assert.equal(model.animations.Die, 1);
    assert.equal(model.animations.Start, 1);
    assert.equal(model.animations.Idle, 1.333);
    assert.deepEqual(model.hits, { Attack: [.367], ...(n === 2 ? { Skill: [.5] } : {}), ...(n === 3 ? { Attack_02: [.5] } : {}) });
    if (n === 3) {
      assert.equal(model.animations.Attack_02, 1.667);
      assert.equal(model.animations.Idle_02, 2);
      assert.equal(model.animations.Start_02, .667);
      assert.equal(model.animations.Die_02, 1);
    }
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
