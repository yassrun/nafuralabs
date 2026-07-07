# PWA / Service Worker — cache et production (Task 15.5)

## Stratégie actuelle (`ngsw-config.json`)

- **App shell** : JS/CSS en `prefetch` (installation).
- **Assets** : `lazy` + `prefetch` pour `/assets/**` et le manifest.
- **Données** :
  - `i18n` : stratégie `freshness` (réseau puis cache, TTL 7j).
  - `shell-html` : `index.html` en `freshness` avec `maxAge: 0u` pour limiter un shell obsolète après déploiement (navigation offline dégradée acceptable vs app bloquée sur ancienne coquille).

## Pointage / IndexedDB

- Les **pointages** restent en `localStorage` (léger, déjà en place).
- Les **photos chantier** sont en **IndexedDB** (blobs compressés ~800px) + file d’attente `PENDING` synchronisée au retour réseau avec les pointages `LOCAL`.

## Garde-fou production

1. **Ne pas** élargir `dataGroups` aux API métier (`/api/**`) sans stratégie d’invalidation : risque de servir des réponses JSON périmées.
2. Après chaque release, le **hash des bundles** change : les entrées `files:/**/*.js` du SW se renouvellent — les utilisateurs reçoivent les nouveaux assets au prochain fetch du `ngsw.json`.
3. Pour forcer un refresh global, conserver `appData` / notifications Angular SW (`SwUpdate`) hors périmètre de ce document ; l’équipe peut les activer si besoin UX « Nouvelle version ».

## Versioning

- Le versioning applicatif repose sur les **noms de fichiers hashés** émis par le build Angular (`outputHashing`), pas sur un paramètre manuel dans `ngsw-config.json`.
