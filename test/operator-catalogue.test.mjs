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
  assert.equal(Object.keys(manifest.models).filter(key=>key.startsWith('operator/char_')).length,
    catalogue.inventory.operatorFacingEntries);
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
