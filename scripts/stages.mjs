// Stage assets are game artwork; this validation code is MIT-licensed.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
export async function validateStages(manifest, root) {
  if (manifest.schemaVersion !== 1 || !manifest.stages) throw Error('Invalid stage manifest');
  const checked = async (base, entry) => {
    if (!entry || !/^[a-f0-9]{64}$/.test(entry.sha256) || !Number.isSafeInteger(entry.bytes) ||
        !entry.path || path.isAbsolute(entry.path) || entry.path.split('/').includes('..'))
      throw Error('Invalid stage file reference');
    const bytes = await readFile(path.join(base, entry.path));
    if (bytes.length !== entry.bytes || createHash('sha256').update(bytes).digest('hex') !== entry.sha256)
      throw Error(`Stage checksum mismatch: ${entry.path}`);
    return bytes;
  };
  for (const [id, entry] of Object.entries(manifest.stages)) {
    const scene = JSON.parse(await checked(root, entry));
    if (scene.schemaVersion !== 1 || scene.stage !== id || !/^[a-f0-9]{64}$/.test(scene.geometryHash) ||
        scene.coordinates !== 'column,row,height' || !scene.source?.bundles?.length)
      throw Error(`Invalid stage scene: ${id}`);
    const rows = scene.tileHeights?.length, cols = scene.tileHeights?.[0]?.length;
    if (!rows || !cols || scene.tileHeights.some(r => r.length !== cols || r.some(h => !Number.isFinite(h))))
      throw Error('Invalid stage tile heights');
    const base = path.dirname(path.join(root, entry.path));
    const buffer = await checked(base, scene.buffer);
    for (const tex of Object.values(scene.textures)) await checked(base, tex);
    for (const mesh of scene.meshes) {
      if (!scene.materials[mesh.material]) throw Error('Unknown stage material');
      for (const a of Object.values(mesh.attributes)) {
        if (!['Float32','Uint32'].includes(a.type) || !Number.isSafeInteger(a.byteOffset) || a.byteOffset % 4 ||
            a.byteOffset < 0 || !Number.isSafeInteger(a.count) || a.count < 1 ||
            ![1,2,3].includes(a.itemSize) || a.byteOffset + a.count*a.itemSize*4 > buffer.length)
          throw Error('Invalid stage geometry buffer range');
      }
      const a = mesh.attributes.index;
      const indices = new Uint32Array(buffer.buffer, buffer.byteOffset+a.byteOffset,a.count);
      if (a.count % 3 || indices.some(i=>i >= mesh.attributes.position.count)) throw Error('Invalid stage triangle');
    }
    for (const m of Object.values(scene.materials))
      if (!scene.textures[m.map] || (m.emissiveMap && !scene.textures[m.emissiveMap])) throw Error('Missing stage texture');
  }
  if (manifest.effects?.standardGates) {
    const entry = manifest.effects.standardGates;
    const pack = JSON.parse(await checked(root, entry));
    if (pack.schemaVersion !== 1 || pack.coordinates !== 'column,row,height' ||
        pack.source?.bundle !== 'arts/effects/[pack]map.ab' || pack.parts?.length !== 5)
      throw Error('Invalid standard gate pack');
    const base = path.dirname(path.join(root, entry.path));
    const buffer = await checked(base, pack.buffer);
    await checked(base, pack.texture);
    const expected = {startDown:'start',startUp:'start',startBack:'start',endDown:'end',endUp:'end'};
    if (new Set(pack.parts.map(p => p.key)).size !== 5) throw Error('Duplicate gate part');
    for (const part of pack.parts) {
      if (expected[part.key] !== part.kind || part.blend !== (part.key === 'endUp' ? 'alpha' : 'additive'))
        throw Error('Invalid gate part');
      for (const [name,size,type] of [['position',3,'Float32'],['uv',2,'Float32'],['index',1,'Uint32']]) {
        const a = part.attributes[name];
        if (!a || a.type !== type || a.itemSize !== size || !Number.isSafeInteger(a.byteOffset) ||
            a.byteOffset < 0 || a.byteOffset % 4 || !Number.isSafeInteger(a.count) || a.count < 1 ||
            a.byteOffset+a.count*size*4 > buffer.length) throw Error('Invalid gate buffer range');
      }
      const a = part.attributes.index, count = part.attributes.position.count;
      if (part.attributes.uv.count !== count || a.count % 3 ||
          new Uint32Array(buffer.buffer,buffer.byteOffset+a.byteOffset,a.count).some(i => i >= count))
        throw Error('Invalid gate triangle');
    }
  }
}
