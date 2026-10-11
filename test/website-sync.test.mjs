import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { syncWebsiteChibis } from '../scripts/sync-website-chibis.mjs';

test('new operators, skins and native base variants publish atomically, retry and refresh without damaging reviewed models', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'arkpedia-website-sync-'));
  const sourceRoot = path.join(temporary, 'source'), destinationRoot = path.join(temporary, 'assets');
  const git = args => execFileSync('git', args, { cwd: sourceRoot, encoding: 'utf8' }).trim();
  const commit = () => {
    git(['add', '.']); git(['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'Upstream update']);
    return git(['rev-parse', 'HEAD']);
  };
  const header = Buffer.concat(['hash', '3.8.99'].map(value => Buffer.concat([Buffer.from([value.length + 1]), Buffer.from(value)])));
  const model = async (owner, prefab, facing, pages = ['unit.png']) => {
    const directory = `spine/${owner}/${prefab}/${facing}`;
    await mkdir(path.join(sourceRoot, directory), { recursive: true });
    await writeFile(path.join(sourceRoot, directory, 'unit.skel'), header);
    await writeFile(path.join(sourceRoot, directory, 'unit.atlas'), pages.map(page => `${page}\nsize: 1,1\nformat: RGBA8888\n`).join('\n'));
    for (const page of pages) await writeFile(path.join(sourceRoot, directory, page), 'original texture bytes');
    return directory;
  };
  const charSkins = { 'char_test#1': { charId: 'char_test', battleSkin: { skinOrPrefabId: 'DefaultSkin' } } };
  const table = async () => writeFile(path.join(sourceRoot, 'gamedata/excel/skin_table.json'), JSON.stringify({ charSkins }));
  const sync = revision => syncWebsiteChibis({ sourceRoot, commit: revision, destinationRoot, log: () => {} });
  try {
    await mkdir(path.join(sourceRoot, 'gamedata/excel'), { recursive: true });
    await mkdir(destinationRoot);
    git(['init', '-q']); git(['remote', 'add', 'origin', 'https://github.com/fexli/ArknightsResource.git']);
    await model('char_test', 'char_test', 'Front', ['unit.png', 'second.png']);
    // A supplementary Spine and an unrelated operator's duplicate prefab must not win.
    await model('char_test', 'char_test', 'Spine');
    await model('char_other', 'char_test', 'Front');
    await model('char_test', 'build_char_test', 'Spine');
    await table();
    const firstCommit = commit();
    await writeFile(path.join(destinationRoot, 'manifest.json'), JSON.stringify({ schemaVersion: 1, models: {}, websiteSkins: {} }));
    const first = await sync(firstCommit);
    const key = first.websiteSkins['char_test#1'].front;
    assert.ok(first.models[key].source.directory.endsWith('/char_test/char_test/Front'));
    assert.equal(first.models[key].textures.length, 2);
    assert.equal(first.websiteSkins['char_test#1'].back, undefined, 'never invent an absent facing');
    assert.ok(first.websiteSkins['char_test#1'].walk);
    const snapshot = await readFile(path.join(destinationRoot, 'manifest.json'), 'utf8');
    await sync(firstCommit);
    assert.equal(await readFile(path.join(destinationRoot, 'manifest.json'), 'utf8'), snapshot);

    charSkins['char_new#1'] = { charId: 'char_new' };
    charSkins['char_new#2'] = { charId: 'char_new' };
    charSkins['char_test@outfit#1'] = { charId: 'char_test', battleSkin: { skinOrPrefabId: 'char_test_outfit#1' }, buildingId: 'char_test_dorm#1' };
    charSkins['char_pending#1'] = { charId: 'char_pending' };
    await model('char_new', 'char_new', 'Front');
    await model('char_new', 'char_new', 'Back');
    await model('char_new', 'build_char_new', 'Spine');
    await model('char_test', 'char_test_outfit_1', 'Front');
    const outfit = await model('char_test', 'char_test_outfit_1', 'Back');
    await model('char_test', 'build_char_test_dorm_1', 'Spine');
    await table();
    // Partial atlas upload blocks publication, keeping the exact last complete manifest.
    await rm(path.join(sourceRoot, outfit, 'unit.png'));
    await assert.rejects(sync(commit()), /Missing original atlas page/);
    assert.equal(await readFile(path.join(destinationRoot, 'manifest.json'), 'utf8'), snapshot);
    await writeFile(path.join(sourceRoot, outfit, 'unit.png'), 'original texture bytes');
    const secondCommit = commit();
    const second = await sync(secondCommit);
    assert.deepEqual(second.websiteSkins['char_new#1'], second.websiteSkins['char_new#2']);
    assert.equal(Object.keys(second.websiteSkins['char_new#1']).length, 3);
    const walk = second.models[second.websiteSkins['char_test@outfit#1'].walk];
    assert.ok(walk.source.directory.includes('build_char_test_dorm_1'));
    assert.deepEqual(second.websiteSource.pending, ['char_pending#1']);
    assert.deepEqual(second.models[key], first.models[key], 'unchanged models keep their old pin');

    // A reviewed simulator alias stays intact when the upstream website model changes.
    const reviewedKey = 'operator/char_test/default/front';
    second.models[reviewedKey] = { ...structuredClone(second.models[key]), variant: 'default' };
    // Reuse validated immutable bytes under the reviewed key's own identity/prefix.
    for (const file of [second.models[reviewedKey].skeleton, second.models[reviewedKey].atlas, ...second.models[reviewedKey].textures]) {
      const replacement = file.path.replace('/website_char_test/', '/default/');
      await mkdir(path.dirname(path.join(destinationRoot, replacement)), { recursive: true });
      await writeFile(path.join(destinationRoot, replacement), await readFile(path.join(destinationRoot, file.path)));
      file.path = replacement;
    }
    second.websiteSkins['char_test#1'].front = reviewedKey;
    await writeFile(path.join(destinationRoot, 'manifest.json'), JSON.stringify(second));
    const reviewed = structuredClone(second.models[reviewedKey]);
    await writeFile(path.join(sourceRoot, 'spine/char_test/char_test/Front/unit.png'), 'updated original texture');
    const third = await sync(commit());
    assert.deepEqual(third.models[reviewedKey], reviewed);
    const updated = third.models[third.websiteSkins['char_test#1'].front];
    assert.notEqual(updated.source.commit, firstCommit);
    assert.equal(await readFile(path.join(destinationRoot, updated.textures[0].path), 'utf8'), 'updated original texture');
    assert.equal(await readFile(path.join(destinationRoot, first.models[key].textures[0].path), 'utf8'), 'original texture bytes', 'old bytes remain available');

    // An inherited base-character alias is invalid for a native template form.
    charSkins['char_form#2'] = { charId: 'char_test', tmplId: 'char_form', buildingId: 'char_form', battleSkin: { skinOrPrefabId: 'DefaultSkin' } };
    await model('char_form', 'char_form', 'Front');
    await model('char_form', 'char_form', 'Back');
    await model('char_form', 'build_char_form', 'Spine');
    await table();
    third.websiteSkins['char_form#2'] = { ...third.websiteSkins['char_test#1'] };
    await writeFile(path.join(destinationRoot, 'manifest.json'), JSON.stringify(third));
    const formCommit = commit();
    const corrected = await sync(formCommit);
    assert.equal(corrected.websiteDefaultSkins.char_form, 'char_form#2');
    for (const facing of ['front', 'back', 'walk']) {
      const native = corrected.models[corrected.websiteSkins['char_form#2'][facing]];
      assert.equal(native.id, 'char_form', `template ${facing} uses its own original, not the base character`);
    }
    assert.deepEqual(corrected.models[reviewedKey], reviewed, 'correcting a form does not change the reviewed base model');
    // Reviewed native form records take precedence and keep their runtime metadata.
    const nativeKey = corrected.websiteSkins['char_form#2'].front;
    const native = structuredClone(corrected.models[nativeKey]);
    native.variant = 'default'; native.animations = { Idle: 1 };
    for (const file of [native.skeleton, native.atlas, ...native.textures]) {
      const replacement = file.path.replace('/website_char_form/', '/default/');
      await mkdir(path.dirname(path.join(destinationRoot, replacement)), { recursive: true });
      await writeFile(path.join(destinationRoot, replacement), await readFile(path.join(destinationRoot, file.path)));
      file.path = replacement;
    }
    corrected.models['operator/char_form/default/front'] = native;
    corrected.websiteSkins['char_form#2'].front = reviewedKey;
    await writeFile(path.join(destinationRoot, 'manifest.json'), JSON.stringify(corrected));
    const preferred = await sync(formCommit);
    assert.equal(preferred.websiteDefaultSkins.char_form, 'char_form#2');
    assert.equal(preferred.websiteSkins['char_form#2'].front, 'operator/char_form/default/front');
    assert.deepEqual(preferred.models['operator/char_form/default/front'], native);

    const final = await readFile(path.join(destinationRoot, 'manifest.json'), 'utf8');
    delete charSkins['char_new#2']; await table();
    await assert.rejects(sync(commit()), /lost published skin/);
    assert.equal(await readFile(path.join(destinationRoot, 'manifest.json'), 'utf8'), final);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
