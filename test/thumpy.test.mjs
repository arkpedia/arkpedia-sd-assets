import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/thumpy.json',root)));
test('Thumpy preserves original files/pixels and native PMA without combat or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4235_thumpy');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'9a727b44984f8286d4dd8921a0c2e4e6f47e1ac62f8407bca6be0a7b421e69da');assert.match(receipt.recipeSha256,/^[a-f0-9]{64}$/);
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of[d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Thumpy retains all three original Begin/Loop/Idle/End families and native release markers',()=>{
 for(const face of['front','back']){
  const d=m.models[`operator/char_4235_thumpy/default/${face}`];
  for(let i=0;i<3;i++)assert.deepEqual(d.animationRoles.skills[i],{begin:`Skill_${i+1}_Begin`,loop:`Skill_${i+1}_Loop`,end:`Skill_${i+1}_End`,idle:`Skill_${i+1}_Idle`,index:i,via:'skill'});
  for(const[clip,time]of[['Attack',.3],['Skill_1_Loop',.267],['Skill_2_Begin',.233],['Skill_2_Loop',.233],['Skill_3_Begin',.367],['Skill_3_Loop',.3]])assert.deepEqual(d.hits[clip],[time]);
  assert.equal(d.animationRoles.attack.loop,'Attack');assert.equal(d.animationRoles.attackDown,null);assert.equal(d.animationRoles.die,face==='front'?'Die':null);
 }
});
