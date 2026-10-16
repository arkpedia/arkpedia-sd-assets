import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/mechanist.json',root)));
test('Mechanist preserves original files/pixels and native PMA without combat or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4230_mcnist');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'951f971e410a0ddea6b08424363a07627bb398d1efbe2d8971b90cdd3dd88317');assert.match(receipt.recipeSha256,/^[a-f0-9]{64}$/);
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of[d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Mechanist keeps original S2/S3 modes, Front downward clips and no invented S1 begin track',()=>{
 for(const face of['front','back']){
  const d=m.models[`operator/char_4230_mcnist/default/${face}`];
  assert.deepEqual(d.animationRoles.skills[0],{begin:null,loop:'Skill_1',end:null,index:0,via:'skill'});
  for(const i of[1,2])assert.deepEqual(d.animationRoles.skills[i],{begin:`Skill_${i+1}_Begin`,loop:`Skill_${i+1}_Loop`,end:`Skill_${i+1}_End`,index:i,via:'skill',idle:`Skill_${i+1}_Idle`});
  assert.equal(d.animationRoles.attack.loop,'Attack_A');assert.deepEqual(d.hits.Attack_A,[.433]);assert.deepEqual(d.hits.Attack_B,[.433]);assert.deepEqual(d.hits.Skill_1,[1]);
  assert.equal(d.animationRoles.die,face==='front'?'Die':null);assert.equal(d.animationRoles.attackDown?.loop,face==='front'?'Attack_Down':undefined);
  assert.equal(d.animations.mcnist_skill_01_start_01,undefined);assert.equal(d.animations.Skill_Down_2_Loop,face==='front'?1.2:undefined);
 }
});
