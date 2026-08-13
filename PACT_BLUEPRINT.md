# Blueprint — Pact

**Statut :** figé (2026-08-13)  
**Pact** = comment on **spécifie et change** un logiciel. Vit **seul**. Raster peut s’y brancher : [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md).  
Spec longue : [`FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md`](FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md).

---

## Lexique figé

```text
App → Socle + BC + BC → Change (CH)
```

| Terme | Frontière |
|-------|-----------|
| **App** | Produit déployable. Sa SPEC = carte (socle + BCs), hors-scope. |
| **Socle** | Contexte **transverse** (nav, auth, dashboard, admin, erreurs). Même forme qu’un BC : **SPEC + canvas**. |
| **BC** | Business / functional context. **SPEC.md** + **canvas UX**. |
| **Change (CH)** | `INIT` \| `EVOL` \| `CORRECTION` \| `TECHNICAL`. **Un seul nom** — pas « feature ». |
| **SPEC** | Contrat courant. Un fichier par app, par socle, par BC. |
| **Canvas** | Flux UX (états). Hors contrat ; la SPEC **pointe** vers lui. |

**SPEC = être · Change = devenir · Canvas = flux.**  
Git = historique. Pas de n° de version dans la SPEC.

**Hors Pact :** un *module* (Gradle, package) est du **code**. Ce n’est pas un BC, pas un change.

Dossier : **`<projet>/pact/`** — seulement si **app ou site**.  
Ce projet a aussi **`ops/`** — [`OPS_BLUEPRINT.md`](OPS_BLUEPRINT.md).

---

## Règle BC

Un BC **existe** ssi il **répond à un besoin** et **apporte de la valeur sans dépendre d’un autre BC** — **seul le socle est permis**.

- Oui → **BC** (sa `SPEC.md`, listé sur la SPEC app).
- Non → **change** de ce BC-là, pas un nouveau BC.

Pas de BC imbriqué. Si Origination répond à un besoin **sans** Lending → **BC** pair.

Socle et BC : **même forme**. Seul le contenu de la SPEC change.

---

## Rôles et permissions

**Rôles = par app** (cross-BC). Un utilisateur est *Conducteur* pour le tenant Sektor, pas « conducteur-chantier » vs « conducteur-RH ».  
**Actions = par BC** (le verbe porte sur une ressource de ce BC).  
**Matrice allow/deny = SSOT dans le socle** de l’app.

| | Où | Contenu |
|--|-----|---------|
| **Mécanisme** | Socle (`PLATFORM_CONSUMED` Identity / Authorization) | Login, tenant, deny-by-default, moteur de check, audit |
| **Catalogue rôles** | **Socle de l’app** | Liste des rôles de **cette** app (`conducteur`, `estimeur`, `admin-tenant`, …) |
| **Matrice canonique** | **Socle de l’app** | Chaque **action** : qui **doit pouvoir** / qui **ne doit pas**. IDs stables (`P-CHANTIER-VALIDATE-POINTAGE`) |
| **Règle métier** | **BC** | Invariants / transitions qui *s’appuient* sur ces IDs — pas un 2ᵉ catalogue de rôles |

Le socle **n’invente pas** le métier (pas de roman pointage). Il **indexe** : `action → BC → allow[] / deny[]`.  
Le BC **n’implémente pas** Keycloak et **ne redéfinit pas** les rôles ; il écrit « la transition `brouillon → validé` exige `P-…` ».

Platform : users + moteur. Les noms `conducteur` / `P-CHANTIER-…` sont du Pact **Sektor / socle**, pas du BC Identity platform.

Conflit matrice socle ↔ phrase BC → **matrice socle**. Le BC se met à jour (EVOL des deux si l’action change).

**Pourquoi la matrice est dans le socle :** un **worker de jeux** (par projet Pact, **à raffiner**) doit pouvoir, sans lire tous les BC : créer un user **par rôle**, puis des données de scénario. Il lit le catalogue rôles + la matrice. Le worker vit **dans le projet** (Sektor seed Sektor), pas un dump métier dans platform.

---

## BC vs lib

**Pas de type Pact « lib ».** Une lib (Maven, npm) est une **forme de livraison**, comme une API.

Même règle BC : si ça répond à un besoin **tout seul** (socle ok) → **BC** de **l’app qui le possède**.

| Où | Auth / extraction | Lib `client-identity` / `doc-extractor` |
|----|-------------------|----------------------------------------|
| **nafura-platform** | **BC** Identity, **BC** Documents | packages **publiés par** ces BC |
| **sektor** | capacités **consommées** dans le **socle** (`PLATFORM_CONSUMED`) | deps versionnées — **pas** des BC Sektor |

```text
nafura-platform/pact/
├── socle/
├── identity/          # BC — SPEC + canvas + changes
└── documents/         # BC extraction
    └── (livraison : API + contracts-* + client-*)
```

Utilitaire trop petit pour valoir tout seul (dates, logger) → **module** dans le socle ou un BC existant. **Pas** un BC.

### Stockage docs, notifs, … — partagés

