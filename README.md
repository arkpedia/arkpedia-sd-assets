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

The importer reads committed Git blobs, copies every atlas page, rejects conflicting references, and publishes the manifest only after complete validation. It can be rerun without replacing existing models. `import:model` retains `websiteSkins` when refreshing a model. The historical Global operator catalogue below remains a separate inventory of reviewed default battle models.

Original-client model imports can also declare `sourceBundle.client: "cn"`. These retain a separate `cn-client` source identity and must use the exact official `ak.hycdn.cn` resource-version and bundle-archive URL; the version, path, checksums and extracted files remain pinned. An undeclared CN URL cannot pass as a Global source, and altered hosts, paths, queries or fragments are rejected. Existing Global receipts keep their source identity and validation. This import capability alone does not publish any new artwork or enable a simulator operator.

Closure's original command center (`token_10066_closur_ourbase`) uses distinct Front/Back models from the checksum-pinned CN client `26-09-22-07-47-20_6c71fa`. Both embedded 84×84 premultiplied RGBA pages retain their native atlas regions and literal Start/Idle tracks. Front also has Die; Back has no Die. Neither has Attack or Stun, and those clips are not invented. RGB compression bleed is clamped to alpha and atlas page/PMA headers are normalized. The original avatar is pinned separately. [source-reviews/closure-command-center.json](source-reviews/closure-command-center.json) records both complete native pointer chains, material settings and immutable file hashes.

Closure's existing owner files remain unchanged. Their former null animation metadata is filled with native continuous-fire Begin/Loop roles and skill tracks, and premultiplied-alpha rendering follows the original material. The original PNG pixels match the decoded client textures exactly; the mirror atlas omits only the native leading blank line and size header. Unrequested attack End clips are not enabled. Back lacks the owner Die/down tracks as recorded. Two token models and two owner metadata updates bring the catalogue to **3,013 models**, preserving all 3,009 other model records.

The simulator's independent verifier reopens original prefab roots, checks each pixel and atlas region, and validates the existing owner files against their pinned Git bytes and native artwork. Repeat extraction reproduces ten files and rejects 34 altered provenance, pointer, pixel, timing and approval claims. Chromium decodes all 43 available non-Default clips on desktop and emulated landscape touch, with 28 inspected captures and no browser/resource errors. These are artwork delivery checks; public battle integration, enemy-clock fidelity, native particles/audio/shaders and original game-frame/pixel parity remain separate.

### Automatic discovery and delivery

`Sync website chibis` runs daily at 16:23 UTC and supports manual dispatch. It pins one `fexli/ArknightsResource` commit, reads its native skin table and Spine tree, and discovers new operators, outfits and base animations. Exact `battleSkin`, `tmplId` and `buildingId` references determine the models; absent battle files stay pending in `manifest.websiteSource.pending` and are retried on the next run. No alternate operator, outfit or invented facing fills a gap.

```sh
git clone --filter=blob:none --no-checkout --depth 1 https://github.com/fexli/ArknightsResource.git .cache/arknights-resource
npm run sync:website -- --source-root .cache/arknights-resource
```

Unchanged files keep their existing pins. New/changed website models use automation-owned `website_<prefab>` variants, preserving every reviewed simulator record and all older immutable files. The import rejects truncated skin tables, incomplete atlas uploads and unsupported Spine versions; its manifest changes only after full validation. The workflow tests, validates and commits the complete files and manifest together. A failed push or import raises an `SD chibi sync failing` issue; a successful rerun closes it.

Native template forms use `tmplId` for battle identity and `buildingId` for their base model. Reviewed exact-form default models already in SD take precedence. This corrects inherited Guard/Medic Amiya battle aliases to their respective verified originals, with Medic Amiya's own base model imported separately; Guard's shared Caster base model follows its explicit native building reference.

`websiteDefaultSkins` records each template form's exact native default skin ID. Some forms have only `#2`, while the website's Base display normally looks up `#1`. The website can generate that display alias from this source declaration; the SD skin inventory keeps the real ID and validates that its battle models belong to the template itself.

The website's scheduled content preparation waits for this sync alongside its other asset jobs, then adopts SD's complete, commit-pinned `websiteSkins` catalogue. It also reports failed or stale SD syncs. Later model additions need a content release, without an app redeploy. Upstream dump availability and GitHub scheduling delays determine when a release can adopt the artwork; the previous published models remain usable during failures. Manual edits/imports and syncs must run sequentially.

