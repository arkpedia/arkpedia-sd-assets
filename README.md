# Arkpedia SD assets

Battle chibi (super deformed) Spine models for Arkpedia's stage overhaul. This repository holds animation assets; stats, skills and stage rules stay in `arkpedia-data`.

This is an initial asset set, not a complete operator/enemy/effect catalogue. There are 17 complete models: Amiya's pilot Front/Back pair, the initial enemy pilot, and the 14 models used by the 0-1 simulator MVP (Fang, Melantha, Beagle, Kroos, Hibiscus and Steward Front/Back, plus slug and soldier). A model having files does not establish accurate combat behavior.

All 17 models have parsed Spine 3.8 animation durations, role mappings, attack-event times and bounds. Their atlas attachments have been checked with the simulator's Spine parser. Operator textures use straight alpha; enemy textures use premultiplied alpha, tested on the MVP in the browser renderer. New imports keep unverified runtime fields `null` until inspected. These checks do not establish frame-for-frame combat accuracy.

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
- `animations`, `animationRoles`, `hits`, `bounds`, `premultipliedAlpha`: runtime metadata when inspected, otherwise explicitly unknown. Refresh/import must be followed by parsing and renderer checks before a simulator uses a new revision.

Files live at `models/<kind>/<id>/<variant>/<facing>/<upstream commit>/<original filename>`. Atlas-relative texture names are preserved. Clients use URLs pinned to this repository's commit, then lazy-load only the stage enemies, chosen squad, summons and effects. Never load this repository's moving `main` from an active battle.

The [public simulator MVP](https://github.com/arkpedia/arkpedia-stage-simulator) consumes an immutable SD commit. The app's production release pipeline does not consume this repository yet. Adding a pinned SD revision to content releases, complete coverage reports, token/effect imports and automatic refresh/publication are follow-up work on `feat/stage-overhaul`. The manifest must distinguish missing art from unsupported mechanics.

## Reference

[Stronghold-Protocol](https://github.com/sganggs/Stronghold-Protocol) demonstrates a 3D board with animated Spine units. Its source and asset documentation were used for architectural research, without copying its code or bundled media. See [NOTICE.md](NOTICE.md) for provenance and ownership.

## Stage scenery

`stage-manifest.json` also publishes 0-1's original Chernobog scene: 177 static submeshes, tile heights, original UVs, colour/emission textures and baked lighting. Files are about 1.7 MB combined. Each file has a SHA-256 hash; the scene records the official Global Android resource version and verified bundle checksums. Runtime clients must pin a repository commit and match the scene's geometry hash to their gameplay grid.

This is one verified stage, not automatic coverage of the stage catalogue. The GPL simulator's `tools/arkpedia/stages/export-scene.py` performs the extraction from the official scene, theme and lighting bundles. No Stronghold release media is used. The web renderer approximates the game shader; game assets alone do not establish identical lighting or battle behavior.
