# platform-host — un produit = config + BCs

> Une app hôte prête à l’emploi. Un nouveau produit la copie, pose son `app.nafura.json`, ajoute ses BCs (code + manifeste + rôles). Il obtient une app fonctionnelle : login, tenant, admin, IAM, réglages, shell.

**Pact :** un produit Nafura ne code **que** le métier de ses BCs et **configure** la plateforme. Tout le reste est plateforme. Si un fichier produit n’est ni config ni code BC, c’est un manque plateforme.

**Cible :** reconstruire Sektor sur le host : `app.nafura.json` + BCs Sektor, sans `socle` plateforme-bis.

## Leçons Sektor

| Erreur | Où | Règle du lot |
|---|---|---|
| Plateforme-bis dans le produit | `sektor/sources/backend/socle` (approbation, onboarding, invitations, admin IA, chrome, dev), `sektor/sources/web/app/socle` | Le générique remonte dans la plateforme |
| Config codée en dur | `sektor/sources/web/app/socle/config/routes.ts` (app id, hostname, shell, nom) | La config vit dans `app.nafura.json` |
| Générateur qui copie du code | `nafgen` : fichiers « do not edit » maintenus à la main | Pas de code généré dans le produit ; la plateforme **lit** la config |
| Aucune frontière d’import | `includeBuild` + alias `@platform/*`, `@features/*`, `@core/*` | Le produit n’importe que l’API publique du host |
| Deux formats de manifeste | `NafuraManifest` (`nafura.io/v1`) vs `sandbox/*.example.json` | Un seul format, validé |

## Sous-lots

| # | Sous-lot | Livre | Statut |
|---|---|---|---|
| 1 | [`contrat-v1`](contrat-v1/00-PLAN.md) | Format unique app + BC, validation, schémas JSON | livré |
| 2 | [`host-v1`](host-v1/00-PLAN.md) | `platform-host/` : app sans BC qui démarre depuis `app.nafura.json` | livré |
| 3 | [`capabilities-v1`](capabilities-v1/00-PLAN.md) | Le host embarque **toutes** les capabilities, testées ; un produit en retire par config | livré |
| 4 | [`bc-v1`](bc-v1/00-PLAN.md) | Un BC démo monté par son seul manifeste (routes, nav, permissions, rôles seedés), migrations réelles, menu filtré par permissions | livré |
| 5 | `socle-sektor` | Remonter le générique du `socle` Sektor : invitations/onboarding → ~~admin IA~~ → chrome → approbation | en cours (admin IA + adaptateur e-mail d’invitation remontés) |
| 6 | `sektor-sur-host` | Sektor = host + `app.nafura.json` + BCs Sektor ; e2e Sektor verts | après 4 et 5 |
| 7 | `publication-v1` | Artefacts versionnés (BOM Maven, paquets npm) ; plus d’`includeBuild` ni d’alias source | après 6 |

Chaque sous-lot reçoit son `00-PLAN.md` à son ouverture.

## Décisions

