// SPDX-License-Identifier: GPL-3.0-or-later
// Attach an independently exported original UI Sprite to existing native models.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {root} from './import-model.mjs';
import {safePath,component,modelPrefix,fileRecord,validateManifest} from './manifest.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function importNativeAvatar({metadata,image,destinationRoot=root}){
 const raw=await readFile(metadata),proof=JSON.parse(raw),png=await readFile(image),a=proof.avatar,s=proof.sprite,hub=proof.hub;
 component(proof.token);component(proof.operator);safePath(proof.sdReview);
 if(proof.schemaVersion!==1||proof.artworkOnly!==true||JSON.stringify(proof.enabledOperators)!=='[]'||proof.frameParity!==false
  ||!proof.token.startsWith('token_')||!proof.sdReview.startsWith('source-reviews/')||proof.source.client!=='cn'
  ||!/^[a-f0-9]{64}$/.test(proof.source.manifestSha256)||!/^[a-f0-9]{64}$/.test(proof.foundation.sha256)||!/^[a-f0-9]{64}$/.test(proof.recipeSha256)
  ||hub.key!==proof.token||hub.value!==`Arts/CharAvatars/${proof.token}`||hub.packingTag!=='UI_CHAR_AVATAR'
  ||s.name!==proof.token||s.container!==`dyn/arts/charavatars/${proof.token}.png`||s.packingRotation!==0
  ||[s.spritePathId,s.texturePathId,hub.pathId].some(v=>typeof v!=='string'||!(/^-?[1-9]\d*$/).test(v)))throw Error('Missing original avatar source/hub/Sprite proof');
 for(const b of[s.bundle,hub.bundle]){
  safePath(b.path);const archive=encodeURIComponent(b.path.replaceAll('/','_').replace(/\.ab$/,'.dat'));
  if(!Number.isSafeInteger(b.bytes)||b.bytes<1||!/^[a-f0-9]{32}$/.test(b.md5)||!/^[a-f0-9]{64}$/.test(b.sha256)
   ||b.url!==`https://ak.hycdn.cn/assetbundle/official/Android/assets/${proof.source.resourceVersion}/${archive}`)throw Error('Unpinned original avatar bundle');
 }
 if(a.name!=='avatar.png'||a.bytes!==png.length||a.sha256!==sha(png)||JSON.stringify(a.dimensions)!=='[180,180]'
  ||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||png.readUInt32BE(16)!==180||png.readUInt32BE(20)!==180||png[24]!==8||png[25]!==6
  ||!/^[a-f0-9]{64}$/.test(a.decodedPixelSha256))throw Error('Original avatar PNG bytes/dimensions changed');
 const file=path.join(destinationRoot,'manifest.json'),manifest=JSON.parse(await readFile(file)),source={kind:'cn-native-sprite',resourceVersion:proof.source.resourceVersion,bundleSha256:s.bundle.sha256,
  spritePathId:s.spritePathId,texturePathId:s.texturePathId,proof:proof.sdReview,proofSha256:sha(raw)};
 for(const facing of['front','back']){
  const key=`operator/${proof.token}/default/${facing}`,model=manifest.models[key];
  if(model?.id!==proof.token||model.source?.key!=='cn-client'||model.source.kind!=='assetbundle'||model.source.bundle.resourceVersion!==proof.source.resourceVersion)throw Error('Avatar requires existing matching native token models');
  const relative=modelPrefix(key,model.source)+'avatar.png',destination=path.join(destinationRoot,relative);await mkdir(path.dirname(destination),{recursive:true});
  try{if(!(await readFile(destination)).equals(png))throw Error('Immutable avatar file already differs');}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(destination,png);}
  model.avatar={...fileRecord(relative,png),source};
 }
 const proofPath=path.join(destinationRoot,proof.sdReview);await mkdir(path.dirname(proofPath),{recursive:true});
 try{if(!(await readFile(proofPath)).equals(raw))throw Error('Immutable avatar proof already differs');}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(proofPath,raw);}
 await validateManifest(manifest,destinationRoot);await writeFile(file+'.tmp',JSON.stringify(manifest,null,2)+'\n');await rename(file+'.tmp',file);
 return{token:proof.token,models:2,avatarBytes:png.length,decodedPixelSha256:a.decodedPixelSha256};
}
if(import.meta.url===new URL(`file://${process.argv[1]}`).href){const{values}=parseArgs({options:{metadata:{type:'string'},image:{type:'string'}}});
 if(!values.metadata||!values.image)throw Error('Required: --metadata --image');console.log(await importNativeAvatar(values));}
