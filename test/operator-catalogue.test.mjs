import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const catalogue=JSON.parse(await readFile(new URL('operator-catalogue.json',root),'utf8'));
const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));

test('all 374 pinned catalogue originals have inspected facings with exact manifest provenance',()=>{
  assert.equal(catalogue.schemaVersion,1);
  assert.equal(catalogue.operators.length,374);
  assert.equal(new Set(catalogue.operators.map(o=>o.id)).size,374);
  assert.equal(catalogue.scope.combatSupportEstablished,false);
  assert.equal(catalogue.scope.fullVisualOrFrameParityEstablished,false);
  assert.deepEqual(catalogue.missingOriginals,[]);
  const directories=new Set();
  for(const operator of catalogue.operators) for(const facing of ['front','back']) {
    const record=operator.facings[facing],key=`operator/${operator.id}/default/${facing}`,model=manifest.models[key];
    assert.equal(record.key,key);assert.ok(model,key);
    assert.equal(model.source.repository,catalogue.modelsSource.repository);
    assert.equal(model.source.commit,catalogue.modelsSource.commit);
    assert.equal(model.source.directory,record.sourceDirectory);
    assert.ok(Object.values(operator.sourceDirectories).includes(record.sourceDirectory));
    assert.equal(model.source.facingAlias??null,record.facingAlias);
    assert.equal(model.spineVersion,record.spineVersion);assert.match(model.spineVersion,/^3\.8\./);
    assert.equal(typeof model.premultipliedAlpha,'boolean');
    assert.equal(model.premultipliedAlpha,record.premultipliedAlpha);
    if(operator.addedInCatalogueBatch)assert.equal(model.premultipliedAlpha,true);
    assert.equal(model.skeleton.sha256,record.skeletonSha256);
    assert.equal(model.atlas.sha256,record.atlasSha256);
    assert.deepEqual(model.textures.map(t=>t.sha256),record.textureSha256);
    assert.equal(Object.keys(model.animations).length,record.animationCount);
    assert.equal(model.animationRoles.idle,record.idle);
    assert.deepEqual(model.animationRoles.attack,record.attack);
    assert.ok(Object.hasOwn(model.animations,record.idle));
    assert.ok(record.attack?.loop&&Object.hasOwn(model.animations,record.attack.loop));
    if(operator.subProfession!=='bard'&&operator.id!=='char_376_therex')assert.notEqual(record.attack.via,'idle',key);
    assert.ok(model.hits&&Object.hasOwn(model,'bounds'),key);
    assert.deepEqual(model.bounds,record.bounds);
    directories.add(record.sourceDirectory);
  }
  assert.equal(directories.size,742);
  // The catalogue records the original operator batch. Additional verified
  // tokens/enemies must not invalidate or replace any of its operator facings.
  const catalogueIds = new Set(catalogue.operators.map(o=>o.id));
  assert.equal(Object.values(manifest.models).filter(model=>catalogueIds.has(model.id)).length,
    catalogue.inventory.operatorFacingEntries);
  assert.deepEqual(Object.values(manifest.models).filter(model=>model.id.startsWith('char_') && !catalogueIds.has(model.id))
    .map(model=>`${model.id}/${model.facing}`).sort(), ['char_1001_amiya2/back','char_1001_amiya2/front']);
  assert.equal(catalogue.inventory.operatorFacingEntries,748);
  assert.equal(catalogue.inventory.newlyImportedOperators,204);
});

test('fixed-front and single-Spine exceptions alias only each exact original, never a different model',()=>{
  const fixed=['char_4091_ulika','char_4045_heidi','char_291_aglina','char_4134_cetsyr'];
  const single=['char_101_sora','char_1012_skadi2'];
  for(const [ids,layout,alias,form]of[[fixed,'front-only','fixed-original-front','Front'],
    [single,'single-spine','single-original-model','Spine']]) for(const id of ids) {
    const operator=catalogue.operators.find(o=>o.id===id);assert.equal(operator.sourceLayout,layout);
    assert.deepEqual(Object.keys(operator.sourceDirectories),[form]);
    const front=operator.facings.front,back=operator.facings.back;
    assert.equal(front.sourceDirectory,`spine/${id}/${id}/${form}`);
    assert.equal(front.sourceDirectory,back.sourceDirectory);
    assert.equal(front.facingAlias,alias);assert.equal(back.facingAlias,alias);
    assert.equal(front.skeletonSha256,back.skeletonSha256);
    assert.equal(front.atlasSha256,back.atlasSha256);
    assert.deepEqual(front.textureSha256,back.textureSha256);
  }
  const liskarm=catalogue.operators.find(o=>o.id==='char_107_liskam');
  assert.equal(liskarm.sourceLayout,'alternate-default-pair');
  for(const facing of ['front','back']) assert.equal(liskarm.facings[facing].sourceDirectory,
    `spine/char_107_liskam/char_107_liskarm/${facing==='front'?'Front':'Back'}`);
  assert.equal(catalogue.inventory.originalPairs,368);
  assert.equal(catalogue.inventory.frontOnly,fixed.length);
  assert.equal(catalogue.inventory.singleSpine,single.length);
});

test('Guard Amiya is a separately verified original Global form, with both literal skill clips', async()=>{
  for(const face of ['front','back']) {
    const m=manifest.models[`operator/char_1001_amiya2/default/${face}`];
    assert.equal(m.source.key,'global-client');
    assert.equal(m.source.bundle.path,'chararts/char_1001_amiya2.ab');
    assert.equal(m.source.bundle.md5,'6529aa0632b9dedec37a3f9c5a89ecef');
    assert.equal(m.source.bundle.resourceVersion,'26-09-23-17-49-43_b9cc4a');
    assert.equal(m.premultipliedAlpha,true);
    assert.deepEqual(m.animationRoles.skills,['Skill_1','Skill_2']);
    assert.equal(m.hits.Skill_2.length,11);
    assert.equal(m.hits.Skill_1.length,2);
    assert.ok(m.avatar && m.source.originalPathIds.faceSwitcherPathId);
  }
  const f=manifest.models['operator/char_1001_amiya2/default/front'],b=manifest.models['operator/char_1001_amiya2/default/back'];
  assert.notEqual(f.skeleton.sha256,b.skeleton.sha256);
  assert.equal(f.animationRoles.die,'Die');assert.equal(b.animationRoles.die,undefined);
});
