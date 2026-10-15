import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/varkaris.json',root)));
test('Varkáris retains original files and native PMA without implying playable or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4166_varkis');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of ['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'2726cf348a031ad5330fe733096a604c3109f9558a38896031870a003ccc9574');
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);
  for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of [d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Varkáris retains native S1/S2 roles, event times, explicit End mixes and missing Back death',()=>{
 for(const face of ['front','back']){
  const d=m.models[`operator/char_4166_varkis/default/${face}`];
  assert.equal(d.animationRoles.skills[0].via,'skill');assert.equal(d.animationRoles.skills[0].loop,'Skill');
  assert.equal(d.animationRoles.skills[1].begin,'Skill_2_Begin');assert.equal(d.animationRoles.skills[1].loop,'Skill_2_Loop');
  assert.equal(d.animationRoles.skills[1].idle,'Skill_2_Idle');assert.equal(d.animationRoles.skills[1].end,'Skill_2_End');
  assert.equal(d.animationRoles.die,face==='front'?'Die':null);assert.equal(d.animations.Stun,undefined);
  assert.deepEqual(d.hits.Skill,[.467,.5,.533]);assert.deepEqual(d.hits.Skill_2_Loop,[.567]);
  assert.equal(d.animationRoles.attackDown?.loop,face==='front'?'Attack_Down':undefined);
 }
});
