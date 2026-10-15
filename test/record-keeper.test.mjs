import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/record-keeper.json',root)));
test('Record Keeper retains original files and native PMA without implying playable or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4196_reckpr');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of ['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'f90d041979ffbb891c4083c5392ba44c15ab7a265fe63bc67db4957f1a0a6430');
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);
  for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of [d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Record Keeper skill metadata keeps literal source clips, distinct events and the original missing Back death',()=>{
 for(const face of ['front','back']){
  const d=m.models[`operator/char_4196_reckpr/default/${face}`];
  assert.equal(d.animationRoles.skills[0].via,'attack');assert.equal(d.animationRoles.skills[0].loop,'Attack');
  assert.equal(d.animationRoles.skills[1].begin,'Skill_Begin');assert.equal(d.animationRoles.skills[1].loop,'Skill_Loop');
  assert.equal(d.animationRoles.skills[1].idle,'Skill_Idle');assert.equal(d.animationRoles.skills[1].end,null);
  assert.equal(d.animationRoles.die,face==='front'?'Die':null);assert.equal(d.animations.Stun,undefined);
  assert.deepEqual(d.hits.Skill_Loop,face==='front'?[.6]:[.567]);
 }
});
