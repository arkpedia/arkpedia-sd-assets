import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root)));
const receipt = JSON.parse(await readFile(new URL('source-reviews/jacinta.json', root)));
test('Jacinta artwork keeps both original skeletons and binds both channel animation families', async () => {
  assert.equal(receipt.artworkOnly, true); assert.deepEqual(receipt.enabledOperators, []);
  assert.equal(receipt.foundation.commit, 'a550f5e048bb94e7cdefc6eb97a4091f0c4c7add');
  assert.equal(receipt.foundation.client, '26-09-22-07-47-20_6c71fa');
  for (const key of ['frameParity', 'nativeParticleSupport', 'nativeShaderParity']) assert.equal(receipt[key], false);
  for (const face of ['Front', 'Back']) {
    const row = receipt.models[face], model = manifest.models[row.modelKey];
    assert.deepEqual(model, row.model); assert.equal(model.skeleton.sha256, row.originalBinding.sha256);
    assert.match(row.atlasNormalization, /all other text is identical/);
    assert.equal(model.premultipliedAlpha, false); assert.equal(model.animationRoles.attack.loop, 'Attack');
    for (let i = 0; i < 2; i++) {
      const role = model.animationRoles.skills[String(i)];
      assert.equal(role.begin, `Skill_${i + 1}_Begin`); assert.equal(role.loop, `Skill_${i + 1}_Loop`);
      assert.equal(role.end, `Skill_${i + 1}_End`); assert.equal(role.via, 'skill');
    }
    assert.equal(row.eventPayloads.Attack[0].time, .46666666865348816);
    assert.equal(model.animations.Attack, 1.3);
    if (face === 'Back') assert.equal(model.animations.Die, undefined);
    for (const file of [model.skeleton, model.atlas, ...model.textures]) {
      const bytes = await readFile(new URL(file.path, root)); assert.equal(bytes.length, file.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    }
  }
});
