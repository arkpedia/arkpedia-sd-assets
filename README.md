# Arkpedia SD assets

Battle chibi (super deformed) Spine models for Arkpedia's stage overhaul. This repository holds animation assets; stats, skills and stage rules stay in `arkpedia-data`.

This is the initial asset foundation, not a complete operator/enemy/effect catalogue. A model having files does not establish accurate combat behavior or runtime compatibility. Animation role mappings and premultiplied-alpha settings remain `null` until verified in the chosen renderer.

## Import a model

Node.js 22+, no dependencies. Optional `GH_TOKEN` or `GITHUB_TOKEN` raises GitHub API rate limits; tokens are only sent to `api.github.com`.

```sh
npm run import:model -- --source operators --directory spine/char_002_amiya/char_002_amiya/Front --id char_002_amiya --facing front
npm run import:model -- --source operators --directory spine/char_002_amiya/char_002_amiya/Back --id char_002_amiya --facing back
npm run import:model -- --source enemies --directory models_enemies/10001_trslim --id enemy_10001_trslim
npm run validate
npm test
```

Use `--variant` for a skin/form and `--commit` for an explicit upstream SHA. Never substitute a different operator or enemy model to fill a coverage gap. `npm run refresh` updates the curated entries from their configured source refs; it does not discover the entire roster or publish anything. Concurrent import/refresh writers are not supported; run them sequentially.

Imports pin the source commit, fetch the skeleton, atlas and every declared PNG page, hash each file, verify the skeleton header, and validate the complete next manifest before replacing it. A failed model leaves the published manifest unchanged. Old revisions stay available. Check validates every published file on pushes and PRs.

## Manifest and delivery

`manifest.json` schema 1 maps `kind/id/variant/facing` to:

- `source`: upstream key, repository, full commit and original directory.
- `spineVersion`: binary header version; renderer compatibility still needs testing.
- `skeleton`, `atlas`, `textures`: repository paths, byte lengths and SHA-256 hashes.
- `animations`, `premultipliedAlpha`: explicitly unknown until renderer verification.

Files live at `models/<kind>/<id>/<variant>/<facing>/<upstream commit>/<original filename>`. Atlas-relative texture names are preserved. Clients use URLs pinned to this repository's commit, then lazy-load only the stage enemies, chosen squad, summons and effects. Never load this repository's moving `main` from an active battle.

The app's release pipeline does not consume this repository yet. Adding a pinned SD revision to content releases, complete coverage reports, token/effect imports, runtime animation validation and automatic refresh/publication are follow-up work on `feat/stage-overhaul`. The manifest must distinguish missing art from unsupported mechanics.

## Reference

[Stronghold-Protocol](https://github.com/sganggs/Stronghold-Protocol) demonstrates a 3D board with animated Spine units. Its source and asset documentation were used for architectural research, without copying its code or bundled media. See [NOTICE.md](NOTICE.md) for provenance and ownership.
