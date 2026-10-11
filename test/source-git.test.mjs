import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gitSource } from '../scripts/source-git.mjs';

test('local imports read pinned blobs and reject the wrong upstream', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'arkpedia-source-'));
  const git = args => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  try {
    git(['init']);
    git(['remote', 'add', 'origin', 'https://github.com/example/models.git']);
    await mkdir(path.join(root, 'spine/test'), { recursive: true });
    await writeFile(path.join(root, 'spine/test/model.skel'), 'pinned skeleton');
    git(['add', '.']);
    git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'Pinned model']);
    const commit = git(['rev-parse', 'HEAD']);
    await writeFile(path.join(root, 'spine/test/model.skel'), 'uncommitted replacement');
    await writeFile(path.join(root, 'spine/test/untracked.png'), 'untracked texture');
    const source = gitSource(root, 'example/models', commit);
    const listing = source.listing('spine/test');
    assert.deepEqual(listing.map(file => file.name), ['model.skel']);
    assert.equal(source.blob(listing[0]).toString(), 'pinned skeleton');
    assert.throws(() => gitSource(root, 'other/models', commit), /declared upstream/);
    assert.throws(() => gitSource(root, 'example/models', 'HEAD'), /full upstream commit/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
