# Arkpedia SD assets

Battle chibi (super deformed) Spine models and original stage scenery for Arkpedia's stage overhaul. This repository holds artwork and animation assets; stats, skills and stage rules stay in `arkpedia-data`.

## Website chibis

The manifest also supplies every model referenced by the website's existing chibi catalogue: **1,378 skin IDs**, including their battle facings and separate dormitory/base animations. `websiteSkins` maps each exact skin ID and `front`/`back`/`walk` selection to a model key. Shared original models remain explicit aliases; missing facings are not invented. The website reads this catalogue at one immutable SD repository commit and serves skeletons, atlases and textures from this repository only.

The website import adds **2,128 original models** (603 front, 593 back and 932 base/walk) to the previous 831 entries, for **2,959 complete entries**. The pinned upstream is `fexli/ArknightsResource` commit `d0b5af0b004b044d322397ce5ae79632b6d9fcdd`. Every imported file matches its original Git blob; filenames, all animation clips and alpha blending remain unchanged. Existing records and immutable directories are retained. This preserves the website's existing coverage rather than announcing any new regional availability or simulator combat support.

To migrate a reviewed website catalogue from pinned upstream URLs, with a local checkout of the declared upstream repository:

```sh
npm run import:website -- --index /path/to/website/data/chibi-art.json --source-root /path/to/ArknightsResource
npm test
npm run validate
```

The importer reads committed Git blobs, copies every atlas page, rejects conflicting references, and publishes the manifest only after complete validation. It can be rerun without replacing existing models. `import:model` retains `websiteSkins` when refreshing a model; a new skin must be mapped explicitly before it becomes available to the website. The historical Global operator catalogue below remains a separate inventory of reviewed default battle models.

The default operator artwork catalogue covers all **374 obtainable operators in the pinned Global character table**. `manifest.json` contains **831 complete entries**: 752 logical operator facings, seventy-six summon facings, and three existing enemies. The operator entries come from 742 original model directories: 368 Front/Back pairs, four Front-only originals, and two single-Spine originals. The previous 353 entries remain unchanged.

[operator-catalogue.json](operator-catalogue.json) records every operator ID, exact original folder and file names, source commit, file fingerprints and inspected idle/attack roles. It also records the verified exceptions: U-Official, Heidi, Angelina and Civilight Eterna share their original Front model for both logical facings; Sora and Skadi the Corrupting Heart share their original Spine model. Liskarm's original inner folder is `char_107_liskarm`, while the catalogue ID is `char_107_liskam`. No different operator or skin was substituted, and no default originals are missing from this pinned catalogue.

These imports establish artwork availability. The simulator's explicit regular-stage support registry still determines which operators are playable; skills, talents, summons and enemy behavior require their own source-backed adapters and combat tests. This catalogue covers default operator models only. Skin/form variants, the remaining summon/enemy catalogue and most effects are separate work.

