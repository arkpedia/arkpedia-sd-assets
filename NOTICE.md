# Artwork and software

Arknights names, characters, artwork, game data, Spine models, shaders, effects and stage scenery belong to Hypergryph, Yostar and their respective rights holders. This unofficial fan repository does not grant rights to that material. Public upstream hosting is provenance, not a license from the rights holder.

Every model records its original source repository, directory, immutable commit and file hashes in `manifest.json`. The initial sources are [fexli/ArknightsResource](https://github.com/fexli/ArknightsResource) and [isHarryh/Ark-Models](https://github.com/isHarryh/Ark-Models). Stage scenery is extracted from the official Global Android asset CDN; its scene metadata records the resource version, source bundle paths and checksums. Native effect packages separately record their bundle identities and every delivered file hash in `native-effect-manifest.json` and its package receipts. No Stronghold-Protocol release assets or implementation code are included.

`furniture/` holds two unmodified game-client furniture renders — the Black Retro Chair and the Porcelain Bed — plus the silhouette masks the website uses to clip their baked catalogue backdrop. They come from [ArknightsAssets/ArknightsAssets2](https://github.com/ArknightsAssets/ArknightsAssets2) revision `404cf368572a4f346f66614612c40fd7779012b5`, path `assets/dyn/arts/ui/furnitureicons`; `furniture/manifest.json` records their hashes and the geometry the website and desktop app both expect.

The independently written importer and validation scripts are under the MIT license in `LICENSE`. That license applies only to our software, not to game assets. A renderer must separately follow the terms of its chosen Spine runtime.

Rights holders can request correction or removal through this repository's issues.
