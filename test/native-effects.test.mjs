// SPDX-License-Identifier: MIT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,mkdir,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {validateNativeEffect,validateNativeEffects} from '../scripts/native-effects.mjs';
import {importNativeEffect} from '../scripts/import-native-effect.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const registry=JSON.parse(await readFile(path.join(root,'native-effect-manifest.json')));
const entry=registry.effects.tragodia;
const metadata=path.join(root,entry.path),directory=path.dirname(metadata);
const original=JSON.parse(await readFile(metadata));
const sha=b=>createHash('sha256').update(b).digest('hex');
async function temporary(t){const d=await mkdtemp(path.join(tmpdir(),'native-art-'));t.after(()=>rm(d,{recursive:true,force:true}));return d;}
test('published original effect package verifies every immutable file and source binding',async()=>{
  assert.equal(await validateNativeEffects(registry,root),1);
  assert.deepEqual(await validateNativeEffect(original,directory),{files:79,roots:33,textures:72});
  assert.deepEqual(original.scope.preparedRoots,['phatm2_skill_03_prison_01']);
  assert.equal(original.scope.publicBattleApproved,false);
});
test('rejects changed delivery scope, missing files, rebound roots and source receipts',async()=>{
  const cases=[
    [m=>{m.scope.publicBattleApproved=true;},/metadata/],
    [m=>{m.scope.nativePixelParity=true;},/metadata/],
    [m=>{m.id='..';},/metadata/],
    [m=>{m.pack.path='../native-effects.bin';},/reference/],
    [m=>{m.pack.path='/native-effects.bin';},/reference/],
    [m=>{m.pack.path='manifest.json';},/reserved/],
    [m=>{m.shaders.path=m.animations.path;},/Duplicate/],
    [m=>{m.pack.sha256='0'.repeat(64);},/checksum/],
    [m=>{m.pack.decodedSha256='0'.repeat(64);},/Decoded.*checksum/],
    [m=>{m.pack.decodedBytes++;},/Decoded.*checksum/],
    [m=>{m.animations.bytes++;},/checksum/],
    [m=>{m.scope.preparedRoots=['invented-cage'];},/source mismatch/],
    [m=>{m.roots.phatm2_skill_03_prison_01='invented';},/source mismatch/],
    [m=>{m.operator='char_450_necras';},/source mismatch/],
    [m=>{m.sourceBundles[0].sha256='0'.repeat(64);},/original receipts/],
    [m=>{delete m.sourceReceipts.effects;},/source receipts/],
    [m=>{delete m.textures[Object.keys(m.textures)[0]];},/original receipts/],
  ];
  for(const [change,error]of cases){const m=structuredClone(original);change(m);await assert.rejects(validateNativeEffect(m,directory),error);}
  const wrong=structuredClone(registry);wrong.effects.tragodia.sha256='0'.repeat(64);
  await assert.rejects(validateNativeEffects(wrong,root),/checksum/);
});
test('rehashed animation from a different pack cannot pass source-chain validation',async t=>{
  const d=await temporary(t);await cp(directory,d,{recursive:true});
  const m=structuredClone(original),a=JSON.parse(await readFile(path.join(d,m.animations.path)));
  a.sourcePackSha256='0'.repeat(64);const bytes=Buffer.from(JSON.stringify(a));
  await writeFile(path.join(d,m.animations.path),bytes);m.animations.bytes=bytes.length;m.animations.sha256=sha(bytes);
  await assert.rejects(validateNativeEffect(m,d),/source mismatch/);
});
test('rehashed packed texture inventory cannot silently omit a delivered texture',async t=>{
  const d=await temporary(t);await cp(directory,d,{recursive:true});
  const m=structuredClone(original),p=JSON.parse(gunzipSync(await readFile(path.join(d,m.pack.path))));
  delete p.textures[Object.keys(p.textures)[0]];
  const decoded=Buffer.from(JSON.stringify(p)),bytes=gzipSync(decoded);
  await writeFile(path.join(d,m.pack.path),bytes);
  Object.assign(m.pack,{bytes:bytes.length,sha256:sha(bytes),decodedBytes:decoded.length,decodedSha256:sha(decoded)});
  await assert.rejects(validateNativeEffect(m,d),/source mismatch|original receipts|texture/);
});
test('repeated import is byte-identical and preserves existing model and stage registries',async t=>{
  const d=await temporary(t);await mkdir(d,{recursive:true});
  const sentinel=Buffer.from('{"unrelated":"retained"}\n');
  for(const name of ['manifest.json','stage-manifest.json'])await writeFile(path.join(d,name),sentinel);
  const first=await importNativeEffect({metadata,sourceRoot:directory,destinationRoot:d});
  const before=await readFile(path.join(d,'native-effect-manifest.json'));
  assert.deepEqual(await importNativeEffect({metadata,sourceRoot:directory,destinationRoot:d}),first);
  assert.deepEqual(await readFile(path.join(d,'native-effect-manifest.json')),before);
  for(const name of ['manifest.json','stage-manifest.json'])assert.deepEqual(await readFile(path.join(d,name)),sentinel);
  assert.equal(await validateNativeEffects(JSON.parse(before),d),1);
});
test('conflicting immutable input cannot overwrite files or advance the registry',async t=>{
  const d=await temporary(t),first=await importNativeEffect({metadata,sourceRoot:directory,destinationRoot:d});
  const before=await readFile(path.join(d,'native-effect-manifest.json'));
  const file=path.join(d,path.dirname(first.path),original.animations.path);
  await writeFile(file,'altered');
  await assert.rejects(importNativeEffect({metadata,sourceRoot:directory,destinationRoot:d}),/Immutable native effect changed/);
  assert.deepEqual(await readFile(path.join(d,'native-effect-manifest.json')),before);
  assert.equal(await readFile(file,'utf8'),'altered');
});
