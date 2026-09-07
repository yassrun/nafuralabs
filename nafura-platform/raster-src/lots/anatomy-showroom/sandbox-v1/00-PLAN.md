# sandbox-v1

> Mini-app **Anatomy Showroom** navigable + canon des archétypes d’écran (listing, details, details-1N, tree) avec une démo live par pattern.

## Intention

Quand ce sous-lot est livré :

1. On lance `npm run start` dans `nafura-platform/sources/sandbox-web` et on voit un **catalogue** des artefacts.
2. Chaque **archétype d’écran** du canon V1 a une route démo (données mock, pas d’API).
3. Le canon est écrit (plan + wireframe + table dans Anatomy) : quoi utiliser quand — y compris **details → listing embarqué (1-N)** vs master-slave.

## Périmètre

### Inclus

- Mini-app Angular `nafura-platform/sources/sandbox-web/` qui consomme Anatomy via le même alias `@platform/...` que Sektor.
- Shell showroom : nav latérale (Archetypes | Building blocks), zone contenu, mode design optionnel plus tard.
- **Canon V1 des archétypes d’écran** (gel UX, pas forcément toutes les base classes neuves) :

| Archétype | Rôle | Démo V1 |
|-----------|------|---------|
| `nf-listing` | Collection racine | live (config-driven listing) |
| `nf-details` | Form create/edit/view | live |
| `nf-details-1n` | Details + listing(s) embarqué(s) | live (parent + children) |
| `nf-master-slave` | Split panes (entity-focus) | live ou réutiliser pattern existant |
| `nf-tree` | Hiérarchie (nav / tree-table) | live minimal (`nf-tree-table` ou editor) |
| wizard / settings / dashboard / documentWorkspace | déjà typés | entrée catalogue + stub ou démo légère |

- Catalogue building blocks : au minimum index + 1–2 sandboxes existants (ex. address) branchés.
- Données **in-memory** (facades mock) — zéro dépendance Mode B / Keycloak.
- Wireframe UX du shell + décisions 1-N vs master-slave.

### Exclus

- Auth réelle, multi-tenant, backend.
- Redesign pixel-perfect de tous les atoms.
- Nouveaux composants tree « page class » complets si un live sur `nf-tree-table` suffit pour V1.
- Migration des écrans Sektor.
- Remplacer Storybook (hors scope ; la showroom n’interdit pas des `.stories.ts` plus tard).

## Approche

### Décision d’hébergement (gelée ici)

`platform-web` est une **lib** (`package.json` : consommée par chemins tsconfig, pas servie seule).  
→ La showroom est une **mini-app dédiée** `sources/sandbox-web/`, pas des routes dans Sektor, pas un host fantôme dans la lib.

Storybook ≠ showroom : Storybook = lab composant ; showroom = **parcours d’écran** config-driven comme en prod.

### Taxonomie (à figer dans le wireframe + ce plan)

```text
nf-screen (chrome commun : shell, header, states, actions)
├─ nf-listing              collection racine
├─ nf-details              form / sections / modes
├─ nf-details-1n           details + listing(s) embarqué(s)   ← NOUVEAU nom canon
├─ nf-master-slave         split (entity-focus ; entity-collection = alias ou sous-type)
├─ nf-tree                 hiérarchie
├─ nf-wizard | nf-settings | nf-dashboard | nf-document-workspace
```

**Tranché pour V1 :**

- **details-1n** = page détail pleine largeur + zone(s) listing enfants (onglets ou sections). C’est le cas « details ⇒ listing inside details ».
- **master-slave entity-collection** reste le **split** parent | collection. Même intention métier 1-N, **densité / layout** différente — deux entrées catalogue, une note de when-to-use.
- **tree** = archétype page à part (pas un viewMode de listing).

`UxPatternType` devra intégrer `'details1n' | 'tree'` dans une Task Code (alignement types + doc), sans casser les consumers existants.

### Découpage d’exécution

1. Spec : plan + wireframe + freeze taxonomie (cette Task).
2. Code : scaffold `sandbox-web` (Angular serve, alias platform, shell + routing catalogue).
3. Code : demos live listing + details (mock facades).
4. Code : demos details-1n + master-slave + tree ; stubs catalogue pour le reste.
5. Code : aligner `UxPatternType` + courte doc Anatomy pointant la showroom.

### Risques

- Alias / styles Tomic partagés : reprendre le pattern Sektor (`tsconfig` paths + styles globaux) pour éviter un second design system.
- Ne pas dupliquer les organisms — la showroom **importe** Anatomy, elle ne fork pas.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | PLT-136 Cadrer showroom + canon archétypes | spec | — |
| 2 | PLT-137 Scaffold mini-app sandbox-web + shell catalogue | exec | PLT-136 |
| 3 | PLT-138 Demos live nf-listing + nf-details (mocks) | exec | PLT-137 |
| 4 | PLT-139 Demos nf-details-1n + master-slave + tree + stubs | exec | PLT-137 |
| 5 | PLT-140 Aligner UxPatternType + lien doc Anatomy → showroom | exec | PLT-136, PLT-139 |

## Validation technique

- `cd nafura-platform/sources/sandbox-web && npm run start` → HTTP 200 sur le port choisi (ex. 4300).
- Navigation manuelle : Accueil catalogue → Listing → Details → Details-1N → Tree → Master-slave ; chaque route rend sans erreur console bloquante.
- Aucun appel réseau métier requis (Network : pas d’API 8082 obligatoire).
- `node raster/t.mjs check` vert sur les Tasks de ce sous-lot (hors dette Sektor préexistante si encore présente).

## Blocages extérieurs

Aucun pour V1 (mocks). Si le scaffold Angular du monorepo exige un template non documenté : noter dans le rapport Code le chemin exact copié (Sektor ou autre).
