import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));

test('Cherry-3 front/back share the literal original model, embedded alpha and static wreckage clips', async () => {
  const id = 'token_10037_mitm_trshrb';
  const models = ['front', 'back'].map(face => manifest.models[`operator/${id}/default/${face}`]);
  for (const model of models) {
    assert.equal(model.source.key, 'global-client');
    assert.equal(model.source.bundle.path, 'pkgrps/btl_pfb_tokens_0.ab');
    assert.equal(model.source.bundle.resourceVersion, '26-09-23-17-49-43_b9cc4a');
    assert.equal(model.source.facingAlias, 'single-original-model');
    assert.equal(model.source.originalPathIds.textAssetPathId, '5937099011106347295');
    assert.equal(model.source.originalPathIds.materialPathId, '-8743880024613573945');
    assert.equal(model.source.originalPathIds.rgbTexturePathId, '2194246625555547790');
    assert.equal(model.source.originalPathIds.alphaTexturePathId, '0');
    assert.equal(model.skeleton.sha256, '1ff78d0ad6122b8eb7815909fba960da903c7c1ce888aa4a0507f6e02e2c72b1');
    assert.equal(model.spineVersion, '3.8.99'); assert.equal(model.premultipliedAlpha, true);
    assert.deepEqual(model.animationRoles, { idle: 'Idle_1', deploy: 'Start', die: 'Die', attack: 'Attack', skill: 'Skill_Loop' });
    for (const clip of ['Waste', 'Idle_2', 'Stun_2', 'Stun_3']) assert.equal(model.animations[clip], 0);
    assert.equal(model.animations.Idle, undefined); assert.equal(model.animations.Start, 1);
    assert.deepEqual(model.hits, { Attack: [.467] });
    assert.equal(model.avatar.source.commit, 'd0b5af0b004b044d322397ce5ae79632b6d9fcdd');
    for (const file of [model.skeleton, model.atlas, ...model.textures, model.avatar]) {
      const bytes = await readFile(new URL(file.path, root));
      assert.equal(bytes.length, file.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    }
  }
  assert.equal(models[0].skeleton.sha256, models[1].skeleton.sha256);
  assert.equal(models[0].textures[0].sha256, models[1].textures[0].sha256);
});
