import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {importNativeAvatar} from '../scripts/import-native-avatar.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),TOKEN='token_10069_mcnist_mcgraf',hash=b=>createHash('sha256').update(b).digest('hex');
const original=JSON.parse(await readFile(path.join(root,'manifest.json'))),proofRaw=await readFile(path.join(root,'source-reviews/mechanist-mcgraf-avatar.json')),proof=JSON.parse(proofRaw);
test('McGraf card portrait preserves exact native hub, container and Sprite/Texture2D binding with unchanged lossless pixels',async()=>{
 assert.equal(proof.artworkOnly,true);assert.deepEqual(proof.enabledOperators,[]);assert.equal(proof.frameParity,false);assert.equal(proof.token,TOKEN);assert.equal(proof.hub.key,TOKEN);assert.equal(proof.hub.value,'Arts/CharAvatars/'+TOKEN);
 assert.equal(proof.source.resourceVersion,'26-09-22-07-47-20_6c71fa');assert.equal(proof.source.manifestSha256,'d1ac02a61d98e6e4c772335bb85dc44da4794a0a8bc915354b6f9ffbc7ec1f35');
 assert.equal(proof.sprite.bundle.path,'spritepack/ui_char_avatar_13.ab');assert.equal(proof.sprite.bundle.sha256,'e5c3889ce7efb39ebb30edc382a7f16724369618335427f7c496ce4cff221c28');
 assert.equal(proof.sprite.spritePathId,'-97459599149998769');assert.equal(proof.sprite.texturePathId,'-1509622144603693745');assert.equal(proof.avatar.decodedPixelSha256,'2ac756b7c0b05f616f7e1f394c23014047a6e82ea0f670630fbb22c37a88798a');
 assert.equal(proof.avatar.sha256,'d665f457f1eb8233b410ce1e971eac123a04721adba1dbacf12d29a74cd21871');
 for(const face of['front','back']){const model=original.models[`operator/${TOKEN}/default/${face}`],a=model.avatar,png=await readFile(path.join(root,a.path));assert.equal(hash(png),a.sha256);assert.equal(a.sha256,proof.avatar.sha256);assert.equal(a.bytes,24576);assert.equal(png.readUInt32BE(16),180);assert.equal(png.readUInt32BE(20),180);assert.equal(png[25],6);assert.equal(a.source.proofSha256,hash(proofRaw));assert.equal(model.animations.Skill_Loop,0);}
});
async function fixture(){const dir=await mkdtemp(path.join(os.tmpdir(),'arkpedia-native-avatar-')),models={};
 for(const face of['front','back']){const key=`operator/${TOKEN}/default/${face}`,m=structuredClone(original.models[key]);delete m.avatar;models[key]=m;for(const f of[m.skeleton,m.atlas,...m.textures]){const to=path.join(dir,f.path);await mkdir(path.dirname(to),{recursive:true});await writeFile(to,await readFile(path.join(root,f.path)));}}
 await writeFile(path.join(dir,'manifest.json'),JSON.stringify({schemaVersion:1,models}));const metadata=path.join(dir,'proof.json'),image=path.join(dir,'avatar.png');await writeFile(metadata,proofRaw);await writeFile(image,await readFile(path.join(root,original.models[`operator/${TOKEN}/default/front`].avatar.path)));
 return{dir,metadata,image,models,args:{metadata,image,destinationRoot:dir}};
}
test('Native avatar attachment changes only portrait metadata, is idempotent and keeps all original body bytes',async()=>{const f=await fixture();try{
 await importNativeAvatar(f.args);const first=JSON.parse(await readFile(path.join(f.dir,'manifest.json')));for(const[k,m]of Object.entries(first.models)){const body={...m};delete body.avatar;assert.deepEqual(body,f.models[k]);assert.deepEqual(m.avatar,original.models[k].avatar);}await importNativeAvatar(f.args);assert.deepEqual(JSON.parse(await readFile(path.join(f.dir,'manifest.json'))),first);
 }finally{await rm(f.dir,{recursive:true,force:true});}});
for(const change of['approved','parity','hub','container','sprite-number','texture-pointer','bundle','version','dimensions','hash','image'])test(`Native avatar ${change} input cannot publish a portrait manifest`,async()=>{
 const f=await fixture();try{const p=structuredClone(proof);
  if(change==='approved')p.enabledOperators=[p.operator];if(change==='parity')p.frameParity=true;if(change==='hub')p.hub.key='borrowed';if(change==='container')p.sprite.container='dyn/arts/charavatars/borrowed.png';if(change==='sprite-number')p.sprite.spritePathId=Number(p.sprite.spritePathId);if(change==='texture-pointer')p.sprite.texturePathId='0';if(change==='bundle')p.sprite.bundle.sha256='invalid';if(change==='version')p.source.resourceVersion='different';if(change==='dimensions')p.avatar.dimensions=[90,90];if(change==='hash')p.avatar.sha256='0'.repeat(64);if(change==='image')await writeFile(f.image,Buffer.from('not the original PNG'));
  await writeFile(f.metadata,JSON.stringify(p));await assert.rejects(importNativeAvatar(f.args));const m=JSON.parse(await readFile(path.join(f.dir,'manifest.json')));assert.ok(Object.values(m.models).every(v=>v.avatar===undefined));
 }finally{await rm(f.dir,{recursive:true,force:true});}
});
