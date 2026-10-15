import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root)));
const receipt = JSON.parse(await readFile(new URL('source-reviews/akkord.json', root)));
test('Akkord metadata binds both original CN-verified facings without changing model files or claiming combat approval', async () => {
  assert.equal(receipt.artworkOnly, true); assert.deepEqual(receipt.enabledOperators, []);
  assert.equal(receipt.foundation.commit, 'a550f5e048bb94e7cdefc6eb97a4091f0c4c7add');
  assert.equal(receipt.foundation.client, '26-09-22-07-47-20_6c71fa');
  for (const key of ['frameParity', 'nativeParticleSupport', 'nativeShaderParity']) assert.equal(receipt[key], false);
  for (const face of ['Front', 'Back']) {
    const row = receipt.models[face], model = manifest.models[row.modelKey];
    assert.deepEqual(model, row.model); assert.equal(model.skeleton.sha256, row.originalBinding.sha256);
    assert.equal(model.source.commit, 'd0b5af0b004b044d322397ce5ae79632b6d9fcdd');
    assert.equal(model.premultipliedAlpha, false); assert.equal(model.animationRoles.idle, 'Idle');
    assert.equal(model.animationRoles.skills['0'].loop, 'Attack');
    assert.equal(model.animationRoles.skills['1'].loop, 'Skill_2_Loop');
    assert.equal(model.animationRoles.skills['1'].idle, 'Skill_2_Idle');
    assert.equal(model.animationRoles.skills['1'].begin, null); assert.equal(model.animationRoles.skills['1'].end, null);
    assert.equal(row.eventPayloads.Attack[0].time, .6666666865348816);
    assert.equal(row.eventPayloads.Skill_2_Loop[0].time, .6666666865348816);
    if (face === 'Back') { assert.equal(model.animations.Die, undefined); assert.equal(model.animations.Attack_Down, undefined); }
    for (const file of [model.skeleton, model.atlas, ...model.textures]) {
      const bytes = await readFile(new URL(file.path, root)); assert.equal(bytes.length, file.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    }
  }
});