All 831 entries have parsed Spine 3.8 animation durations, existing clip role mappings, available attack-event times and source header bounds. Bounds remain explicitly null when the original header has no positive dimensions. THRM-EX and Sora have no original normal attack clip; their recorded idle fallback is not treated as a real attack. Nightingale's original Cage has only static `Default`/`Idle` and a `Start` entrance, with no attack or hit event. Silence's original healing drone has only `Default`/`Idle`; its healing ticks come from the native ability, not an invented animation event. Both use verified default tokens from the original Global bundle. W's original Claymore retains its native Start, Attack hit event and Die clips; Silence the Paradigmatic's Support Drone retains Start/Idle/Die with no invented attack. Nearl the Radiant Knight's original Blazing Sun retains a static Idle pose, Start entrance and End dismissal, with no invented attack. Mayer's original Robotter retains Attack, Blast, Idle and Die with no invented Start; Blacknight's original Slumberfoot retains its native active/dormant and Sleep clip families. Both use explicit aliases for their single original skeleton. Windflit's original equipment uses Start, Idle and End, with no fabricated attack; its native Idle event does not enable battery damage. Alanna's original Nutty uses Start, Idle and Die, with no attack or attack event; its single original skeleton supplies explicit front/back aliases. Scene's original Buggy Cams retain distinct Front/Back skeletons, Attack, Idle, Die and Stun with no invented Start entrance; her reviewed S1 uses its native one-shot beginning and S2 keeps ordinary attacks. Kal'tsit's original Mon3tr retains Attack, Skill and Skill_2 attack events, Start, Idle and Die; its single native skeleton provides explicit front/back aliases. Nian's reviewed skill roles use ordinary attacks for S1, a conservative idle pose for disarmed S2, and Skill_2 for S3 on both original facings. These single native skeletons provide explicit front/back aliases. Frost's original Welcome Mat retains Start, Attack_Begin and its 0.1-second hit event, Attack_Loop, and Attack_End dismissal; its single fixed-rotation skeleton supplies explicit front/back aliases. Their atlas attachments have been checked with the simulator's Spine parser. New catalogue role mappings resolve existing clip names for inspection; they do not establish that each skill uses that clip in the original game. Combat adapters verify the native skill bindings separately. Alpha blending is recorded per model; extracted original summon textures merge the source RGB and Alpha channels. Browser checks cover selected squads and do not establish complete visual or frame-for-frame combat accuracy.

The catalogue is pinned to `Kengxxiao/ArknightsGameData_YoStar` character-table commit `57010cb5b2afea112cae57daa756b58676ba6850` and `fexli/ArknightsResource` model commit `d0b5af0b004b044d322397ce5ae79632b6d9fcdd`. The inventory excludes non-obtainable, token and trap entries from the operator table. Import validation and tests check the model hashes, inventory identities and original-facing aliases.

 Dusk's original Little Instinct token includes its actual entrance, attack, death and stun clips, with the source attack event at 0.433 seconds. Both logical facings share that original auto-facing skeleton. Its import does not enable Dusk's combat kit by itself.


Robin's original Clip retains both binding and launching Start/Idle/Skill/Die/Retreat variants and the literal 0.167-second hit events. Both logical facings share the original fixed-rotation skeleton. The separate simulator now enables her reviewed stocked-trap adapter. Native ATK inheritance timing remains unrecovered; the adapter documents and tests its owner-ATK snapshot at placement.

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

