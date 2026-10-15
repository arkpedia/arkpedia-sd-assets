import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/vetochki.json',root)));
test('Vetochki retains original files and native PMA without implying playable or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4207_branch');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of ['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'9166668d00123dc82ad7a2116141ef55a3d3cc9328217d832ca40104508d1705');
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);
  for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of [d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Vetochki retains native S1/S2 roles, event times, explicit End mixes and missing Back death',()=>{
 for(const face of ['front','back']){
  const d=m.models[`operator/char_4207_branch/default/${face}`];
  assert.equal(d.animationRoles.skills[0].via,'attack');assert.equal(d.animationRoles.skills[0].loop,'Attack');
  assert.equal(d.animationRoles.skills[1].begin,'Skill_2_Begin');assert.equal(d.animationRoles.skills[1].loop,'Skill_2_Loop');
  assert.equal(d.animationRoles.skills[1].idle,'Skill_2_Idle');assert.equal(d.animationRoles.skills[1].end,'Skill_2_End');
  assert.equal(d.animationRoles.die,face==='front'?'Die':null);assert.equal(d.animations.Stun,undefined);
  assert.deepEqual(d.hits.Skill_2_Loop,[.8]);
 }
});
