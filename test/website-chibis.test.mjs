import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { websiteIdentity, importWebsiteChibis } from '../scripts/import-website-chibis.mjs';

test('website imports keep native skin, form and dormitory identities distinct', () => {
  assert.deepEqual(websiteIdentity('spine/char_002_amiya/build_char_002_amiya/Spine'), { id: 'char_002_amiya', variant: 'default', facing: 'walk' });
  assert.deepEqual(websiteIdentity('spine/char_002_amiya/build_char_002_amiya_epoque_4/Spine'), { id: 'char_002_amiya', variant: 'char_002_amiya_epoque_4', facing: 'walk' });
  assert.deepEqual(websiteIdentity('spine/char_002_amiya/char_002_amiya_epoque_4/Back'), { id: 'char_002_amiya', variant: 'char_002_amiya_epoque_4', facing: 'back' });
  assert.deepEqual(websiteIdentity('spine/char_1012_skadi2/char_1012_skadi2/Spine'), { id: 'char_1012_skadi2', variant: 'default', facing: 'front' });
  for (const directory of ['spine/char_1/../Front', 'spine/char_1/char_1/Unknown', 'other/char_1/char_1/Front', 'spine/char_1/char_1/Front/extra']) assert.throws(() => websiteIdentity(directory));
});

test('batch import retains immutable originals and catalogue on failure, and can be rerun', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'arkpedia-website-import-'));
  const sourceRoot = path.join(temporary, 'source'), destinationRoot = path.join(temporary, 'assets');
  const directory = 'spine/char_test/build_char_test/Spine';
  const git = args => execFileSync('git', args, { cwd: sourceRoot, encoding: 'utf8' }).trim();
  try {
    await mkdir(path.join(sourceRoot, directory), { recursive: true });
    await mkdir(destinationRoot);
    const header = Buffer.concat(['hash', '3.8.99'].map(value => Buffer.concat([Buffer.from([value.length + 1]), Buffer.from(value)])));
    await writeFile(path.join(sourceRoot, directory, 'unit.skel'), header);
    await writeFile(path.join(sourceRoot, directory, 'unit.atlas'), 'unit.png\nsize: 1,1\nformat: RGBA8888\n');
    await writeFile(path.join(sourceRoot, directory, 'unit.png'), 'original texture bytes');
    git(['init', '-q']); git(['remote', 'add', 'origin', 'https://github.com/fexli/ArknightsResource.git']);
    git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'Original model']);
    const commit = git(['rev-parse', 'HEAD']);
    const base = `https://raw.githubusercontent.com/fexli/ArknightsResource/${commit}/${directory}/`;
    const model = { skeleton: base + 'unit.skel', atlas: base + 'unit.atlas', textures: { 'unit.png': base + 'unit.png' }, premultipliedAlpha: false };
    // A skin needs a battle facing: use a retained exact SD front while importing its base model.
    const frontDirectory = 'spine/char_test/char_test/Front';
    await mkdir(path.join(sourceRoot, frontDirectory), { recursive: true });
    for (const name of ['unit.skel', 'unit.atlas', 'unit.png']) await writeFile(path.join(sourceRoot, frontDirectory, name), await readFile(path.join(sourceRoot, directory, name)));
    git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'Battle facing']);
    const revision = git(['rev-parse', 'HEAD']);
    const pinned = JSON.parse(JSON.stringify(model).replaceAll(commit, revision));
    const front = JSON.parse(JSON.stringify(pinned).replaceAll(directory, frontDirectory));
    const index = { 'char_test#1': { front, walk: pinned } };
    const initial = JSON.stringify({ schemaVersion: 1, models: {} }) + '\n';
    const manifestPath = path.join(destinationRoot, 'manifest.json');
    await writeFile(manifestPath, initial);
    const bad = { ...index, 'char_missing#1': { front: { ...front, skeleton: front.skeleton.replace('unit.skel', 'absent.skel') } } };
    await assert.rejects(importWebsiteChibis({ index: bad, sourceRoot, destinationRoot, log: () => {} }), /Conflicting website references|Missing original/);
    assert.equal(await readFile(manifestPath, 'utf8'), initial);
    const manifest = await importWebsiteChibis({ index, sourceRoot, destinationRoot, log: () => {} });
    assert.equal(Object.keys(manifest.models).length, 2);
    const snapshot = await readFile(manifestPath, 'utf8');
    await importWebsiteChibis({ index, sourceRoot, destinationRoot, log: () => {} });
    assert.equal(await readFile(manifestPath, 'utf8'), snapshot);
    const walk = manifest.models['operator/char_test/default/walk'];
    assert.ok((await readFile(path.join(destinationRoot, walk.skeleton.path))).equals(header));
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