The [public simulator MVP](https://github.com/arkpedia/arkpedia-stage-simulator) consumes an immutable SD commit. The website integration reads `websiteSkins` from this manifest and publishes commit-pinned URLs through its content release. Asset publication, development integration and production promotion are separate steps. Adding coverage reports, further token/effect imports and automatic discovery/import of newly released upstream models remain follow-up work on `feat/stage-overhaul`. The manifest must distinguish missing art from unsupported mechanics.

## Reference

[Stronghold-Protocol](https://github.com/sganggs/Stronghold-Protocol) demonstrates a 3D board with animated Spine units. Its source and asset documentation were used for architectural research, without copying its code or bundled media. See [NOTICE.md](NOTICE.md) for provenance and ownership.

## Stage scenery

`stage-manifest.json` also publishes 0-1's original Chernobog scene: 177 static submeshes, tile heights, original UVs, colour/emission textures and baked lighting. Files are about 1.7 MB combined. Each file has a SHA-256 hash; the scene records the official Global Android resource version and verified bundle checksums. Runtime clients must pin a repository commit and match the scene's geometry hash to their gameplay grid.

This is one verified stage, not automatic coverage of the stage catalogue. The GPL simulator's `tools/arkpedia/stages/export-scene.py` performs the extraction from the official scene, theme and lighting bundles. No Stronghold release media is used. The web renderer approximates the game shader; game assets alone do not establish identical lighting or battle behavior.

## Skill effects

`stage-manifest.json` includes `effects.chargeCost`: the five billboard particle emitters and two lossless textures in the original `common_charge_cost_start_01` activation burst shared by Fang and Vanilla. The pack records the verified Global Android bundle checksums, independent RGB/alpha gradient keys, Hermite size curves, burst counts, transforms, angular velocity and birth sub-emitter relation. Its files total about 22 KB.

This is the activation burst only. The follow-up `common_charge_cost_01` flight toward the DP counter needs game-specific motion, noise and trail scripts. The simulator also approximates native velocity damping and the operator centre anchor; these limits are explicit in `effect.json`. A new source module or shader requires extractor/runtime review. All other skill effects and projectiles still need their own reviewed imports.

Kazemaru's original Kaminingyo uses distinct native Front and Back skeletons, with Attack, Idle and Start clips and the original 0.433-second Attack and 0.267-second Start events. Only Front contains Die. The default models come from the verified Global token bundle, not the available Witch Feast skin variant. Their RGB and Alpha textures are merged with source PMA retained. Artwork publication does not establish simulator frame parity.

Wulfenite’s original Ore Killer uses one fixed-rotation skeleton, with explicit front/back aliases, Start and static Idle clips, and a Die detonation clip with its original 0.067-second attack event. Its extracted texture preserves the native PMA material. Separate Unity blast and idle effects remain source references, not reproduced particles.

Weedy’s original Industrial Water Cannon uses distinct Front/Back skeletons selected by the native animator. Both source facings have identical file names, so their skeleton, atlas, material, RGB and Alpha textures are resolved through the original pointers. Each retains Start, Idle, Skill, Attack_Begin/Loop/End and literal attack events: 0.033 seconds for Attack_Loop and 0.333 seconds for Skill. Only Front has the Down variants. The native Die alias is Idle; no death clip is invented. The source bundle’s official size/MD5 and SHA-256, extracted file hashes, texture pixels and skeleton chains are verified. This artwork import does not enable Weedy’s combat kit or establish native particle/frame parity.

Amiya's original Guard form is published separately from the historical 374-operator catalogue. Its two native facing chains retain Attack, S1's two attack events, S2's eleven source events and the original skill/end/idle clips. Only Front contains Die; Back does not invent a death clip. The Global form art bundle, skeleton/atlas/material pointers, merged RGB/alpha pixels and original avatar are independently verified by the simulator's Guard source tools. This adds two model entries without changing the historical catalogue or claiming combat/frame/VFX parity.

Ela’s original base GRZMOT Mine is decoded from the checksum-verified Global token bundle. Its front/back aliases intentionally share one original RGBA texture and skeleton, with Start, Idle and Attack, and no invented Die clip. This adds two entries without changing the previous 823 model records.

Swire the Elegant Wit’s original Champagne Bomb follows the Global token bundle’s animator, single skeleton, atlas, material and separate RGB/alpha textures. Front/back aliases share the original bytes and preserve Start, Idle, Attack with its original 0.2-second hit event, and Die. These two entries preserve the previous 825 records; coin trails, audio and compiled combat timing are not supplied by this artwork.

Rosmontis’s original Tactical Equipment retains its native fixed-facing skeleton, Start/Idle/Die clips, complete atlas and merged RGB/alpha texture. The front/back aliases share original bytes and have no fabricated avatar. These two entries preserve all 827 prior records; they supply artwork rather than combat, module or particle/frame parity.

Revenant’s Shadow uses its original embedded 216×216 RGBA texture and native Start, Idle, Attack and Die clips. Both logical facings retain the same original skeleton and left/right switcher provenance. The native OnAttack event is at 0.033 seconds; its visual Attack tail is 2.033 seconds. Asset publication establishes artwork availability only; Wiš’adel’s full public combat integration and browser review remain separate gates.

Exusiai the New Covenant's original Delivery Coordinates marker follows its default animator, single skeleton, atlas and material in the checksum-verified Global token bundle. Both renderer facings explicitly alias that one skeleton. The embedded RGBA texture preserves its native premultiplied alpha; the original avatar is pinned separately. The model has Start, Idle and Die with no attack events or fabricated attack role. Independent verification checks the native pointer chain, exact pixels, atlas regions, clips and both delivered aliases. This artwork does not enable the operator or establish Unity shader, particle, audio or combat frame parity.
