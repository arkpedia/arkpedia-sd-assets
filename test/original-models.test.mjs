import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { importOriginalModels } from '../scripts/import-original-models.mjs';

const hash = (bytes, algorithm = 'sha256') => createHash(algorithm).update(bytes).digest('hex');
const header = value => Buffer.concat([value, '3.8.99'].map(s => Buffer.concat([Buffer.from([s.length + 1]), Buffer.from(s)])));

async function fixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'arkpedia-original-'));
  const bundle = path.join(dir, 'original.ab'), metadata = path.join(dir, 'source.json');
  const original = Buffer.from('verified native bundle fixture');
  await writeFile(bundle, original);
  await writeFile(path.join(dir, 'manifest.json'), JSON.stringify({ schemaVersion: 1, models: {} }));
  const make = async (facing) => {
    const directory = `extracted/${facing}`;
    await mkdir(path.join(dir, directory), { recursive: true });
    const data = { 'same.skel': header(facing), 'same.atlas': Buffer.from('same.png\nsize: 1,1\n'), 'same.png': Buffer.from(`texture ${facing}`) };
    const files = {};
    for (const [name, bytes] of Object.entries(data)) {
      await writeFile(path.join(dir, directory, name), bytes);
      files[name] = { bytes: bytes.length, sha256: hash(bytes) };
    }
    return { directory, files, spineVersion: '3.8.99', originalPathIds: { skeletonTextAsset: facing === 'front' ? '111' : '222' }, durations: { Attack: 1, Idle: 1.2, Start: 1, Die: 1 }, animationRoles: { idle: 'Idle', deploy: 'Start', attack: { loop: 'Attack' }, die: 'Die' }, hits: { Attack: [.4] } };
  };
  const front = await make('front'), back = await make('back');
  const info = { sourceBundle: { path: 'pkgrps/tokens.ab', bytes: original.length, md5: hash(original, 'md5'), sha256: hash(original), resourceVersion: 'test-version', url: 'https://ark-us-static-online.yo-star.com/assetbundle/official/Android/assets/test-version/tokens.dat' }, models: { token_pair: { facings: { front, back } } } };
  const save = () => writeFile(metadata, JSON.stringify(info));
  await save();
  return { dir, info, front, back, save, args: { metadata, bundle, extractedRoot: dir, destinationRoot: dir }, manifest: async () => JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8')) };
}

test('original facings preserve distinct native bytes despite identical filenames and retain existing single-model aliases', async () => {
  const f = await fixture();
  try {
    f.info.models.token_single = f.front; await f.save();
    await importOriginalModels(f.args);
    const m = (await f.manifest()).models;
    const front = m['operator/token_pair/default/front'], back = m['operator/token_pair/default/back'];
    assert.notEqual(front.skeleton.sha256, back.skeleton.sha256);
    assert.equal(front.skeleton.sha256, f.front.files['same.skel'].sha256);
    assert.equal(back.skeleton.sha256, f.back.files['same.skel'].sha256);
    assert.deepEqual(front.source.originalPathIds, f.front.originalPathIds);
    assert.equal(front.source.facingAlias, undefined);
    for (const facing of ['front', 'back']) {
      const single = m[`operator/token_single/default/${facing}`];
      assert.equal(single.skeleton.sha256, front.skeleton.sha256);
      assert.equal(single.source.facingAlias, 'single-original-model');
    }
    await importOriginalModels(f.args);
    assert.deepEqual((await f.manifest()).models, m);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('a missing native facing or changed extracted file cannot publish a manifest', async () => {
  const f = await fixture();
  try {
    delete f.info.models.token_pair.facings.back; await f.save();
    await assert.rejects(importOriginalModels(f.args), /exactly front and back/);
    f.info.models.token_pair.facings.back = f.back; await f.save();
    await writeFile(path.join(f.dir, f.back.directory, 'same.skel'), 'altered');
    await assert.rejects(importOriginalModels(f.args), /extracted file changed/);
    assert.deepEqual((await f.manifest()).models, {});
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('an unverified original bundle is rejected before importing either facing', async () => {
  const f = await fixture();
  try {
    await writeFile(f.args.bundle, 'different bundle');
    await assert.rejects(importOriginalModels(f.args), /bundle bytes do not match/);
    assert.deepEqual((await f.manifest()).models, {});
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('role descriptors and missing clips are rejected before publication', async () => {
  const f = await fixture();
  try {
    f.front.animationRoles.idle = { name: 'Idle', loop: true }; await f.save();
    await assert.rejects(importOriginalModels(f.args), /literal existing clip names/);
    assert.deepEqual((await f.manifest()).models, {});
    f.front.animationRoles.idle = 'Idle'; f.front.animationRoles.deploy = 'Missing'; await f.save();
    await assert.rejects(importOriginalModels(f.args), /literal existing clip names/);
    assert.deepEqual((await f.manifest()).models, {});
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('passive original devices keep literal birth and idle clips without inventing attacks', async () => {
  const f = await fixture();
  try {
    for (const record of [f.front, f.back]) record.animationRoles = {
      idle: 'Idle', deploy: 'Start', attack: null, skill: null, die: 'Die',
    };
    await f.save(); await importOriginalModels(f.args);
    for (const facing of ['front', 'back']) assert.deepEqual(
      (await f.manifest()).models[`operator/token_pair/default/${facing}`].animationRoles,
      f.front.animationRoles);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});
