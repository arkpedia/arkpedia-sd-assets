import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root)));
const receipt = JSON.parse(await readFile(new URL('source-reviews/ripresa.json', root)));
test('Ripresa keeps original Front/Back bytes and binds only literal normal/S1/S2 clips', async () => {
  assert.equal(receipt.artworkOnly, true); assert.deepEqual(receipt.enabledOperators, []);
  assert.equal(receipt.foundation.commit, 'a550f5e048bb94e7cdefc6eb97a4091f0c4c7add');
  assert.equal(receipt.foundation.client, '26-09-22-07-47-20_6c71fa');
  for (const k of ['frameParity', 'nativeParticleSupport', 'nativeShaderParity']) assert.equal(receipt[k], false);
  for (const face of ['Front', 'Back']) {
    const row = receipt.models[face], m = manifest.models[row.modelKey]; assert.deepEqual(m, row.model);
    assert.equal(m.skeleton.sha256, row.originalBinding.sha256); assert.match(row.atlasNormalization, /all other text is identical/);
    assert.equal(m.source.commit, 'd0b5af0b004b044d322397ce5ae79632b6d9fcdd'); assert.equal(m.premultipliedAlpha, false);
    assert.equal(m.animations.Attack, 2.9); assert.equal(m.animations.Skill_1, 2.9); assert.equal(m.animations.Skill_2, 1.5);
    assert.equal(row.eventPayloads.Attack[0].time, .5); assert.equal(row.eventPayloads.Skill_1[0].time, .5);
    assert.equal(row.eventPayloads.Skill_2[0].time, .2666666805744171); assert.equal(row.eventPayloads.Skill_2[1].name, 'AnimeAttack');
    assert.equal(row.eventPayloads.Skill_2[1].time, 1.3666666746139526);
    assert.equal(m.animationRoles.die, face === 'Back' ? null : 'Die');
    if (face === 'Back') assert.equal(m.animations.Die, undefined);
    for (let i = 0; i < 2; i++) {
      const role = m.animationRoles.skills[String(i)]; assert.equal(role.loop, `Skill_${i + 1}`);
      assert.equal(role.begin, null); assert.equal(role.end, null); assert.equal(role.via, 'attack');
    }
    for (const file of [m.skeleton, m.atlas, ...m.textures]) {
      const bytes = await readFile(new URL(file.path, root)); assert.equal(bytes.length, file.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    }
  }
});
