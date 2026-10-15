import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),m=JSON.parse(await readFile(new URL('manifest.json',root)));
const receipt=JSON.parse(await readFile(new URL('source-reviews/timeslot.json',root)));
test('Timeslot preserves original files/pixels and native PMA without combat or shader approval',async()=>{
 assert.equal(receipt.owner,'char_4236_tmslot');assert.equal(receipt.artworkOnly,true);assert.deepEqual(receipt.enabledOperators,[]);
 for(const key of['frameParity','nativeParticleSupport','nativeShaderParity'])assert.equal(receipt[key],false);
 assert.equal(receipt.foundation.sha256,'8faaa4d95957d4db73907351051b8d8b5ffacf4edf22f63ee695e052afb7a7c2');assert.match(receipt.recipeSha256,/^[a-f0-9]{64}$/);
 for(const r of Object.values(receipt.ownerModels)){
  const d=m.models[r.modelKey];assert.deepEqual(d.source,r.source);assert.equal(d.source.commit,'d0b5af0b004b044d322397ce5ae79632b6d9fcdd');
  assert.deepEqual({skeleton:d.skeleton,atlas:d.atlas,textures:d.textures},r.files);for(const[k,v]of Object.entries(r.metadata))assert.deepEqual(d[k],v);
  assert.equal(r.materialFloats._StraightAlphaInput,0);assert.equal(d.premultipliedAlpha,true);
  for(const f of[d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);}
 }
});
test('Timeslot keeps common S1, original S2 attack and asymmetric overload transition clips distinct',()=>{
 for(const face of['front','back']){
  const d=m.models[`operator/char_4236_tmslot/default/${face}`];
  assert.deepEqual(d.animationRoles.skills[0],{begin:null,loop:'Attack',end:null,index:0,via:'attack'});
  assert.deepEqual(d.animationRoles.skills[1],{begin:null,loop:'Skill_2',end:null,index:1,via:'skill'});
  assert.deepEqual(d.hits.Attack,[.633]);assert.deepEqual(d.hits.Skill_2,[.5]);
  assert.equal(d.animations.Skill_2_Overload_Begin,face==='front'?1:.833);assert.equal(d.animations.Skill_2_Overload_End,.567);assert.equal(d.animations.Skill_2_Overload_Loop,1);
  assert.equal(d.animations.Skill_2_Begin,undefined);assert.equal(d.hits.Skill_2_Overload_Begin,undefined);
  assert.equal(d.animationRoles.attack.loop,'Attack');assert.equal(d.animationRoles.die,face==='front'?'Die':null);
 }
});
