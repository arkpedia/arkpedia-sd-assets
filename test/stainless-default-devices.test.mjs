import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const hashes = {
  token_10027_ironmn_pile1: ['3f00e388f99e482be1e154da4c31c9119302557dec2a36854406d2eab3f8e2ce'],
  token_10027_ironmn_pile2: ['36d00c3ffe246d278637bc9b69e636b6f806e3f783fc3208494e150963a460cb'],
  token_10027_ironmn_pile3: ['e7b3526fed9d7e82d679389d639f8da63f3fe4b0892f6056f85ba2cc2cb4caab',
    '48dba37acccb6d376ed9763ee557e61da7f6dacae9b26a72b682ea86b0c64589',
    '7652244f01382486a9df1a64c687d9893305ddde720b1d396beb10964b233ffb'],
};
for (let n = 1; n <= 3; n++) test(`Stainless original device ${n} keeps native files, facings and literal clips`, async () => {
  const id = `token_10027_ironmn_pile${n}`, facings = n < 3 ? ['front', 'back'] : ['front', 'back', 'down'];
  const models = facings.map(face => manifest.models[`operator/${id}/default/${face}`]);
  for (const [i, model] of models.entries()) {
    assert.equal(model.source.key, 'global-client');
    assert.equal(model.source.bundle.path, 'pkgrps/btl_pfb_tokens_0.ab');
    assert.equal(model.source.bundle.resourceVersion, '26-09-23-17-49-43_b9cc4a');
    assert.equal(model.source.facingAlias, n < 3 ? 'single-original-model' : undefined);
    for (const field of ['rootPathId', 'controllerPathId', 'animatorPathId', 'faceSwitcherPathId',
      'skeletonAnimationPathId', 'skeletonDataAssetPathId', 'textAssetPathId', 'materialPathId', 'rgbTexturePathId', 'alphaTexturePathId'])
      assert.match(model.source.originalPathIds[field], /^-?[1-9]\d*$/);
    assert.equal(model.skeleton.sha256, hashes[id][n < 3 ? 0 : i]);
    assert.equal(model.spineVersion, '3.8.99'); assert.equal(model.premultipliedAlpha, true);
    assert.deepEqual(model.animationRoles, { idle: 'Idle', deploy: 'Start', die: n < 3 ? 'End' : 'Die',
      attack: n < 3 ? null : 'Attack', skill: null });
    assert.equal(model.animations.Start, 1);
    assert.equal(model.animations[n < 3 ? 'End' : 'Die'], 1);
    assert.deepEqual(model.hits, n < 3 ? {} : { Attack: [.067] });
    assert.equal(model.avatar.source.commit, 'd0b5af0b004b044d322397ce5ae79632b6d9fcdd');
    for (const file of [model.skeleton, model.atlas, ...model.textures, model.avatar]) {
      const bytes = await readFile(new URL(file.path, root));
      assert.equal(bytes.length, file.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    }
  }
  assert.equal(new Set(models.map(m => m.skeleton.sha256)).size, n < 3 ? 1 : 3);
});
