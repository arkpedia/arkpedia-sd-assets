import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/kichisei.json',root)));
test('Kichisei preserves original files/pixels and native PMA without combat or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4203_kichi');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'171761adf7b8bc65b03ea6f0d95f2a8bf9c3d0c16bcf836d99e2a1088448b025');assert.match(receipt.recipeSha256,/^[a-f0-9]{64}$/);
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of[d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Kichisei keeps both skills’ source Begin/Loop/Idle/End, directional attacks and absent Back death',()=>{
 for(const face of['front','back']){
  const d=m.models[`operator/char_4203_kichi/default/${face}`];
  for(const i of[1,2]){assert.deepEqual(d.animationRoles.skills[i-1],{begin:`Skill_${i}_Begin`,loop:`Skill_${i}_Loop`,end:`Skill_${i}_End`,idle:`Skill_${i}_Idle`,index:i-1,via:'skill'});assert.deepEqual(d.hits[`Skill_${i}_Loop`],[.5]);}
  assert.equal(d.animationRoles.attack.loop,'Attack');assert.deepEqual(d.hits.Attack,[.5]);
  assert.equal(d.animationRoles.attackDown?.loop,face==='front'?'Attack_Down':undefined);assert.equal(d.animationRoles.die,face==='front'?'Die':null);
  assert.equal(d.animations.Skill_Down_1_Loop!=null,face==='front');assert.equal(d.animations.Skill_Down_2_Loop!=null,face==='front');
 }
});