- **D-1** Host = produit top-level `platform-host/` (même anatomie que les autres produits), bâti depuis le squelette `sandbox`. Le sandbox reste la vitrine composants.
- **D-2** Les BCs sont composés au build. L’activation par tenant est runtime et appartient à l’opérateur Nafura, pas au manifeste produit.
- **D-3** Rôles : le BC déclare permissions et rôles par défaut ; l’IAM plateforme les seede, idempotent. Les rôles custom restent tenant.
- **D-4** Extraction `socle` : un bloc à la fois, protégé par une preuve existante (règle ROADMAP).
- **D-5** Liste noire : le host embarque toutes les capabilities, testées ensemble. Un produit n’en ajoute pas, il en retire (`spec.capabilities.disabled`). La désactivation est au build, pilotée par le même `app.nafura.json` côté web et backend. `requires` reste pour les BCs : une capability requise par un BC ne peut pas être retirée.
- **D-6** Un produit ne code que ses BCs. Un garde-fou automatique échoue si un produit contient du code hors BC et points d’entrée.
- **D-7** Rôles : la plateforme possède le mécanisme (IAM, attribution, rôles custom, application). Un BC déclare ses permissions (namespace `<bc>.`) et ses rôles par défaut ; le produit compose des rôles transverses dans `app.nafura.json` `spec.roles` (`includes: ["bc.x:ROLE"]` ou `permissions`). Le code BC vérifie des **permissions**, jamais des rôles (garde-fou).
- **D-8** Local = mêmes migrations SQL que staging/prod : le changelog est généré au build depuis le classpath composé ; le lab l’applique (Liquibase) et valide les entités (`ddl-auto: validate`). Staging/prod : job `lifecycle` inchangé.
- **D-9** Un `@RequirePermission` est appliqué même sans `@SecuredResource` (il nomme alors la permission complète). Le menu affiche un écran seulement si l’utilisateur a la permission que lit son API.
- **D-10** Activation d’un BC par organisation : code de domaine = id du BC sans `bc.` = préfixe de ses permissions. Un BC déclaré est actif par défaut ; l’écran Domaines écrit `tenant_domain`. Désactivé : `PermissionEnforcementFilter` refuse (403) toute permission de ce préfixe à tous, super-admin compris ; le menu, l’accueil et les routes du BC le masquent (`GET /api/v1/me/permissions` → `disabledDomains`). Rien n’est supprimé.
- **D-11** Une seule sidebar plateforme : `nf-sidebar-nav` (`core/navigation`, règles pures `sidebar-tree.ts`), utilisée par le shell Sektor et le shell host. Zones ordonnées, domaines repliables (un ouvert par zone), sections, liens, badges (fournisseurs), mode replié en icônes. Côté host : espace de travail, puis un groupe par BC (libellé/icône du manifeste, navigation en arbre), puis Administration et Paramètres. Le rail de contextes est supprimé : un BC se déclare par `spec.label`/`spec.icon`.
- **D-12** Disposition du shell (identique Sektor) : la sidebar porte l’identité produit (en haut), la navigation et la personne (menu utilisateur en bas) ; la barre du haut dit où l’on est (écran courant) et porte organisation, notifications, assistant. L’identité appartient au produit : `app.nafura.json` `spec.product` (`name`, `mark` icône carrée, `logo` large optionnel), fichiers dans `<produit>/sources/web/public/` (garde-fou : les fichiers déclarés existent). La plateforme l’affiche partout : sidebar, login, onglet, favicon. Sans `mark`, l’initiale du nom.
- **D-13** Un écran de liste = une configuration `*.listing.ts` (`ListingPageConfig` : endpoint, colonnes, filtres, actions), rendue par `nf-listing-page` (`platform/listing`) via la route (`component: ListingPageComponent, data: { listing }`). Les actions sont déclaratives : route, confirmation, formulaire (`nf-form` en dialogue), requête, secret révélé une fois, toasts ; filtrées par permission, `when` par ligne. Garde-fous : chaque texte a son français, chaque permission existe côté backend. Migrés : Clés API, Webhooks, Numérotation, Notes (BC démo).
- **D-14** Un seul artefact de liste : `nf-listing-flat` rend toute liste. `nf-entity-listing` (pages `ConfigDrivenListingPage`, ~60 écrans plateforme + Sektor) n’est plus qu’un adaptateur facade → `nf-listing-flat` (même API publique). L’artefact porte : cellules personnalisées (`nfColumn`), options de filtres par `lookupKey`, mode filtres simple (backend `champ=valeur`), segments (onglets de vues rapides, `segments` en config, remplacent les « chips » faites main), état vide avec action, erreur + réessai, mode ouverture (maître–détail), recherche différée en mode serveur. Les sous-listes de détail (membres d’un rôle, exécutions, livraisons, sessions) et Approbations l’utilisent aussi. Garde-fou : chaque phrase de l’artefact a son français.
- **D-15** Archétypes d’écran = cadre (`nf-screen`) → archétype → blocs. Un BC ne code que son métier et configure le reste.
  - **Backend** (`framework.record`) : un `RecordController<E>` donne liste paginée/triée/recherchée (`q`, filtres d’égalité typés), `options` (listes de choix), CRUD (PUT/DELETE refusés 409 hors statuts éditables). Le cycle de vie est un JSON (`lifecycle/*.json` : états, transitions, permission, champs `requires`, `approval` avec rôle, condition `when`, transitions `approved`/`rejected` système), validé au démarrage ; `LifecycleEngine` tire les transitions (404/403/409/422 « Required fields »), demande l’approbation via `ApprovalGateway` (module approbation) et applique la décision.
  - **Front** (`platform/record`) : `recordRoute(path, RecordPageConfig)` rend une fiche en `sections`, `tabs` ou `steps` (étapes = statuts du cycle de vie ; sans cycle de vie à la création = assistant Précédent/Suivant/Créer). Sections = champs `nf-form` ou liste liée (`nf-listing-page` `embedded`). Enregistrement toujours éditable si permis et statut éditable : barre d’enregistrement contextuelle (`nf-save-bar`, Ctrl+S, garde de sortie). Barre d’outils : statut, transitions (bloquées tant que non enregistré), ⋯ supprimer. Refus « champs requis » : message avec libellés et ouverture de l’étape concernée.
  - **Approbations** : boîte unique `/approvals` pour tout approbateur (rôle de l’étape vérifié par le service) ; le titre mène à la fiche (`registerEntityRoutes`).
  - **Prototype** : le BC démo « Achats » couvre chaque archétype — liste plate + segments (Fournisseurs, Articles, Demandes), arbre (Catégories), fiche standard (Article), fiche à onglets + liste liée (Fournisseur → contacts), assistant de création (Fournisseur), cycle de vie + approbation conditionnelle (Demande d’achat > 10 000 MAD), parcours par étapes + approbation + rejet (Projet > 100 000 MAD). Rôles : `DEMO_VIEWER` lecture seule, `DEMO_EDITOR` tout.

## Dettes révélées par le host complet

- ~~**Schéma**~~ corrigé (`bc-v1`) : la plateforme a ses changelogs ; le host les applique et valide. Manquaient `geo` (4 tables) et `webhook_config_events`.
- ~~**Entités `ma.nafura.geo`**~~ : migrations ajoutées ; reste à les scanner dans `PlatformHostApplication` (seul `host-tests` les inclut).
- **Tableau de bord** : `features/dashboard` affiche des widgets métier (chiffre d’affaires, factures) dans un écran plateforme, et lit le journal d’audit pour tous (403 hors admins).
- **i18n dupliquée** : 720 clés copiées de Sektor vers la plateforme ; Sektor les charge encore par HTTP jusqu’à `sektor-sur-host`.
- **`SYSCONFIG_ROUTES`** : stub `nafgen` (redirige vers « indisponible ») ; `cap.sysconfig` n’est exposée que par la numérotation.
- **i18n BC** : le BC démo a des libellés en dur ; pas encore de chargement i18n par BC.
- **Permissions côté front hors host** : `PermissionService.hasPermission` renvoie `true` quand `requiresTenant: false` ; le host filtre par `/api/auth/me/permissions`, les autres produits pas encore.

## Hors lot

- Refonte des écrans métier Sektor (le lot déplace, il ne redessine pas).
- Micro-frontends / module federation.
- Venue Catalog et MBS Studio sur le host (après `sektor-sur-host`).
- CLI `nafura new` / `nafura add bc` (après `host-v1`, lot `nafura-cli`).
