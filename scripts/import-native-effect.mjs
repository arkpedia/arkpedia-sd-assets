// SPDX-License-Identifier: MIT
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {validateNativeEffect,validateNativeEffects,nativeEffectFiles} from './native-effects.mjs';
const defaultRoot=fileURLToPath(new URL('../',import.meta.url));
export async function importNativeEffect({metadata,sourceRoot,destinationRoot=defaultRoot}) {
  const raw=await readFile(metadata),meta=JSON.parse(raw);await validateNativeEffect(meta,sourceRoot);
  const prefix=`effects/native/${meta.id}/${meta.resourceVersion}/${meta.pack.sha256}/`;
  const directory=path.join(destinationRoot,prefix),files=nativeEffectFiles(meta);
  const inputs=await Promise.all(files.map(async e=>[e.path,await readFile(path.join(sourceRoot,e.path))]));
  inputs.push(['manifest.json',raw]);
  // Immutable content paths cannot be repurposed by a changed review receipt.
  for(const [name,bytes]of inputs) {
    const target=path.join(directory,name);await mkdir(path.dirname(target),{recursive:true});
    try{const old=await readFile(target);if(!old.equals(bytes))throw Error('Immutable native effect changed: '+name);}
    catch(e){if(e.code!=='ENOENT')throw e;await writeFile(target,bytes);}
  }
  await validateNativeEffect(meta,directory);
  const registryPath=path.join(destinationRoot,'native-effect-manifest.json');
  let registry;
  try{registry=JSON.parse(await readFile(registryPath,'utf8'));}
  catch(e){if(e.code!=='ENOENT')throw e;registry={schemaVersion:1,effects:{}};}
  registry.effects[meta.id]={path:prefix+'manifest.json',bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')};
  await validateNativeEffects(registry,destinationRoot);
  await writeFile(registryPath+'.tmp',JSON.stringify(registry,null,2)+'\n');await rename(registryPath+'.tmp',registryPath);
  return registry.effects[meta.id];
}
if(import.meta.url===new URL(`file://${process.argv[1]}`).href) {
  const{values}=parseArgs({options:{metadata:{type:'string'},'source-root':{type:'string'}}});
  if(!values.metadata||!values['source-root'])throw Error('Required: --metadata --source-root');
  console.log(await importNativeEffect({metadata:values.metadata,sourceRoot:values['source-root']}));
}
