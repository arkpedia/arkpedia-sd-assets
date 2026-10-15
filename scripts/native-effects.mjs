// SPDX-License-Identifier: MIT
// Game-art data validation only. Does not execute shaders or approve a battle kit.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
export function nativeEffectPath(file) {
  return typeof file==='string'&&/^[\w./-]+\.(bin|json|webp)$/.test(file)
    &&file.split('/').every(p=>p&&p!=='.'&&p!=='..');
}
export function nativeEffectFiles(meta) {
  return [meta.pack,meta.animations,meta.shaders,meta.builtinMeshes,
    ...Object.values(meta.sourceReceipts??{}),...Object.values(meta.textures??{})];
}
export async function checkedNativeFile(root,entry) {
  if(!entry||!nativeEffectPath(entry.path)||!Number.isSafeInteger(entry.bytes)||entry.bytes<1
    ||entry.bytes>64*1024*1024||!/^[a-f0-9]{64}$/.test(entry.sha256??''))throw Error('Invalid native effect file reference');
  const bytes=await readFile(path.join(root,entry.path));
  if(bytes.length!==entry.bytes||createHash('sha256').update(bytes).digest('hex')!==entry.sha256)
    throw Error('Native effect file checksum mismatch: '+entry.path);
  return bytes;
}
export async function validateNativeEffect(meta,root) {
  if(meta?.schemaVersion!==1||!/^[a-z][a-z0-9-]*$/.test(meta.id??'')||!/^char_\d+_\w+$/.test(meta.operator??'')
    ||typeof meta.resourceVersion!=='string'||!/^\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}_[a-f0-9]+$/.test(meta.resourceVersion)
    ||meta.scope?.artworkOnly!==true||meta.scope.publicBattleApproved!==false
    ||meta.scope.compiledFrameParity!==false||meta.scope.nativePixelParity!==false
    ||!Array.isArray(meta.scope.preparedRoots)||!meta.scope.preparedRoots.length
    ||new Set(meta.scope.preparedRoots).size!==meta.scope.preparedRoots.length
    ||!Array.isArray(meta.sourceBundles)||!meta.sourceBundles.length
    ||!meta.sourceReceipts||Object.keys(meta.sourceReceipts).sort().join(',')!=='animations,effects,shaders')
    throw Error('Invalid native effect metadata or incomplete native source receipts');
  const files=nativeEffectFiles(meta),names=new Set();
  for(const e of files){
    if(!e||!nativeEffectPath(e.path))throw Error('Invalid native effect file reference');
    if(e.path==='manifest.json'||names.has(e.path))throw Error('Duplicate or reserved native effect file');
    names.add(e.path);
  }
  const entries=new Map(await Promise.all(files.map(async e=>[e.path,await checkedNativeFile(root,e)])));
  const json=e=>JSON.parse(entries.get(e.path));
  if(meta.pack.encoding!=='gzip-json'||!Number.isSafeInteger(meta.pack.decodedBytes)
    ||meta.pack.decodedBytes<1||meta.pack.decodedBytes>64*1024*1024||!/^[a-f0-9]{64}$/.test(meta.pack.decodedSha256??''))
    throw Error('Invalid native effect compression receipt');
  const decoded=gunzipSync(entries.get(meta.pack.path),{maxOutputLength:64*1024*1024});
  if(decoded.length!==meta.pack.decodedBytes||createHash('sha256').update(decoded).digest('hex')!==meta.pack.decodedSha256)
    throw Error('Decoded native effect checksum mismatch');
  const pack=JSON.parse(decoded),animations=json(meta.animations),shaders=json(meta.shaders),builtin=json(meta.builtinMeshes);
  if(!pack.records||!pack.roots||JSON.stringify(pack.roots)!==JSON.stringify(meta.roots)
    ||JSON.stringify(pack.unresolvedReferences)!==JSON.stringify(meta.unresolvedReferences)
    ||meta.scope.preparedRoots.some(name=>!pack.records[pack.roots[name]])
    ||animations.sourcePackSha256!==meta.pack.sha256||animations.operator!==meta.operator||animations.version!==meta.resourceVersion
    ||shaders.operator!==meta.operator||shaders.version!==meta.resourceVersion
    ||!builtin.supportedEffectPacks?.[meta.pack.sha256])throw Error('Native effect artifact source mismatch');
  const source=json(meta.sourceReceipts.effects),a=json(meta.sourceReceipts.animations),s=json(meta.sourceReceipts.shaders);
  if(source.operator!==meta.operator||source.version!==meta.resourceVersion
    ||JSON.stringify(source.pack)!==JSON.stringify(meta.pack)||JSON.stringify(source.roots)!==JSON.stringify(meta.roots)
    ||JSON.stringify(source.textures)!==JSON.stringify(meta.textures)||JSON.stringify(source.sources)!==JSON.stringify(meta.sourceBundles)
    ||JSON.stringify(source.unresolvedReferences)!==JSON.stringify(meta.unresolvedReferences)
    ||JSON.stringify(a.artifact)!==JSON.stringify(meta.animations)||JSON.stringify(s.artifact)!==JSON.stringify(meta.shaders)
    ||JSON.stringify(s.sourceBundle)!==JSON.stringify(shaders.sourceBundle))throw Error('Native effect delivery differs from original receipts');
  for(const [id,entry]of Object.entries(meta.textures)) {
    if(!pack.textures?.[id]||JSON.stringify(pack.textures[id])!==JSON.stringify(entry)
      ||!Number.isSafeInteger(entry.width)||!Number.isSafeInteger(entry.height)||entry.width<1||entry.height<1
      ||!/^[a-f0-9]{64}$/.test(entry.pixelSha256??''))throw Error('Incomplete native texture identity');
  }
  if(Object.keys(pack.textures??{}).length!==Object.keys(meta.textures).length)throw Error('Missing native texture');
  return{files:files.length,roots:Object.keys(meta.roots).length,textures:Object.keys(meta.textures).length};
}
export async function validateNativeEffects(registry,root) {
  if(registry?.schemaVersion!==1||!registry.effects||Array.isArray(registry.effects))throw Error('Invalid native effect manifest');
  let count=0;
  for(const [id,entry]of Object.entries(registry.effects)) {
    const meta=JSON.parse(await checkedNativeFile(root,entry));
    if(meta.id!==id)throw Error('Native effect manifest key mismatch');
    await validateNativeEffect(meta,path.dirname(path.join(root,entry.path)));count++;
  }
  return count;
}
