import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/cairn.json',root)));
test('Cairn preserves original files/pixels and native PMA without combat or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4214_cairn');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'c3b66218299c5e18daea25e691e7777a3273329e96ae757f067434ba118e876a');assert.match(receipt.recipeSha256,/^[a-f0-9]{64}$/);
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of[d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Cairn retains timed S1 tracks and one-shot S2 with a single native release marker',()=>{
 for(const face of['front','back']){
  const d=m.models[`operator/char_4214_cairn/default/${face}`];
  assert.deepEqual(d.animationRoles.skills[0],{begin:'Skill_1_Begin',loop:'Skill_1_Loop',end:'Skill_1_End',idle:'Skill_1_Idle',index:0,via:'skill'});
  assert.deepEqual(d.animationRoles.skills[1],{begin:null,loop:'Skill_2',end:null,index:1,via:'skill'});
  for(const clip of['Attack','Skill_1_Loop','Skill_2'])assert.deepEqual(d.hits[clip],[.6]);
  assert.equal(d.animationRoles.attack.loop,'Attack');assert.equal(d.animationRoles.attackDown,null);assert.equal(d.animationRoles.die,face==='front'?'Die':null);
  assert.equal(d.animations.Skill_2_Loop,undefined);assert.equal(d.animations.Skill_2_Begin,undefined);
 }
});
