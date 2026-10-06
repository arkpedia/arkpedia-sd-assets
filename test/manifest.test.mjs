import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { atlasPages, safePath, fileRecord, spineVersion, validateManifest } from '../scripts/manifest.mjs';

const header = (...strings) => Buffer.concat(strings.map((string) => Buffer.concat([Buffer.from([Buffer.byteLength(string) + 1]), Buffer.from(string)])));

test('atlas pages exclude named regions and preserve multiple pages', () => {
  const atlas = '\nfirst.png\nsize: 128,128\nformat: RGBA8888\nregion.png\n  rotate: false\n  xy: 0,0\n\nsecond.png\nsize: 128,128\nfilter: Linear,Linear\nregion2\n  bounds: 0,0,1,1\n';
  assert.deepEqual(atlasPages(atlas), ['first.png', 'second.png']);
  assert.deepEqual(atlasPages(atlas.replaceAll('\n', '\r\n')), ['first.png', 'second.png']);
  assert.throws(() => atlasPages('\n../outside.png\nsize: 1,1\n'));
  assert.throws(() => atlasPages('page.png\nsize: 1,1\n\npage.png\nsize: 1,1\n'));
});

test('source and delivery paths cannot escape the repository', () => {
  for (const value of ['/root', 'x/../y', 'x\\y', 'x//y', './x', 'https://x', 'x%2fy', 'x\0y', 'x?ref=main']) assert.throws(() => safePath(value));
  assert.equal(safePath('models/operator/id/Front/a.png'), 'models/operator/id/Front/a.png');
});

test('skeleton versions are read from the binary header, never assumed', () => {
  assert.equal(spineVersion(header('hash', '3.8.99')), '3.8.99');
  assert.throws(() => spineVersion(Buffer.from([128])));
  assert.throws(() => spineVersion(header('hash', 'bad')));
});

test('manifest publication requires all texture pages and detects altered bytes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'arkpedia-sd-test-'));
  const key = 'operator/char_test/default/front';
  const commit = 'a'.repeat(40);
  const prefix = `models/${key}/${commit}`;
  const skeleton = header('hash', '3.8.99');
  const atlas = Buffer.from('one.png\nsize: 1,1\n\ntwo.png\nsize: 1,1\n');
  const texture = Buffer.from('test texture');
  await mkdir(path.join(root, prefix), { recursive: true });
  for (const [name, bytes] of [['unit.skel', skeleton], ['unit.atlas', atlas], ['one.png', texture], ['two.png', texture]]) await writeFile(path.join(root, prefix, name), bytes);
  const model = {
    kind: 'operator', id: 'char_test', variant: 'default', facing: 'front', spineVersion: '3.8.99',
    source: { repository: 'example/models', commit, directory: 'spine/char_test' },
    skeleton: fileRecord(`${prefix}/unit.skel`, skeleton), atlas: fileRecord(`${prefix}/unit.atlas`, atlas),
    textures: ['one.png', 'two.png'].map((name) => fileRecord(`${prefix}/${name}`, texture))
  };
  const manifest = { schemaVersion: 1, models: { [key]: model } };
  try {
    await validateManifest(manifest, root);
    await assert.rejects(validateManifest({ ...manifest, models: { [key]: { ...model, textures: model.textures.slice(0, 1) } } }, root), /texture pages/);
    await assert.rejects(validateManifest({ ...manifest, models: { [key]: { ...model, spineVersion: '4.1.0' } } }, root), /skeleton version/);
    await writeFile(path.join(root, prefix, 'two.png'), 'corrupt');
    await assert.rejects(validateManifest(manifest, root), /corrupt file/);
    await rm(path.join(root, prefix, 'two.png'));
    await assert.rejects(validateManifest(manifest, root), /ENOENT/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
