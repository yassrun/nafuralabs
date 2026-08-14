# INBOX

<!-- Capture globale Raster — task draft : une ligne = description, @tag optionnel, pas d'ID. -->
<!-- Promote → <projet>/raster-src/lots/<lot>/<sous-lot?>/tasks/ -->
- Rotationner creds.env + deepseek_api_key.txt — poussés sur 7 branches GitHub, valides ou non à vérifier @physical
- SEKTOR-81 : `cd sektor && ./gradlew build` compile + substitution VERT ; tests unitaires item/approbations/catalogue/etudes rouges (mockito, assertions, UUID `0000000000v1`) — jamais joués au lot 0 (OOM). Hors étapes. @bug
- Après PLT-12, chemins `secrets/` encore cités : docs/AGENTS.md · docs/README.md · nafura-platform/ops/dev-staging-local.sh (ENV_FILE + nafura.secrets) · nafura-platform/ops/scripts/vault-seed-from-local.sh (défaut) · .cursor/rules/cursor-qa-browser.mdc · sektor/README.md · platform/backend/features/collaboration/notification/README.md @tech
- nafura-platform/ops/README.md cite encore `toolchain/ops/` et `secrets/nafura.secrets` (hors étapes PLT-22 — le ticket nomme AGENTS.md) @tech
- PLT-23 : `platform/{core,features,integrations,build}` non suivis (sorties Gradle) — supprimés avec `platform/` ; pas de source perdue @tech
- PLT-24/31 : `nafura-platform/ops/lifecycle/build.gradle` chemins `platform/backend/` (collectMigrations fallback) — `projectDir` `:tools:lifecycle` corrigé PLT-31 @tech
- PLT-31 : mentions `products/` restantes dans docs historiques (PLATFORM_IMPORTS, venue-catalog/docs, comments SQL/TS, tickets de déménagement, relevé lot 0) — pas des chemins live @tech
- SEKTOR-80 : `sektor/{docs,tools,README.md}` hors étapes — restent jusqu'à PLT-31 @tech
- PLT-30 : `raster/README.md` + dir `web/` busy (node) ; `settings.gradle.kts` venue projectDir mis à jour (hors étapes mais requis pour le build) @tech
- PLT-21 : `toolchain/scripts/` (5 scripts P1 encoding) et `tools/scripts/generate-ai-schema.mjs` hors étapes — déplacés vers `nafura-platform/ops/legacy-toolchain-scripts/` et `legacy-tools-scripts/` pour ne pas les perdre ; à ranger ou jeter @tech
- SEKTOR-80 : restes `sektor/{docs,tools,README.md}` hors étapes (seulement backend/web/deploy/e2e) ; `nafura-platform/ops/dev-staging-local.sh` + `ops/AGENTS.md` + comments Java/SQL citent encore `sektor` ; `lifecycle/build.gradle` `sektor/backend` @tech
- PLT-32 : `cd sektor/web && npm run build` (prod) compile VERT ; budget initial 3.17 MB > 3.00 MB — hors étapes. `build:dev` VERT. @tech
- PLT-32 : docs historiques `./gradlew` racine (PLATFORM_IMPORTS, ETAT-DES-LIEUX, recettes blanner, lifecycle README chemins `products/` / `tools/lifecycle`) — pas des chemins live @tech
- PLT-35 : `mbs-studio/README.md` cite encore `toolchain/ops/nlops.sh` (live = `nafura-platform/ops/nlops.sh`) @tech
- PLT-36 : `devAuthBypass` toujours dans les `environment*.ts` (tous `false`) ; le mint mock est mort — activer le flag throw. @tech
- PLT-38 : leftovers `web/` racine jetés (esbuild raster tué). `sektor/{docs,tools}` restent (déjà SEKTOR-80). Venue `@angular/animations` ajouté — plus hoisté depuis les workspaces racine. @tech
