import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/pedro.json',root)));
test('Pedro preserves original files/pixels and native PMA without combat or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4234_pedro');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'7439d18a99868fb6aeb5a664588e1d4745c5a7b7bd116817980e1befd373528c');assert.match(receipt.recipeSha256,/^[a-f0-9]{64}$/);
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of[d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Pedro separates Front downward clips from absent Back clips and preserves both one-shot skills',()=>{
 for(const face of['front','back']){
  const d=m.models[`operator/char_4234_pedro/default/${face}`];
  for(const [index,clip,marker]of[[0,'Skill_1',.533],[1,'Skill_2',.733]]){
   assert.deepEqual(d.animationRoles.skills[index],{begin:null,loop:clip,end:null,index,via:'skill'});
   assert.deepEqual(d.hits[clip],[marker]);assert.equal(d.animations[clip],2.1);
  }
  assert.deepEqual(d.hits.Attack,[.6]);assert.equal(d.animationRoles.attack.loop,'Attack');
  assert.equal(d.animationRoles.die,face==='front'?'Die':null);
  assert.equal(d.animationRoles.attackDown?.loop,face==='front'?'Attack_Down':undefined);
  for(const clip of['Attack_Down','Skill_Down_1','Skill_Down_2'])assert.equal(d.animations[clip],face==='front'?2.1:undefined);
  assert.equal(d.animations.Skill_2_Begin,undefined);
 }
});