**Aujourd’hui :** une lib in-process dans l’app **pointe sur l’infra** (MinIO, SMTP / Brevo).  
**Cible :** l’app **ne connaît plus l’infra**. Elle consomme le **BC platform** ; c’est ce BC qui parle à l’infra.

```text
AUJOURD’HUI     Sektor lib  ──────────────►  MinIO / SMTP
CIBLE           Sektor client-*  ►  BC platform  ►  MinIO / SMTP
```

| Couche | Où | Ex. docs / notifs |
|--------|-----|-------------------|
| **Infra** | `nafura-platform/ops/` | MinIO, provider mail — **partagé** |
| **BC** | `nafura-platform/pact/` | Documents, Notifications — **partagé** |
| **Conso** | socle de l’app | `PLATFORM_CONSUMED` + `client-*` / API |

Sektor n’a pas de BC « stockage ». Pas de bucket MinIO dans `sektor/ops/` « pour plus tard ».  
Changer MinIO → S3 = change **ops + BC platform**, pas un EVOL Sektor (sauf si le **contrat** client change).

---

## Une app

```text
<projet>/pact/
├── SPEC.md              carte : socle + BCs
├── socle/               transverse — SPEC + canvas + changes
└── <bc>/
    ├── SPEC.md
    ├── ux/*.canvas.tsx
    └── CH-00-INIT-…/
```

Surfaces back / front / mobile = **la même app**.  
Dashboard / nav / admin = **owns du socle**.  
Pilotage / analytics = **vues**, pas un BC.  
Nav : 1 entrée top-level ≈ 1 BC. Sous-menus = écrans du **même** BC.

Ajouter un BC : `EVOL` de la SPEC app, puis `INIT` du BC.

### Congés

```text
App conges
├── socle
└── BC leave
    ├── CH-00-INIT-demandes
    └── CH-01-EVOL-justificatif
```

### CBS

```text
App cbs
├── socle
├── BC customer
├── BC accounts
│   └── CH-01-EVOL-comptes-joints
├── BC lending                       # seulement si valeur sans les autres
└── BC payments
```

---

## Types de Change

| Type | SPEC | Code | C’est quoi |
|------|------|------|------------|
| `INIT` | **crée** `SPEC.md` | souvent oui | première vérité |
| `EVOL` | **patch** **toujours** | oui | le contrat change |
| `CORRECTION` | **non** | oui | le code rattrape une SPEC déjà juste |
| `TECHNICAL` | **non** | oui | refonte / perf / stack — **même** comportement |

Oubli de règle = **`EVOL`**. Bug qui change une règle = **`EVOL`**.  
Bug d’écart code ↔ SPEC = **`CORRECTION`**.  
Rename / extraire un service / migrer Angular, sans changer une règle = **`TECHNICAL`**.  
Refonte qui change un invariant → **`EVOL`**.

**`INIT` et `EVOL` :** sans ces preuves le Change **ne se clôt pas** :

1. **SPEC** patchée (`INIT` : créée).
2. **Canvas** à jour, ou AC UX = *inchangé*.
3. **E2E** dans `<projet>/e2e/` (**par projet**, pas par BC) : scénario **ajouté ou modifié** — l’ancienne vérité échoue, la nouvelle passe. (Parcours UI **ou** API.) Rangement interne `e2e/<bc>/` = optionnel.

Pas de type CH `TEST`. L’e2e est une **task Raster** sous **le même** CH, pas un Change.

`CORRECTION` : pas de patch SPEC ; e2e de **repro** puis vert.  
`TECHNICAL` : pas de patch SPEC ; suite e2e **existante** verte, pas de scénario métier nouveau.

Exception e2e : EVOL **carte app** (ajouter un BC) — pas encore de parcours ; l’e2e vient avec l’`INIT` du BC.

**Agent EVOL :** s’il ne touche que le code, ce n’est pas un EVOL. S’il change une règle en « corrigeant un bug » → basculer en EVOL.

(Plus tard : `COMPLIANCE`, `RETIREMENT`.)

---

## Backend / frontend / mobile

**Aucune différence Pact.** Ce sont des **surfaces** du **même** Change, pas des BC, pas des CH, pas des SPEC.

Un EVOL « justificatif » peut modifier API + écran + e2e dans **une** exécution. Découper BE/FE en deux CH (ou deux BC) est interdit.

Pact parle : app · socle · BC · change.  
`module` Gradle / Angular = code, hors Pact.

---

## Ce que raconte la SPEC

Un fichier. Pas un dossier de chapitres.

1. Intention  
2. Ce que ça fait  
3. Limites (`owns` / `not_owns`)  
4. Intervenants  
5. Données (objets, id, obligations)  
6. États (transitions autorisées)  
7. Règles (`INV-n`, `R-n`) — validateurs inclus  
8. Liens (`publie` / `consomme`)

**Pas dans la SPEC :** stack, SQL, tickets, sprint, historique CH, pixels, wireframes.  
Conflit canvas ↔ SPEC → **SPEC**.

---

## Brancher Raster (optionnel)

Pact n’a pas besoin de Raster. Si Raster se branche : voir [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md) — projection lot ← socle\|BC, sous-lot ← change, task ← work.
