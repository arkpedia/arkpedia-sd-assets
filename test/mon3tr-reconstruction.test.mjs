import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const receipt = JSON.parse(await readFile(new URL('source-reviews/mon3tr-reconstruction.json', root), 'utf8'));

test('Reconstruction aliases the original Single model and preserves its empty S3 pose without an invented attack role', async () => {
  assert.equal(receipt.artworkOnly, true);
  assert.deepEqual(receipt.enabledOperators, []);
  const id = 'token_10050_monstr_prosts';
  const source = receipt.models[id];
  const models = ['front', 'back'].map(face => manifest.models[`operator/${id}/default/${face}`]);
  for (const model of models) {
    assert.equal(model.source.facingAlias, 'single-original-model');
    assert.deepEqual(model.source.bundle, receipt.sourceBundle);
    assert.deepEqual(model.source.originalPathIds, source.originalPathIds);
    assert.equal(model.source.originalPathIds.textAssetPathId, '4576702927653873844');
    assert.equal(model.skeleton.sha256, '1b515f35f427d9e281055cabb218074beed5bbff48321a0ecc9d4e5e0dfdb82a');
    assert.equal(model.spineVersion, '3.8.99');
    assert.equal(model.premultipliedAlpha, true);
    assert.deepEqual(model.animationRoles, { idle: 'Idle', deploy: 'Start', attack: null, die: 'Die', skill: null });
    assert.equal(model.animations.Skill_3, 0);
    assert.equal(model.animations.Skill_3_Begin, .667);
    assert.deepEqual(model.hits, { Attack: [.033] });
    assert.equal(model.avatar.source.commit, 'd0b5af0b004b044d322397ce5ae79632b6d9fcdd');
    for (const file of [model.skeleton, model.atlas, ...model.textures, model.avatar]) {
      const bytes = await readFile(new URL(file.path, root));
      const name = file.path.split('/').at(-1);
      assert.deepEqual({ bytes: file.bytes, sha256: file.sha256 }, source.files[name]);
      assert.equal(bytes.length, file.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    }
  }
  assert.equal(models[0].skeleton.sha256, models[1].skeleton.sha256);
  assert.equal(models[0].textures[0].sha256, models[1].textures[0].sha256);
});
