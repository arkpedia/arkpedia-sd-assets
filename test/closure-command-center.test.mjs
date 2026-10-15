import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const m = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const receipt = JSON.parse(await readFile(new URL('source-reviews/closure-command-center.json', root), 'utf8'));
const token = 'token_10066_closur_ourbase', owner = 'char_4228_closur';

test('Closure command center retains distinct original CN facings and has no invented attack or missing Back death', async () => {
  assert.equal(receipt.artworkOnly, true); assert.deepEqual(receipt.enabledOperators, []);
  assert.equal(receipt.frameParity, false); assert.equal(receipt.nativeParticleSupport, false);
  assert.equal(receipt.sourceBundle.client, 'cn');
  assert.equal(receipt.sourceBundle.sha256, 'af23c7f497862f38be2cdca0cd4079d44753bde8d61b97398e5a2777a54281e4');
  for (const face of ['front', 'back']) {
    const d = m.models[`operator/${token}/default/${face}`], r = receipt.models[token].facings[face];
    assert.equal(d.source.key, 'cn-client'); assert.deepEqual(d.source.bundle, receipt.sourceBundle);
    assert.deepEqual(d.source.originalPathIds, r.originalPathIds);
    assert.equal(d.source.originalPathIds.rootPathId, '-5788352084631041927');
    assert.equal(d.source.originalPathIds.animatorPathId, '-4151407806632834951');
    assert.equal(d.source.facingAlias, undefined); assert.equal(d.premultipliedAlpha, true);
    assert.deepEqual(d.animationRoles, { idle: 'Idle', deploy: 'Start', attack: null, skill: null, die: face === 'front' ? 'Die' : null });
    assert.equal(d.animations.Attack, undefined); assert.equal(d.animations.Stun, undefined);
    assert.equal(d.animations.Start, 1); assert.equal(d.animations.Die, face === 'front' ? 1 : undefined);
    assert.deepEqual(d.hits, {}); assert.deepEqual(r.missingOptionalAliases, face === 'front' ? [] : ['Die']);
    for (const f of [d.skeleton, d.atlas, ...d.textures, d.avatar]) {
      const bytes = await readFile(new URL(f.path, root)), hash = createHash('sha256').update(bytes).digest('hex');
      assert.equal(f.sha256, hash); assert.equal(f.bytes, bytes.length);
      assert.deepEqual({ bytes: bytes.length, sha256: hash }, r.files[f.path.split('/').at(-1)]);
    }
  }
  assert.equal(m.models[`operator/${token}/default/front`].skeleton.sha256, '1352451da8f1358be37b313d5e4376bd66a524967a5b324f36325bf76b25b329');
  assert.equal(m.models[`operator/${token}/default/back`].skeleton.sha256, '27498403d1606c842f6f2441603c9f3cca19b42ef670051bd049ccc2ccbe50ef');
});

test('Closure owner metadata uses native PMA and continuous-fire clips without changing its pinned original files', async () => {
  for (const face of ['front', 'back']) {
    const r = receipt.ownerModels[face], d = m.models[r.modelKey];
    assert.equal(d.id, owner); assert.equal(d.source.commit, 'd0b5af0b004b044d322397ce5ae79632b6d9fcdd');
    assert.deepEqual(d.source, r.source); assert.deepEqual({ skeleton: d.skeleton, atlas: d.atlas, textures: d.textures }, r.files);
    for (const [key, value] of Object.entries(r.metadata)) assert.deepEqual(d[key], value);
    assert.equal(d.premultipliedAlpha, true);
    assert.deepEqual(d.animationRoles.attack, { begin: 'Attack_Begin', loop: 'Attack_Loop', end: null });
    assert.equal(d.animationRoles.die, face === 'front' ? 'Die' : null);
    assert.equal(d.animationRoles.skill, null); assert.deepEqual(d.hits.Skill_3_Loop, [.133]);
    assert.equal(r.materialFloats._StraightAlphaInput, 0);
    for (const f of [d.skeleton, d.atlas, ...d.textures]) {
      const bytes = await readFile(new URL(f.path, root));
      assert.equal(bytes.length, f.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), f.sha256);
    }
  }
});