Sora's **Summer Flowers FA361** battle model is imported from the checksum-verified Global client `skinpack/char_101_sora.ab`, resource version `26-09-23-17-49-43_b9cc4a`. The native `char_101_sora_summer#1` prefab points to assets named `char_101_sora`, which are absent under the summer battle filename in the primary mirror. [source-reviews/sora-summer.json](source-reviews/sora-summer.json) records the original URL, bundle checksums, exact prefab/skeleton/atlas/material/texture pointers, extraction transforms and file hashes. The original Spine 3.8.99 skeleton supplies Default, Die, Idle, Start and Stun; no attack clip or additional facing is invented. The matching native base prefab is imported separately from the primary mirror. Daily discovery preserves the reviewed battle record and its binding, retains the base model, and clears the former pending entry. Historical community copies use Spine 3.5.51 and are not substituted into the website's Spine 3.8 player.

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

The [public simulator MVP](https://github.com/arkpedia/arkpedia-stage-simulator) consumes an immutable SD commit. The website integration reads `websiteSkins` from this manifest and publishes commit-pinned URLs through its content release. Asset publication, development integration and production promotion are separate steps. Further simulator token/effect imports and combat support remain separate work on `feat/stage-overhaul`. The manifest must distinguish missing art from unsupported mechanics.

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

Magallan's three original default drones use separate RGB and alpha textures in the verified Global token bundle. Each retains its own root/controller/animator/skeleton/atlas/material chain and pinned default avatar. Front/back explicitly alias that drone's one original skeleton and FaceSwitcher. All retain Start and Idle; the native death role is Idle even though a literal Die clip exists. The freezing drone has no attack role; mining and combat retain their original Attack clips and 7/30- and 21/30-second events. Six entries are added without changing any of the previous 2,980 models. The public simulator's `extract-magallan-models.py`, `verify-magallan-models.py --delivered`, negative-fixture checks and repeat-extraction check establish pointer, pixel, region, clip and file-byte provenance. This publishes artwork; public combat integration, native shader/particle/audio and frame parity remain separate work.

### Original default Ling dragons

Ling's three original default dragons retain their independent native root/controller/animator/skeleton/atlas/material bindings and pinned avatars. Each front/back pair explicitly shares that dragon's one original skeleton and FaceSwitcher. The first two have 256-pixel split-alpha pages; the third has a 512-pixel page containing both lower and higher forms. Native Attack, Start, Idle, Die and Stun clips are preserved, including S2's Skill clip and S3's higher-form Attack_02, Idle_02, Die_02, Stun_02 and Start_02. Publishing Start_02 does not imply playing it during fusion: the native higher-form animation hook excludes Born.

Six entries are added without changing the previous 2,986 models. The simulator's `extract-ling-models.py`, `verify-ling-models.py --delivered`, repeat-extraction check and 28 altered-fixture checks establish original pointer, split-alpha pixel, atlas-region, alias, event and file-byte provenance. A separate browser artwork review decodes all 22 non-Default clips and captures lower/ranged/higher forms at desktop and landscape-phone sizes. This publishes original artwork only; public battle integration and native shader/particle/audio or frame parity remain separate checks.

### Original default Stainless devices

Stainless’s ATK and SP platforms retain their single original skeletons, split-alpha 512-pixel pages, pinned default avatars and literal Start, Idle and End clips. Their front/back entries explicitly alias the same native skeleton. The turret retains three distinct native Front, Back and Down chains, split-alpha 256-pixel pages, Start, Idle, Attack and Die, and its original hit event. Identical source filenames are resolved through each animator’s original pointers.

Seven entries are added while preserving all previous 2,994 records, for 3,001 complete models. The importer accepts an optional third original token Down facing with a literal skeleton chain; unknown facing names and unresolved identities fail before manifest publication. The simulator’s `extract-stainless-models.py`, independent `verify-stainless-models.py --delivered`, repeat-extraction check and 27 altered-fixture checks establish pointer, pixel, region, avatar, alias, event and byte provenance. Chromium decodes all 18 non-Default clips and captures desktop and landscape-phone artwork. This publishes artwork; public battle integration, native particles/shaders/audio and combat frame parity remain separate checks.

### Original default Cherry-3

Mitm's Cherry-3 retains its original single skeleton, FaceSwitcher, complete atlas and 276×276 embedded-alpha RGBA page. Front/back entries explicitly alias that one model. The native material has no separate alpha texture; decoded pixels are preserved directly. Only the atlas page-size/PMA headers are normalized. Original Start, Idle_1, Attack, Die and Skill_Begin/Loop/End clips remain literal, including the 0.46666666865348816-second attack event. Waste, Idle_2 and Stun_2/3 retain their static zero-duration poses. The pinned avatar is included.

### Original default Flowing Shape

Muelsyse's Flowing Shape retains one original skeleton and FaceSwitcher, with explicit front/back aliases. Its native 512×512 RGB and separate alpha pages are merged as premultiplied RGBA, clamping compressed RGB bleed to alpha. The atlas keeps its original regions with normalized page dimensions and PMA headers. The pinned default avatar is included.

Default water, melee A and ranged B animations retain their literal names and events. `B_Attack_2` has separate hit events at `0.30000001192092896` and `0.3333333432674408`; `Change_A` and `Change_B` retain their 0.667-second clips. `Idle_2` is an intentionally invisible zero-duration recovery pose. The importer adds two entries while preserving all prior 3,003 entries, for 3,005 complete models.

The simulator's `extract-muelsyse-models.py`, independent `verify-muelsyse-models.py --delivered`, byte-identical re-extraction and 30 altered-metadata rejection checks verify source pointers, decoded pixels, atlas regions, avatar, aliases, events and delivered bytes. A separate Chromium artwork review decodes 48 owner/token clips and captures 32 desktop and landscape-phone states. This publishes artwork only; Muelsyse's public battle integration, native shaders/particles/audio and combat frame parity remain separate checks.

Two entries are added without changing any of the previous 3,001 models. The simulator's `extract-mitm-models.py`, independent `verify-mitm-models.py --delivered`, byte-identical repeat extraction and thirty altered-fixture checks establish pointer, pixel, region, alias, event and file provenance. The verifier also checks Mitm's existing Front/Back assets against their pinned Git bytes and native model records. An isolated Chromium review decodes all 29 owner/device non-Default clips and captures desktop and landscape-phone artwork. Asset publication does not enable Mitm's public combat kit or establish native shader/particle/audio or frame parity.

### Original default Necrass servants

Necrass's servant retains separate original Front/Back skeleton chains from the pinned Global token bundle. Each chain includes its 428×428 embedded premultiplied RGBA page, original atlas regions and pinned avatar. Decoded RGB is clamped to alpha to remove compression bleed; atlas page-size/PMA headers are normalized. The ordinary and dragon forms share these original skeletons, with their distinct literal animation names retained.

The native Back skeleton lacks Stun/Stun_2, Die/Die_2 and the Down skill clips. No replacement clip or facing alias is introduced. The full native bindings and required-alias gaps are recorded in `source-reviews/necrass-servants.json`; default animation roles describe the ordinary form. The source controller separately selects the dragon's Start/Idle/Attack and skill clips.

Two entries are added while preserving all previous 3,005 model records, for 3,007 complete models. The simulator's `extract-necrass-models.py`, independent `verify-necrass-models.py --delivered`, repeat-extraction check and 24 altered-metadata rejection checks verify original pointers, every decoded pixel, atlas regions, avatars, clips, events and delivered files. Chromium decodes all 48 available owner/servant non-Default clips and captures 40 desktop/landscape-phone artwork states. This publishes artwork only; Necrass public selection, played-stage review and native combat/shader/particle/audio parity remain separate.

### Original Tragodia lure and cage inputs

Tragodia's Blood's Whisper lure retains the native Single Spine model from Global client `26-09-23-17-49-43_b9cc4a`. Its two facing entries explicitly share that skeleton. The 116×116 premultiplied RGBA page, atlas regions, Start/Loop/End clips and original End event are preserved; RGB is clamped to alpha to remove compression bleed, and atlas page-size/PMA headers are normalized. End is controller-driven, not an invented death role. The pinned avatar and native pointer chain are recorded in [source-reviews/tragodia-lure.json](source-reviews/tragodia-lure.json). Two entries bring the model inventory to **3,009**, preserving all previous 3,007 records.

[native-effect-manifest.json](native-effect-manifest.json) separately indexes the immutable Tragodia effect package. It contains the original compressed object/mesh pack, animation channels, shader programs, built-in mesh bindings, all 72 textures and the unchanged source receipts. Its 33 roots are source inventory; only `phatm2_skill_03_prison_01` has prepared renderer coverage. Four unresolved references elsewhere in the pack remain recorded. The cage is an effect-only native actor, not a Spine model. No substitute model is added.

The package manifest records each file's SHA-256 and size, the decoded pack hash, source bundle identities and explicit artwork-only scope. `scripts/import-native-effect.mjs --metadata <export>/manifest.json --source-root <export>` validates that chain before copying, rejects changed immutable paths, and publishes its registry only after complete validation. `npm test` covers corruption, source rebinding, omitted textures, repeat imports and unchanged unrelated registries. `npm run validate` checks all models, scenery and native effect files.

The simulator's independent verifier compares all 79 delivered inputs against its frozen extraction receipts and source files. Its lure audit reproduces six files and rejects 22 altered claims. Chromium decodes 31 owner/lure clips, captures 30 desktop/landscape-phone artwork states, and renders the delivered cage with 19 prepared draw entries and zero blocked components or WebGL errors. These checks establish asset delivery and renderer compatibility; public battle integration, compiled Unity behavior, native pixel/frame parity and audio remain separate work. Game shaders and effect data remain game assets under NOTICE.md, outside the importer software's MIT license.

### Original Mon3tr Reconstruction artwork

Reconstruction retains its original Single skeleton from the same pinned Global token bundle, explicitly aliased for Front and Back. The 148×148 embedded premultiplied RGBA page retains its atlas regions, with RGB clamped to alpha and normalized page-size/PMA headers. The literal zero-duration `Skill_3` pose is empty; it is not replaced with Idle. The original Attack clip remains in the skeleton, while the default attack role is null because the native healing abilities do not request that clip.

[source-reviews/mon3tr-reconstruction.json](source-reviews/mon3tr-reconstruction.json) records the native pointer chain and immutable hashes. Two additions bring the inventory to **3,011** models, retaining the previous 3,009 entries. The simulator independently reproduces six extracted files, rejects 22 altered claims, decodes 37 owner/token clips and captures 32 desktop/landscape-phone states. This is artwork delivery and compatibility evidence; Mon3tr's playable kit, Unity behavior, particles, audio and game-frame parity require separate review.

### Original Record Keeper owner metadata

Record Keeper's existing Front and Back files remain byte-identical to their pinned source. [source-reviews/record-keeper.json](source-reviews/record-keeper.json) binds both skeleton chains, atlas regions and every decoded texture pixel to the original CN artwork bundle. Metadata now uses the native premultiplied-alpha input. S1 retains Attack; S2 selects its literal Skill_Begin, Skill_Loop and Skill_Idle clips without inferring Skill_End. Back has no death clip.

Only these two metadata records change; all other 3,011 models and all original files remain unchanged. The simulator's independent source audit reproduces the receipt and rejects 32 altered claims on Node 22 and 24. Chromium decodes all 15 usable owner clips per viewport and captures 16 desktop and emulated landscape-phone states, with no browser or resource errors. This is artwork delivery evidence; playable selection, original-stage review, native particles/shaders/audio and game-frame parity remain separate.

### Original Vetochki owner metadata

Vetochki's existing Front/Back files remain byte-identical to the pinned source. [source-reviews/vetochki.json](source-reviews/vetochki.json) binds the original native skeleton/atlas/material/texture pointers and every decoded pixel. Both inputs are premultiplied alpha. S1 retains Attack; S2 uses its literal Skill_2_Begin/Loop/Idle clips. The original art controller explicitly mixes Skill_2_Idle or Skill_2_Loop into Idle through Skill_2_End; these two End transitions are preserved. Back has no death clip.

Only these two metadata records change; the other 3,011 models and all original files remain unchanged. Source verification, negative-claim rejection and controlled artwork review are separate from playable admission, native shader/particle/audio and game-frame parity.

Validation passes all 54 asset tests and the complete 3,013-model catalogue on Node 22 and 24. The simulator independently verifies delivered files/pixels/materials, reproduces the receipt and rejects 32 altered artwork/approval claims on both versions. Chromium decodes all 15 usable clips per viewport and captures 16 desktop/emulated landscape-phone states without browser/resource errors. Desktop Begin and phone End captures are visually inspected.
