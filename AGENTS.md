# AGENTS.md — Nafura Labs

Point d’entrée de tout agent (Copilot, Cursor, Claude…). Répondre en **français**.

## Lire avant d’agir

| Sujet | Document |
|---|---|
| Architecture cible et état réel | [nafura-platform/docs/ARCHITECTURE.md](nafura-platform/docs/ARCHITECTURE.md) |
| Construire un BC : manifestes, records, cycles de vie, rôles, migrations, données initiales | [nafura-platform/docs/PLATFORM.md](nafura-platform/docs/PLATFORM.md) |
| Écrans : archétypes et composants, ce qu’on ne fait pas | [nafura-platform/docs/UI.md](nafura-platform/docs/UI.md) |
| Capabilities (état + roadmap par cap) | [nafura-platform/docs/capabilities/00-README.md](nafura-platform/docs/capabilities/00-README.md) |
| Lancer, tester, déployer | [nafura-platform/ops/README.md](nafura-platform/ops/README.md) |
| Prochains chantiers | [nafura-platform/ROADMAP.md](nafura-platform/ROADMAP.md) |

Le modèle à suivre est `platform-host/` (et son BC `bcs/demo`). **Sektor n’est pas un modèle** : il porte l’ancienne architecture et sera reconstruit sur le host.

## Règles

1. **Un produit = `app.nafura.json` + BCs.** Tout le générique est dans `nafura-platform`. Ne pas toucher aux points d’entrée d’un produit ; son nom n’existe que dans son `app.nafura.json`.
2. **Configurer avant de coder.** Un écran est une configuration d’archétype ; une API est un `RecordController` ; un statut est un cycle de vie JSON ; des données initiales sont un fichier de seed.
3. **N’ajouter aucun composant, artefact ou mécanisme parallèle.** Utiliser l’existant ; s’il manque quelque chose, le dire et proposer une option sur l’artefact existant, pas une copie.
4. **Permissions, jamais de rôles** dans le code.
5. **Lab mode** : pas de données métier en prod (hors vitrines MBS et corporate). Schéma cible net, pas de migrations défensives.
6. **Rien d’irréversible sans accord** : `prod`, `--yes`, suppression de données partagées, push.
7. **Vérifier** avant de rendre la main : `node <produit>/ops/run.mjs check` (architecture, build web, host-tests), puis l’application lancée en `lab` pour tout changement visible.
8. **Documentation** : mettre à jour le document concerné ci-dessus dans le même changement ; ne pas créer d’autre document. Pour une **capability**, tenir à jour `nafura-platform/docs/capabilities/<id>.md` (en plus des docs globaux pour le reste).
