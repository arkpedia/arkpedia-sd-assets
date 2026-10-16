import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root))),r=JSON.parse(await readFile(new URL('source-reviews/mechanist-mcgraf.json',root))),TOKEN='token_10069_mcnist_mcgraf';
test('McGraf delivery pins original CN bundle bytes and native pointers without approving summon combat',async()=>{
 assert.equal(r.owner,'char_4230_mcnist');assert.equal(r.artworkOnly,true);assert.deepEqual(r.enabledOperators,[]);
 for(const k of['frameParity','moduleSupport','nativeParticleSupport','nativeShaderParity'])assert.equal(r[k],false);
 assert.equal(r.foundation.sha256,'951f971e410a0ddea6b08424363a07627bb398d1efbe2d8971b90cdd3dd88317');
 assert.equal(r.sourceBundle.client,'cn');assert.equal(r.sourceBundle.path,'pkgrps/btl_pfb_tokens_5.ab');assert.equal(r.sourceBundle.resourceVersion,'26-09-22-07-47-20_6c71fa');assert.match(r.sourceBundle.sha256,/^[a-f0-9]{64}$/);
 for(const[face,a]of Object.entries(r.models[TOKEN].facings)){
  const d=manifest.models[`operator/${TOKEN}/default/${face}`];assert.equal(d.source.kind,'assetbundle');assert.equal(d.source.key,'cn-client');assert.deepEqual(d.source.bundle,r.sourceBundle);assert.deepEqual(d.source.originalPathIds,a.originalPathIds);assert.equal(d.premultipliedAlpha,true);assert.equal(a.materialFloats._StraightAlphaInput,0);assert.deepEqual(a.textureDimensions,[200,200]);assert.match(a.decodedPixelSha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(d.animationRoles,a.animationRoles);assert.deepEqual(d.animations,a.durations);assert.deepEqual(d.hits,a.hits);
  for(const[k,v]of Object.entries(a.originalPathIds))assert.ok(typeof v==='string'&&/^-?[1-9]\d*$/.test(v),k);
  for(const f of[d.skeleton,d.atlas,...d.textures]){const b=await readFile(new URL(f.path,root));assert.equal(b.length,f.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);assert.deepEqual({bytes:f.bytes,sha256:f.sha256},a.files[f.path.split('/').at(-1)]);}
  const png=await readFile(new URL(d.textures[0].path,root));assert.equal(png.readUInt32BE(16),200);assert.equal(png.readUInt32BE(20),200);assert.equal(png[25],6);
 }
});
test('McGraf retains separate Front/Back skeletons, literal zero-duration loop and absent Back death',()=>{
 const front=manifest.models[`operator/${TOKEN}/default/front`],back=manifest.models[`operator/${TOKEN}/default/back`];assert.notEqual(front.skeleton.sha256,back.skeleton.sha256);
 for(const[face,d]of[['front',front],['back',back]]){
  assert.equal(d.animations.Attack,1.5);assert.deepEqual(d.hits.Attack,[.667]);assert.equal(d.animations.Skill_Loop,0);assert.deepEqual(r.models[TOKEN].facings[face].emptyClips,['Skill_Loop']);assert.equal(r.models[TOKEN].facings[face].eventPayloads.Skill_Loop,undefined);assert.equal(d.animationRoles.attack.loop,'Attack');assert.equal(d.animationRoles.skill,null);assert.equal(d.animationRoles.die,face==='front'?'Die':null);assert.deepEqual(r.models[TOKEN].facings[face].missingOptionalAliases,face==='front'?[]:['Die']);
 }
});
