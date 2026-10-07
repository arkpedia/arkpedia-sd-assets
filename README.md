# Arkpedia SD assets

Battle chibi (super deformed) Spine models and original stage scenery for Arkpedia's stage overhaul. This repository holds artwork and animation assets; stats, skills and stage rules stay in `arkpedia-data`.

The default operator artwork catalogue covers all **374 obtainable operators in the pinned Global character table**. `manifest.json` contains **761 complete entries**: 748 logical operator facings, ten existing summon facings, and three existing enemies. The operator entries come from 742 original model directories: 368 Front/Back pairs, four Front-only originals, and two single-Spine originals. The previous 353 entries remain unchanged.

[operator-catalogue.json](operator-catalogue.json) records every operator ID, exact original folder and file names, source commit, file fingerprints and inspected idle/attack roles. It also records the verified exceptions: U-Official, Heidi, Angelina and Civilight Eterna share their original Front model for both logical facings; Sora and Skadi the Corrupting Heart share their original Spine model. Liskarm's original inner folder is `char_107_liskarm`, while the catalogue ID is `char_107_liskam`. No different operator or skin was substituted, and no default originals are missing from this pinned catalogue.

These imports establish artwork availability. The simulator's explicit regular-stage support registry still determines which operators are playable; skills, talents, summons and enemy behavior require their own source-backed adapters and combat tests. This catalogue covers default operator models only. Skin/form variants, the remaining summon/enemy catalogue and most effects are separate work.

All 761 entries have parsed Spine 3.8 animation durations, existing clip role mappings, available attack-event times and source header bounds. Bounds remain explicitly null when the original header has no positive dimensions. THRM-EX and Sora have no original normal attack clip; their recorded idle fallback is not treated as a real attack. Their atlas attachments have been checked with the simulator's Spine parser. New catalogue role mappings resolve existing clip names for inspection; they do not establish that each skill uses that clip in the original game. Combat adapters verify the native skill bindings separately. Alpha blending is recorded per model; extracted original summon textures merge the source RGB and Alpha channels. Browser checks cover selected squads and do not establish complete visual or frame-for-frame combat accuracy.

The catalogue is pinned to `Kengxxiao/ArknightsGameData_YoStar` character-table commit `57010cb5b2afea112cae57daa756b58676ba6850` and `fexli/ArknightsResource` model commit `d0b5af0b004b044d322397ce5ae79632b6d9fcdd`. The inventory excludes non-obtainable, token and trap entries from the operator table. Import validation and tests check the model hashes, inventory identities and original-facing aliases.

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

For batches, `--source-root /path/to/upstream/git/repo --commit <full SHA>` reads pinned Git blobs without a directory API request per model. The checkout must have the declared upstream origin; uncommitted and untracked files are ignored. A filtered clone can fetch the required blobs on demand. This follows the same manifest and file validation as network imports.

The simulator's `tools/arkpedia/import-operators.mjs --review-catalogue --ids <explicit IDs>` imports artwork for source review without registering combat support. Its `--fixed-front-ids` and `--single-model-ids` exceptions require an exact pinned local tree containing only the declared original form. `--source-directory-map <JSON file>` maps a catalogue ID to its verified default base directory for spelling exceptions; it rejects traversal, skin/build variants and a different operator identity. The importer parses each facing before recording runtime metadata. Run all manifest writers serially.

Imports pin the source commit, fetch the skeleton, atlas and every declared PNG page, hash each file, verify the skeleton header, and validate the complete next manifest before replacing it. A file-validation failure leaves the published manifest unchanged. Runtime inspection is a separate step; its fields remain unknown until parsing succeeds. Old revisions stay available. Check validates every published file on pushes and PRs.

## Manifest and delivery

`manifest.json` schema 1 maps `kind/id/variant/facing` to:

- `source`: upstream key, repository, full commit and original directory.
- `spineVersion`: binary header version; renderer compatibility still needs testing.
- `skeleton`, `atlas`, `textures`: repository paths, byte lengths and SHA-256 hashes.
- `animations`, `animationRoles`, `hits`, `bounds`, `premultipliedAlpha`: runtime metadata when inspected, otherwise explicitly unknown. Refresh/import must be followed by parsing and renderer checks before a simulator uses a new revision.

Git-sourced files live at `models/<kind>/<id>/<variant>/<facing>/<upstream commit>/<original filename>`. Verified original-client models use the decompressed bundle SHA256 in place of the upstream commit; their manifest records the official URL, resource version, byte count, MD5, transforms and SHA256. `scripts/import-original-models.mjs` verifies both the original bundle and reviewed extracted files before publishing. Atlas-relative texture names are preserved. Clients use URLs pinned to this repository's commit, then lazy-load only the stage enemies, chosen squad, summons and effects. Never load this repository's moving `main` from an active battle.

The [public simulator MVP](https://github.com/arkpedia/arkpedia-stage-simulator) consumes an immutable SD commit. The app's production release pipeline does not consume this repository yet. Adding a pinned SD revision to content releases, complete coverage reports, token/effect imports and automatic refresh/publication are follow-up work on `feat/stage-overhaul`. The manifest must distinguish missing art from unsupported mechanics.

## Reference

[Stronghold-Protocol](https://github.com/sganggs/Stronghold-Protocol) demonstrates a 3D board with animated Spine units. Its source and asset documentation were used for architectural research, without copying its code or bundled media. See [NOTICE.md](NOTICE.md) for provenance and ownership.

## Stage scenery

`stage-manifest.json` also publishes 0-1's original Chernobog scene: 177 static submeshes, tile heights, original UVs, colour/emission textures and baked lighting. Files are about 1.7 MB combined. Each file has a SHA-256 hash; the scene records the official Global Android resource version and verified bundle checksums. Runtime clients must pin a repository commit and match the scene's geometry hash to their gameplay grid.

This is one verified stage, not automatic coverage of the stage catalogue. The GPL simulator's `tools/arkpedia/stages/export-scene.py` performs the extraction from the official scene, theme and lighting bundles. No Stronghold release media is used. The web renderer approximates the game shader; game assets alone do not establish identical lighting or battle behavior.

## Skill effects

`stage-manifest.json` includes `effects.chargeCost`: the five billboard particle emitters and two lossless textures in the original `common_charge_cost_start_01` activation burst shared by Fang and Vanilla. The pack records the verified Global Android bundle checksums, independent RGB/alpha gradient keys, Hermite size curves, burst counts, transforms, angular velocity and birth sub-emitter relation. Its files total about 22 KB.

This is the activation burst only. The follow-up `common_charge_cost_01` flight toward the DP counter needs game-specific motion, noise and trail scripts. The simulator also approximates native velocity damping and the operator centre anchor; these limits are explicit in `effect.json`. A new source module or shader requires extractor/runtime review. All other skill effects and projectiles still need their own reviewed imports.
