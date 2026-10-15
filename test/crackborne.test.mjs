import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/crackborne.json',root)));
test('Crackborne preserves original files/pixels and native PMA without combat or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4225_tanya');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'03e393621ac50e478e6816846c0fbb9b3d0dc5409e4914d7ec483fc1858c967c');assert.match(receipt.recipeSha256,/^[a-f0-9]{64}$/);
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of[d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Crackborne retains both ordinary variants, S1 mode and fixed one-shot S2 literal roles',()=>{
 for(const face of['front','back']){
  const d=m.models[`operator/char_4225_tanya/default/${face}`];
  assert.equal(d.animationRoles.attack.loop,'Attack_1');assert.deepEqual(d.animationRoles.attackVariants,{'0':{loop:'Attack_1'},'1':{loop:'Attack_2'}});
  assert.deepEqual(d.animationRoles.skills[0],{begin:'Skill_1_Begin',loop:'Skill_1_Loop',end:'Skill_1_End',idle:'Skill_1_Idle',index:0,via:'skill'});
  assert.deepEqual(d.animationRoles.skills[1],{begin:null,loop:'Skill_2',end:null,index:1,via:'skill'});
  for(const clip of['Attack_1','Attack_2'])assert.deepEqual(d.hits[clip],[.567]);assert.deepEqual(d.hits.Skill_1_Loop,[.633]);assert.deepEqual(d.hits.Skill_2,[.667]);
  assert.equal(d.animations.Attack,undefined);assert.equal(d.animationRoles.attackDown,null);assert.equal(d.animationRoles.die,face==='front'?'Die':null);
 }
});
