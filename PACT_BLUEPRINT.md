# Blueprint — Pact

**Statut :** figé (2026-08-13)  
**Pact** = comment on **spécifie et change** un logiciel. Vit **seul**. Raster peut s’y brancher : [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md).  
Code (packages, APIs, dépendances) : [`ARCHI_BLUEPRINT.md`](ARCHI_BLUEPRINT.md).  
Spec longue : [`FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md`](FRAMEWORK_DEVELOPPEMENT_AGENTIQUE_SPEC_DRIVEN_V1.md).

---

## Lexique figé

```text
App (CADRE) → Socle + BC + BC → Change (CH)
```

| Terme | Frontière |
|-------|-----------|
| **App** | Produit déployable. Sa frontière = son **CADRE**. |
| **CADRE** | Frontière de l'app. **Un fichier, une page**, lisible métier · IT · QA. Pas un contrat de comportement. |
| **Socle** | Contexte **transverse** (nav, auth, dashboard, admin, erreurs). Même forme qu’un BC : **SPEC + canvas**. |
| **BC** | Business / functional context. **SPEC.md** + **canvas UX**. |
| **Change (CH)** | `INIT` \| `EVOL` \| `CORRECTION` \| `TECHNICAL`. **Un seul nom** — pas « feature ». Fichier `CH.md`, **gelé** à la clôture. |
| **SPEC** | Contrat courant. Un fichier par socle, par BC. **Pas** au niveau app — l’app a un CADRE. |
| **Canvas** | Flux UX (états). Hors contrat ; la SPEC **pointe** vers lui. |

**CADRE = délimiter · SPEC = être · Change = devenir · Canvas = flux.**  
Git = historique. Pas de n° de version dans la SPEC.

**Hors Pact :** un *module* (Gradle, package) est du **code**. Ce n’est pas un BC, pas un change. Forme du code : [`ARCHI_BLUEPRINT.md`](ARCHI_BLUEPRINT.md).

Dossier : **`<projet>/pact/`** — seulement si **app ou site**.  
Ce projet a aussi **`ops/`** — [`OPS_BLUEPRINT.md`](OPS_BLUEPRINT.md).

---

## Le CADRE

**Premier document d’une app.** Il existe **avant** tout BC et avant le socle. Il délimite ; il ne décrit ni règles métier, ni objets, ni états.

Fichier : **`<projet>/pact/CADRE.md`** — un seul par app.  
Public : **métier · IT · QA**, lisible par les trois **par construction** (zéro technique, zéro détail métier fin).  
Taille : **une page**. Non négociable — c’est ce qui garantit qu’il est lu, donc qu’il sert.

### 6 sections écrites

| # | Section | Contenu | Débloque |
|---|---------|---------|----------|
| 1 | **Intention** | 3–5 lignes : quel besoin, pour qui | La référence de tous les arbitrages |
| 2 | **Périmètre** | `owns` / `not_owns` — chaque exclusion **nomme qui s’en charge** | La règle BC |
| 3 | **Acteurs** | Qui utilise l’app, une ligne chacun (**≠ rôles**) | Catalogue rôles du socle · personae des canvas |
| 4 | **Voisins** | Apps / plateformes consommées ou servies. « Aucun » se **déclare** | Les `PLATFORM_CONSUMED` du socle |
| 5 | **Contraintes** | Uniquement ce qui s’impose à **tous** les BC. Langage métier, **opposable** | Le socle, qui les tient |
| 6 | **Vocabulaire** | 10–15 termes du produit, une ligne chacun | Les noms dans SPEC · code · tests · canvas |

### 1 section générée

**Carte** — socle + BCs, une ligne par BC tirée de son `Intention`. **Jamais écrite à la main**, entre marqueurs de génération dans `CADRE.md`. Vide au jour 0.

### Interdits

Règles métier · objets et données · stack, archi, choix techniques · liste des BC écrite à la main · roadmap, phases, budget · maquettes et personae détaillés.

### Règles

- **`not_owns` ≥ 1 ligne.** Si tu n’exclus rien, tu n’as pas pensé la frontière — tu as décrit une envie.
- **Contrainte opposable.** On doit pouvoir la contredire. « Performant » n’en est pas une.
- **CADRE > socle.** Le CADRE dit *quoi*, le socle dit *comment*. Conflit → CADRE.
- **Jamais `done`.** Vivant, comme un BC. Seuls ses changes se clôturent.
- Gouverné par des Changes : `CH-00-INIT-cadre`, puis `EVOL` **quand la frontière bouge** — pas à chaque BC ajouté.

### Clôture du `CH-00-INIT-cadre`

Test : **un agent qui lit le CADRE seul peut répondre « ce besoin appartient-il à cette app ? »**  
Lecture : un QA qui arrive sait en **10 minutes** ce que le produit fait, ne fait pas, et avec quels mots on en parle.  
Preuve : **revue humaine**.

---

## Règle BC

Un BC **existe** ssi il **répond à un besoin** et **apporte de la valeur sans dépendre d’un autre BC** — **seul le socle est permis**.

- Oui → **BC** (sa `SPEC.md`, listé sur la **carte** du CADRE).
- Non → **change** de ce BC-là, pas un nouveau BC.

Pas de BC imbriqué. Si Origination répond à un besoin **sans** Lending → **BC** pair.

Socle et BC : **même nature** — un contrat courant, un fichier, patché par `EVOL`. Mais **sections différentes** : voir § [Le socle](#le-socle).

---

## Le socle

Contexte **transverse** de l’app. Il existe dès le jour 0, mais sa SPEC ne s’initialise que quand le **premier BC tire dessus** : le BC déclare ce qu’il consomme, le socle répond.

**Règle anti-obésité :** toute capacité du socle **nomme au moins un BC consommateur**. Aucune capacité « pour plus tard ». C’est la symétrique du `not_owns` du CADRE — sans elle, le socle devient le dépotoir du transverse.

### Un BC a besoin du socle

Un change cible **une seule** cible. Donc :

| Le BC… | Change socle ? |
|--------|----------------|
| **consomme** une capacité **déjà là** (auth, erreurs, audit) | **Aucun.** Simple déclaration dans sa SPEC — `Liens: consomme` |
| fait **acquérir** au socle une capacité **nouvelle** (1ᵉʳ besoin de notifications) | **`EVOL` socle** séparé, **puis** le change du BC |

Consommer l’existant n’est pas un changement du socle, c’est s’y brancher. Le double change ne se déclenche donc que pour une capacité transverse **réellement neuve** — rare, au lieu de systématique à chaque BC.

**Ordre imposé : le socle bouge d’abord, le BC ensuite.** Jamais l’inverse.

(Dépendances entre changes et parallélisme : **à traiter**.)

### Ce que raconte la SPEC socle

**Même nature** qu’une SPEC de BC — **sections différentes**. Un BC raconte des objets qui transitionnent ; le socle n’a ni objets ni transitions. Forcer les sections d’un BC sur un socle donne des sections vides, donc du remplissage inventé.

| # | Section |
|---|---------|
| 1 | **Intention** |
| 2 | **Capacités** — nom · mode (`LOCAL` \| `PLATFORM_CONSUMED` \| `EXTERNAL_MANAGED`) · **BC consommateurs** |
| 3 | **Contrats de consommation** — comment un BC s’y branche |
| 4 | **Politiques imposées** — ce que tout BC **doit** respecter |
| 5 | **Catalogue de rôles** — § Rôles et permissions |
| 6 | **Matrice** `action → BC → allow[] / deny[]` — § Rôles et permissions |
| 7 | **Liens** (`publie` / `consomme` vers la plateforme) |

La colonne **BC consommateurs** de la section 2 porte la règle anti-obésité : une capacité sans consommateur est une capacité à supprimer.

### Politiques

Ce qui rend le socle différent d’un BC : il ne rend pas que des services, il **contraint** les autres.

- **ID stable** — `POL-AUDIT-MUTATION`, `POL-ERREUR-FORMAT`, `POL-LOG-NO-PII`. Même discipline que les `P-*` de la matrice.
- **Le BC référence, il ne recopie jamais.** Sa SPEC écrit « soumis à `POL-AUDIT-MUTATION` », pas le texte. Une politique recopiée divergera — même raison que les AC.
- **Le CH liste les `POL-*` applicables** à sa cible. Elles descendent dans le contexte de l’agent d’exécution : il ne les découvre pas, on les lui **donne**.
- **Conflit politique ↔ règle BC → la politique.** Le BC se met à jour.
- **Exception : déclarée ou inexistante.** Une exception vit dans la **SPEC socle**, BC **nommé** + **raison**. Jamais implicite — sinon elle se prendra dans le code, en silence.

**Preuve d’une politique.** Une politique est transverse : un parcours métier ne la prouve pas, il prouve **un cas**. Sa preuve est un **test qui échoue sur un BC qui la viole** — inventaire transverse (« aucun endpoint de mutation n’écrit sans trace »), pas un scénario. Il vit dans `<projet>/e2e/` mais n’appartient à **aucun BC** : le socle porte ses propres preuves.

Un `EVOL` socle qui ajoute une politique **livre le test qui la garde**. Sans lui, la politique est une phrase — donc une règle de niveau *agent*, le plus faible, alors que c’est ce qu’il y a de plus contraignant dans le framework.

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

**Pourquoi la matrice est dans le socle :** un **worker de jeux** (par projet Pact — § [Jeux de données](#jeux-de-données)) doit pouvoir, sans lire tous les BC : créer un user **par rôle**, puis des données de scénario. Il lit le catalogue rôles + la matrice. Le worker vit **dans le projet** (Sektor seed Sektor), pas un dump métier dans platform.

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
├── CADRE.md             frontière de l'app (+ carte générée)
├── CH-00-INIT-cadre/    changes du CADRE
├── socle/               transverse — SPEC + canvas + changes
└── <bc>/
    ├── SPEC.md
    ├── ux/*.canvas.tsx
    └── CH-00-INIT-…/
```

Surfaces back / front / mobile = **la même app** — elles vivent sous `<projet>/sources/` ([`NAFURALABS.md`](NAFURALABS.md) § Intérieur). Un seul `backend/` par projet.
Dashboard / nav / admin = **owns du socle**.  
Pilotage / analytics = **vues**, pas un BC.  
Nav : 1 entrée top-level ≈ 1 BC. Sous-menus = écrans du **même** BC.

Ajouter un BC : **`INIT` du BC**, point — la carte du CADRE se régénère. `EVOL` du CADRE **seulement** si le nouveau BC déplace la frontière de l’app (périmètre, voisins, contraintes, vocabulaire).

Ordre au jour 0 : **`INIT` CADRE → `INIT` 1ᵉʳ BC → `INIT` socle**. Le socle existe dès le départ mais sa SPEC ne s’initialise que quand un BC **tire** dessus : le BC déclare ce qu’il consomme, le socle répond.

Exemple déroulé de bout en bout : § [Exemple complet — `conges`](#exemple-complet--conges).

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

## Se brancher — **pacter** et **raster**

Deux branchements séparés, deux verbes.

| Verbe | Ce que c'est | Prérequis | Produit |
|-------|--------------|-----------|---------|
| **raster** un projet | lui donner un endroit où le **travail** vit | aucun — même non logiciel | `raster-src/lots/…` |
| **pacter** un projet | lui donner un **CADRE** et les SPEC de ses contextes | c'est une **app ou un site** | `pact/CADRE.md` · `pact/<ctx>/SPEC.md` |

> **On raster d'abord, on pacte ensuite.** Pacter est du **travail** — et tout travail vit dans une task. Le lot `cadre` et sa task existent donc **avant** le `CADRE.md` qu'ils produisent.

### Les trois cas

| On se branche sur… | D'où vient la vérité | Ce qu'on prouve | Premiers CH |
|--------------------|----------------------|-----------------|-------------|
| **une app neuve** | **de toi** | rien encore | `EVOL` depuis ∅ |
| **une app en place** | **du code** — lu, puis prouvé | la **baseline** (`spec` + `tech` + `qa`) | `EVOL` — jamais `CORRECTION` au début |
| **une migration** | **de l'ancien système** | la **parité** : l'e2e ne bouge pas | `TECHNICAL` par tranche |

Le cycle est **identique** dans les trois cas. Seule change l'origine de la vérité.

**Migration :** une migration est un `TECHNICAL` — même comportement, implémentation neuve — et sa preuve est déjà la bonne : *suite e2e existante verte*. D'où la conséquence dure : **on ne migre pas ce qu'on ne sait pas prouver.** La baseline est le prérequis d'une migration, pas une option. Et « ce qui est déjà migré » vit dans **Raster**, jamais dans la SPEC — sinon c'est du futur.

### Ordre de branchement

```text
1. raster le projet                    le lot `cadre` + sa task spec
2. plateforme consommée d'abord        son CADRE + ses SPEC
3. CADRE de l'app                      ← le moment qui décide du découpage
4. par BC touché : SPEC → tech (e2e) → qa
5. premiers CH                         TECHNICAL si le code bouge sans le métier
                                       EVOL si une règle change
```

L'étape 2 précède l'étape 3 : le socle de l'app déclare des `PLATFORM_CONSUMED` qui pointent sur les BC de la plateforme.

**Piège de l'étape 4 :** ne pas faire « toutes les SPEC » puis « toutes les QA ». C'est un waterfall, il meurt au troisième BC. Le pack est **par BC** : SPEC → e2e → verdict, puis le suivant. Un BC non touché reste **non spécifié** dans la carte — un fait, pas une dette.

**Faire un seul BC de bout en bout d'abord** — celui sur lequel on allait travailler de toute façon. On sait en une semaine si ça tient, au lieu de le découvrir en six mois.

---

## Projet déjà développé — la baseline

On écrit **le CADRE + la SPEC de chaque BC**. Rien d'autre.

**Pas de CH rétroactifs** : ils n'ont gouverné personne, ce serait de la fiction — et Git porte déjà l'histoire.
**Raster part du vide** : le backlog contient ce qu'on va faire, pas ce qu'on a fait.

### Une baseline se prouve

Une SPEC écrite **en lisant le code** est une hypothèse, pas une vérité : rien n'a été exécuté.

> **Une baseline n'est pas vraie parce qu'elle est écrite. Elle est vraie quand elle est prouvée.**

```text
CH-00-INIT-<bc>/          pack de baseline
├── spec    écrire la SPEC depuis le code observé
├── tech    écrire les e2e qui assertent ses règles     ← aucun comportement changé
└── qa      les exécuter · verdict · trous              ← obligatoire
```

Pas de task `feature` : on ne construit rien. C'est bien un `tech` — écrire des tests sur du code existant ne change aucun comportement.

**La règle de discrimination ne s'applique pas** (pas de version d'avant, pas de comportement changé). Son substitut, plus faible et manuel : **le test doit avoir été vu rouge** avant d'être vert. Un test de baseline écrit directement vert peut asserter du vide.

### Ce que la QA d'une baseline révèle

| Divergence | Ce que c'est | Quoi faire |
|------------|--------------|-----------|
| Le test échoue, la SPEC avait mal deviné | erreur de lecture | **corriger la SPEC** — on établit la baseline, ce n’est pas un `EVOL` |
| Le test échoue, le code est incohérent avec lui-même | **une trouvaille** | un Change, qualifié normalement |

C’est le **seul** moment où patcher la SPEC pour coller au code est légitime : on l’établit, on ne la fait pas évoluer.

### Après la baseline : tout est `EVOL`

Une SPEC écrite depuis le code est d’accord avec le code **par construction**. Donc juste après :

> **`CORRECTION` est impossible.** Un comportement que tu juges mauvais est *décrit*, donc conforme. Le changer change le contrat → `EVOL`.

`CORRECTION` ne redevient possible qu’après les premiers `EVOL`, quand la SPEC dit enfin quelque chose que le code ne fait pas. Sans cette règle, les agents qualifient tout en `CORRECTION` — c’est plus rapide, ça évite de patcher la SPEC.

### Baseline progressive

**CADRE d’abord** — une page, et il décide du découpage. Puis la SPEC **et ses preuves** d’un BC **au moment où tu le touches**.

Un BC qu’on ne touche pas n’a pas besoin que sa vérité soit écrite : la carte le liste **non spécifié**, ce qui est un fait, pas un futur.

---

## Types de Change

**Trois types.** `INIT` n’en est pas un.

| Type | SPEC | Code | C’est quoi |
|------|------|------|------------|
| `EVOL` | **patch toujours** (crée si absente) | oui | le contrat change |
| `CORRECTION` | **non** | oui | le code rattrape une SPEC déjà juste |
| `TECHNICAL` | **non** | oui | refonte / perf / stack — **même** comportement |

**`INIT` = une forme, pas un type.** C’est l’étiquette du premier change d’une cible (`CH-00-INIT-…`) : lisible d’un coup d’œil, mais **aucun comportement propre** — c’est un `EVOL` depuis l’état vide. Tout ce qui le distinguait est **dérivable** : la SPEC existe ou non, la cible a des e2e ou non. Raster n’en sait rien : un sous-lot comme les autres.

Oubli de règle = **`EVOL`**. Bug qui change une règle = **`EVOL`**.  
Bug d’écart code ↔ SPEC = **`CORRECTION`**.  
Rename / extraire un service / migrer Angular, sans changer une règle = **`TECHNICAL`**.  
Refonte qui change un invariant → **`EVOL`**.

**`EVOL` :** sans ces preuves le Change **ne se clôt pas** :

1. **SPEC** patchée (`INIT` : créée).
2. **Canvas** à jour, ou AC UX = *inchangé*.
3. **E2E** dans `<projet>/e2e/` (**par projet**, pas par BC) : scénario **ajouté ou modifié** — l’ancienne vérité échoue, la nouvelle passe. (Parcours UI **ou** API.) Rangement interne `e2e/<bc>/` = optionnel.

Pas de type CH `TEST`. L’e2e est une **task Raster** sous **le même** CH, pas un Change. Qui fait quoi : § [Preuves — qui fait quoi](#preuves--qui-fait-quoi).

**Règle de discrimination.** L’e2e doit **échouer sur la version d’avant** : l’exec fournit la preuve que son test échoue **sans** son changement. Un test complaisant — qui passe quoi qu’il arrive — est attrapé là, **mécaniquement**. On ne compte pas sur l’honnêteté de l’exec, on constate.

`CORRECTION` : pas de patch SPEC ; e2e de **repro** puis vert.  
`TECHNICAL` : pas de patch SPEC ; suite e2e **existante** verte, pas de scénario métier nouveau.

**CADRE :** `EVOL` seulement (pas de code → ni `CORRECTION`, ni `TECHNICAL`). Preuve = **revue humaine**, jamais d’e2e : il n’y a pas de parcours à prouver sur une frontière. Ajouter un BC ne touche pas le CADRE (carte générée) — l’e2e vient avec l’`INIT` du BC.

**Agent EVOL :** s’il ne touche que le code, ce n’est pas un EVOL. S’il change une règle en « corrigeant un bug » → basculer en EVOL.

(Plus tard : `COMPLIANCE`, `RETIREMENT`.)

### Qualifier — avant le CH

Le nom du dossier porte le type. Or le type est le **résultat** de la qualification : on ne peut donc pas la faire *sous* le CH.

Elle a lieu au **promote** : l’agent spec lit la SPEC de la cible et tranche.

```text
inbox : « un non-manager arrive à valider »
   └─ l'agent spec lit SPEC leave
      ├─ R-1 existe → l'observé est faux CONTRE la SPEC  → CORRECTION
      └─ SPEC muette                                      → EVOL
   └─ crée le CH (des deux côtés) + la task spec
```

`CH.md` porte le type **et une ligne de justification** — « `CORRECTION` : `R-1` couvre déjà le cas ». Une ligne, relisible, contestable. Qualification **disputée** → question bloquante, le CH ne passe pas approuvé.

Requalification après coup (une `CORRECTION` qui était un `EVOL`) → **on renomme le dossier**. Rare, visible dans Git, sain.

### Déclarer et résoudre un bug

```text
DÉCLARATION
  toi · un utilisateur · un agent · le QA constate un écart
    └─ une LIGNE D'INBOX. Jamais un ticket directement.

QUALIFICATION                      (spec, au promote, en lisant la SPEC)
    ├─ la SPEC couvre le cas, le code fait autre chose  → CORRECTION
    ├─ la SPEC est muette                               → EVOL
    └─ juste après une baseline                         → toujours EVOL

RÉSOLUTION                         CH-nn-CORRECTION-<slug>
    exec   e2e de repro ROUGE → corrige → VERT → `review`
    QA     exécute, verdict → `done-agent`
    toi    `done-me`
```

Le `CH.md` d’une `CORRECTION` fait cinq lignes : **observé · attendu · repro · critère · preuve**. Pas de patch SPEC — elle avait déjà raison.

La **règle de discrimination** tombe juste d’elle-même ici : le test de repro doit être **rouge avant** le correctif. C’est ce qui distingue une vraie correction d’un test écrit après coup pour valider ce qu’on vient de faire.

### Numérotation

`CH-NN-TYPE-slug`, deux chiffres, à partir de `00`. **Par cible, pas par app** : `leave` a son `CH-00`, le socle le sien, le cadre aussi.

- `CH-00` = naissance de **cette** cible, lisible d’un coup d’œil
- deux agents sur deux BC différents ne se disputent pas le prochain numéro
- **immuables** : jamais renumérotés, jamais réutilisés. Un CH annulé garde son trou

Au-delà de `CH-99` : ce n’est pas un problème de format, c’est le **capteur de découpage** qui sonne.

**Le sous-lot Raster porte le nom du CH, à l’identique** — `leave/CH-01-EVOL-justificatif` des deux côtés. Lien le moins cher possible, et **checkable** : tout CH a son sous-lot, tout sous-lot a son CH. Le chemin Pact se déduit du chemin Raster (`raster-src/lots/` → `pact/`) : aucun champ à écrire, donc aucun lien qui pourrit.

---

## SPEC · CH · AC

Deux fichiers, **deux durées de vie**. Ne pas les fusionner.

| Fichier | Vie | Répond à |
|---------|-----|----------|
| **`SPEC.md`** | réécrit en permanence | « qu’est-ce qui est vrai **maintenant** ? » |
| **`CH.md`** | **gelé** une fois clos | « pourquoi c’est devenu vrai, et qu’a-t-on promis de **prouver** ? » |

Fusionner = perdre l’une des deux : soit la SPEC devient un journal qui grossit sans fin, soit la motivation, la traçabilité et les **AC** disparaissent.

**AC gelés.** Les AC d’un Change sont figés **à l’approbation**. L’étape 3 du cycle patche SPEC + canvas — **jamais les AC du Change en cours**. Sans cette règle, le QA vérifie le livré contre une description écrite **après** le livré : contrôle circulaire, agent QA sans fonction. Les AC ne sont un ancrage que parce qu’ils vivent dans un fichier **séparé et gelé**.

**Source unique.** Les AC vivent dans `CH.md` (`AC-1`, `AC-2`, …). Une task Raster les **référence** ; sa checklist = des **étapes de travail**, pas des critères. Un AC recopié est un AC qui divergera.

**CH mince.** Le CH ne pèse que ce que le change pèse. Une `CORRECTION` = 5 lignes : observé · attendu · repro · AC · preuve.

**Éphémère ≠ durable.** Le découpage en tasks et l’approche technique ne sont **pas** du Pact : ils vivent dans le `00-PLAN.md` du CH côté Raster, et sont archivés avec lui. Test : *si une ligne est encore vraie dans deux ans, elle appartient à la SPEC ou au CH, pas au PLAN.*

---

## Agents du Change

Quatre agents — **pas** des rôles métier (`conducteur`, …), **pas** un BC — **et un humain**.

| Agent | Droit | Interdit |
|-------|--------|----------|
| **Orchestrateur** (Raster) | Enchaîner les mains spec → exec → spec (consolidation) → QA | code, SPEC, verdict QA, poser `done-agent` sur feature/bug |
| **Spec** | qualifier · SPEC + canvas + CH + découpe ; **après exec** : **constat d’écart** | code produit |
| **Exécution** | code + preuves **écrites** (e2e inclus) ; status **`review`** quand fini | inventer une règle ; poser `done-agent` sur feature/bug |
| **QA** | vérifier les AC (`type: qa`) ; **lui seul** pose `done-agent` sur feature/bug (+ task qa) | implémenter ; patcher la SPEC ; réécrire un e2e |
| **Humain** (toi) | valider le **CADRE** ; trancher les **questions bloquantes** ; **interrompre** par l’inbox ; poser `done-me` | — |

L’humain n’est pas un agent, mais c’est un **acteur**. En **mode autonome** (§ Orchestration) il n’intervient qu’à ces quatre endroits — pas à chaque main.

**Cycle (orchestrateur)** — **un** sous-lot Pact (CH) à la fois ; feature / bug :

```text
spec → exec → spec (MAJ SPEC+UX) → qa (MAJ ou créer type:qa) → done-agent
```

1. **Spec** — contrat initial (INIT/EVOL).
2. **Exec** — code + e2e écrits → status `review`.
3. **Spec** — **constat d’écart**, pas recopie du livré. Si le livré diverge : soit **dette** (retour exec, SPEC inchangée), soit **la SPEC avait tort** (patch **explicite**, décidé). **Jamais les AC.**
4. **QA** — **met à jour** la task `type: qa` si elle existe, sinon **la crée** (même sous-lot, `blocked_by:` = feature/bug), puis valide. **Lui seul** pose `done-agent` sur feature/bug et sur la task qa.

Échecs et blocages : § [Signaler ≠ bloquer](#signaler--bloquer).

`CORRECTION` : pas de spec initial ; exec → `review` → spec seulement si trou de contrat → QA (créer/MAJ).  
`TECHNICAL` / `physical` seul : pas de qa obligatoire ; exec peut aller `done-agent` (DoD `me`).

### Une règle arrive pendant un Change

> **La vérité visée est-elle déjà livrée ?**

| | |
|---|---|
| **Non** | on **modifie le CH en cours**. Pas d’`EVOL` : il n’y a pas d’ancienne vérité à faire échouer |
| **Oui** | **nouveau CH** |

Modifier un CH en cours n’est pas le muter en silence : la main **revient à la spec** — SPEC patchée, critères ajoutés et **re-gelés**, **approbation**, puis l’exec repart. L’exec ne découvre jamais une règle en cours de route ; il reçoit un contrat re-approuvé.

Chaque réouverture coûte une approbation humaine. C’est le frein : un CH rouvert trois fois est un **signal** que la cible bouge, pas un problème de process.

### Preuves — qui fait quoi

Un e2e, c’est **trois choses**. Les séparer évite le conflit d’intérêt sans ajouter d’agent.

| | Quoi | Qui |
|---|------|-----|
| **Scénario** | ce qu’il faut exercer, ce qu’il faut observer | **spec** — dérive des AC, vit dans le `CH.md` |
| **Code du test** | sélecteurs, fixtures, câblage | **exec** — c’est de l’implémentation |
| **Exécution + verdict** | il tourne, il prouve, il **discrimine** | **QA** |

L’exec **n’invente pas ce qui est testé**, il l’implémente. La garantie anti-complaisance ne vient pas de séparer les auteurs, mais de la **règle de discrimination** (§ Types de Change). Le QA ne réécrit jamais un test : il l’exécute, vérifie qu’il discrimine, et signale les **trous** — un critère sans test qui le couvre.

### Jeux de données

Trois besoins distincts. Pas de nouvel acteur : même découpage que l’e2e — **le spec dit quel état est requis, l’exec le fabrique.**

| Quoi | Qui | Où |
|------|-----|-----|
| **Un user par rôle** | le **worker de jeux** — il lit le catalogue de rôles + la matrice | **capacité du socle** ; `EVOL` socle quand le catalogue bouge |
| **État initial d’un scénario** (« un salarié avec 5 jours de solde ») | **spec** le **nomme** · **exec** l’**implémente** | `CH.md` + `e2e/` |
| **Jeu de démo / recette manuelle** | worker de jeux, version riche | `ops/` |

- **Une fixture e2e ne dépend jamais du jeu de démo.** Chaque scénario crée son état et le nettoie (ou vit dans son tenant). Sinon, enrichir le seed rend la suite rouge sans qu’une ligne de métier ait bougé — et on cesse d’y croire, ce qui est pire que de ne pas l’avoir.
- **L’état initial fait partie du critère, pas du test.** Les *5 jours* sont dans le `CH.md`. Si l’exec choisit les valeurs, il choisira celles qui passent.

Le worker de jeux est une **capacité du socle nommée**, donc soumise à la règle anti-obésité. Il se **dérive** du catalogue de rôles : ajouter un rôle sans regénérer les users est une incohérence **checkable**. Il vit **dans le projet** (Sektor seed Sektor), jamais en dump métier dans platform.

### Qui écrit où

| Agent | `pact/` | `raster-src/` | Ailleurs |
|-------|---------|---------------|----------|
| **spec** | CADRE · SPEC · CH · canvas | `00-PLAN.md` · les tasks | — |
| **exec** | **rien** | status + journal | code · `e2e/` |
| **QA** | **rien** | la task `qa` + statuts | — |
| **orch** | **rien** | **rien** | enchaîne les mains |

**Un seul agent écrit dans `pact/`.** C’est ce qui protège le contrat.

### Deux découpages

| | Quoi | Qui décide | Devient un ticket ? |
|---|---|---|---|
| **Livrable** | plusieurs **résultats** vérifiables séparément | **spec** | **oui** — tasks Raster |
| **Exécution** | les **étapes** pour produire **un** résultat | **exec** | **non** — plan interne, dans le journal de la task |

Critère de bascule (V1 §4.7) : une séparation ne devient une task que si chaque morceau a un **résultat autonome, vérifiable indépendamment**. Sinon c’est une étape.

Sans ça, le backlog se remplit de « créer le DTO », « ajouter la colonne » — et la vue Sprint devient illisible pour zéro information.

**`00-PLAN.md` obligatoire seulement si le CH a ≥ 2 tasks exec.** Une seule task = rien à ordonner ; le `CH.md` suffit.

**Pack par type de Change** — mapping **total**, sans trou :

| Change Pact | Pack Raster | `qa` ? |
|-------------|-------------|--------|
| `INIT` | `spec` + `feature` | **oui** |
| `EVOL` | `spec` + `feature` | **oui** |
| `CORRECTION` | `bug` | **oui** |
| `TECHNICAL` | **`tech`** | non — suite e2e **existante** verte suffit |

`tech` porte le refactor / la perf / la migration : ni `feature` (aucun comportement nouveau), ni `bug` (rien n’est cassé). `agent_type` suit sans exception : **`tech → exec`**.

**`physical` est hors de ce tableau** : travail **non logiciel** (appeler un fournisseur, signer, acheter, faire une démarche). Il n’a pas de Change Pact — c’est ce qui permet à Raster de vivre **seul**, en todo app.

**Pack Raster** (même sous-lot / CH) :

- `EVOL` : `type: spec` + exec. Task **`type: qa`** : créée par le spec **ou** par le QA à l’étape 4.
- `CORRECTION` : `bug` ; qa créée/MAJ à l’étape 4.
- Skills : `nafura-orch` · `nafura-spec` · `nafura-exec` · `nafura-qa`. Routing : [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md).

---

## Orchestration

### Déclencheurs

**L’orchestrateur est la porte, l’inbox est la mémoire.** Tu parles toujours à l’orchestrateur ; il **route**, il ne qualifie pas :

- ça correspond à une task existante → il lance la main
- c’est nouveau → **il l’écrit dans l’inbox et il s’arrête** (qualifier, c’est le spec, au promote)

| Déclencheur | Origine | Effet |
|-------------|---------|-------|
| **Toi qui parles** | humain | inbox, ou reprise d’une task |
| **Une main qui finit** | événement (`review` posé) | l’orchestrateur enchaîne |
| **Check progress** | rythme | toi, sur le sprint |

> **Rien ne s’exécute qui ne soit dans une task. Rien n’entre en task sans passer par le promote.**

Un prompt ne peut donc pas atterrir directement chez un exec.

### Le cycle et ses gates

| # | Étape | Acteur | Produit | Gate |
|---|-------|--------|---------|------|
| 1 | **Capture** | toi (via orch) | ligne d’inbox | — |
| 2 | **Promote + qualification** | spec | le CH (type + justification) + la task `spec` | — |
| 3 | **CADRE** *(1× par app)* | spec | `CADRE.md` | **me** |
| 4 | **Spec du CH** | spec | SPEC · canvas · `CH.md` (critères gelés · scénarios · `POL-*`) · découpe · `00-PLAN` si ≥ 2 | — |
| 5 | **Commit sprint** | orch | `sprint:` sur les tasks | — |
| 6 | **Exec** | exec | code · e2e qui **échoue sur la version d’avant** · journal → `review` | — |
| 7 | **Constat d’écart** | spec | dette (retour 6) **ou** patch SPEC explicite | — |
| 8 | **QA** | qa | preuves exécutées · verdict · trous · **rapport** → `done-agent` | — |
| 9 | **Revue finale** | **toi** | `done-me` | **me** |
| 10 | **Sweep** | auto | la task **sort du dépôt** — Git porte l’histoire | — |

**Mode autonome par défaut.** Le seul gate conservé en amont est le **CADRE** : une fois par app, dix minutes, et il décide de tout le découpage qui suit. Un CADRE écrit sans relecture produit une app plausible et fausse, qu’on ne découvre qu’au troisième BC.

### Signaler ≠ bloquer

Sans approbation à chaque main, il faut une autre soupape — sinon l’agent décide de tout en silence.

| | Quand | Effet |
|---|-------|-------|
| **Signaler** | décision prise seul | tracée dans le journal → tu la vois à la fin |
| **Bloquer** | **indécidable** | `blocked`, la main te revient |

Bloquer ne veut plus dire « j’attends ton feu vert » — ça veut dire « je ne peux pas trancher ». C’est la **seule** interruption légitime venant d’un agent.

Écart exec → `blocked`, retour au spec. Échec QA → `blocked` sur la task `qa` **et** la feature/bug revient à `doing`, retour à l’exec.

### Rapport de livraison — obligatoire

Tu ne valides plus **avant**, donc tu dois voir **après** ce qui a été décidé sans toi. Sans ce rapport, `done-me` est un blanc-seing.

```text
ce qui a changé      2 lignes — fichiers / écrans
critères prouvés     AC-n → preuve exécutée
décidé seul          les arbitrages pris sans toi     ← le plus important
écarts / dette       ce qui n'est pas fait
```

### Le passage de main

L’orchestrateur assemble un paquet **différent par main**, et il le **déduit du chemin de la task** — aucun champ à écrire.

| Main | Reçoit |
|------|--------|
| **spec — contrat** | la demande · `CADRE` (périmètre + vocabulaire) · SPEC de la cible · politiques et capacités du socle |
| **exec** | la task · `CH.md` (critères gelés · scénarios · `POL-*`) · SPEC de la cible · **seulement** les sections socle consommées · canvas si UI · **périmètre autorisé / interdit** |
| **spec — constat** | `CH.md` · les critères · **le diff livré** · la SPEC |
| **QA** | `CH.md` (critères gelés) · les preuves existantes · SPEC de la cible · de quoi **exécuter** |

**Le QA ne reçoit pas le diff.** S’il lit le code, il jugera « ça a l’air bon ». Il juge sur les **critères** et les **preuves exécutées** — c’est ce qui l’empêche de devenir un second exec complaisant.

**Jamais tendu :** le blueprint entier · les autres BC · les CH clos · le backlog · le code hors périmètre.

```text
raster-src/lots/leave/CH-01-EVOL-justificatif/tasks/CNG-9.md
                 └──┬─┘└──────────┬──────────┘
     pact/leave/SPEC.md    pact/leave/CH-01-…/CH.md
     pact/socle/SPEC.md    pact/CADRE.md
```

Un agent qui a touché un fichier **hors de son paquet** est détectable. Niveau *check*.

---

## Backend / frontend / mobile

**Aucune différence Pact.** Ce sont des **surfaces** du **même** Change, pas des BC, pas des CH, pas des SPEC.

Un EVOL « justificatif » peut modifier API + écran + e2e dans **une** exécution. Découper BE/FE en deux CH (ou deux BC) est interdit.

Pact parle : app · socle · BC · change.  
`module` Gradle / Angular = code, hors Pact.

---

## Ce que raconte la SPEC d’un BC

Un fichier. Pas un dossier de chapitres. (Socle → sections différentes, § [Le socle](#le-socle).)

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

**Pas de futur dans une SPEC.** Elle décrit ce qui est vrai **maintenant** — jamais ce qui est prévu. Pas de section « à venir », « pas encore », « prévu ». Le futur vit dans **Raster** (backlog, `ROADMAP.md`).

```text
Pact    = ce qui est vrai
Raster  = ce qui reste à faire
```

**Le code peut être en retard sur la SPEC. Jamais en avance.** La SPEC est en avance le temps d’un change — c’est court et c’est normal. Si le code fait ce que la SPEC ne dit pas, ce n’est pas une SPEC à rattraper : c’est un défaut, ou un `EVOL` non déclaré.

**La consolidation réécrit, elle n’empile pas.** Après un change, la SPEC se lit **comme si elle avait toujours été ainsi** : pas de « depuis CH-07 », pas de section « modifié le ». Git porte l’histoire. Sans cette règle, la SPEC dérive en journal.

**La SPEC ne se fragmente jamais.** Un BC, un fichier, complet. Si elle devient trop grosse pour être lue d’un trait, c’est un **signal de découpage du BC** — pas un problème de fichier. Comme la page du CADRE : la taille est un capteur.

---

## Exemple complet — `conges`

```text
conges/
├── pact/                                          CE QUI EST VRAI
│   ├── CADRE.md                                   6 sections + carte générée
│   ├── CH-00-INIT-cadre/CH.md
│   ├── socle/
│   │   ├── SPEC.md                                capacités · contrats · politiques · rôles · matrice
│   │   ├── ux/socle-wireframe.canvas.tsx
│   │   └── CH-00-INIT-socle/CH.md
│   └── leave/
│       ├── SPEC.md                                intention · données · états · règles · liens
│       ├── ux/leave-wireframe.canvas.tsx
│       ├── CH-00-INIT-demandes/CH.md
│       ├── CH-01-EVOL-justificatif/CH.md
│       └── CH-02-CORRECTION-validation-manager/CH.md
│
├── raster-src/lots/                               CE QU'ON FAIT
│   ├── cadre/CH-00-INIT-cadre/tasks/
│   │   └── CNG-1-ecrire-cadre.md                    spec · gate: me
│   ├── socle/CH-00-INIT-socle/
│   │   ├── 00-PLAN.md
│   │   └── tasks/ CNG-3 spec · CNG-4 feature · CNG-5 qa
│   └── leave/
│       ├── CH-00-INIT-demandes/
│       │   ├── 00-PLAN.md
│       │   └── tasks/ CNG-2 spec · CNG-6 feature (blocked_by CNG-4) · CNG-7 qa
│       ├── CH-01-EVOL-justificatif/
│       │   └── tasks/ CNG-8 spec · CNG-9 feature · CNG-10 qa
│       └── CH-02-CORRECTION-validation-manager/
│           └── tasks/ CNG-11 bug · CNG-12 qa
│
├── e2e/                                           preuves — par PROJET, jamais par BC
├── ops/
└── sources/
    ├── backend/                                   Gradle ici
    └── web/
```

**T0 — le CADRE.** `owns` demande · décision · solde. `not_owns` la paie (→ logiciel de paie), le contrat de travail (→ RH), le pointage (→ Sektor). Preuve = revue humaine.

**T1 — le premier BC.** `leave` déclare `consomme : identité, rôles` → le socle doit **acquérir**. D’où :

> **La spécification va du BC vers le socle** (le BC tire) — **l’exécution va du socle vers le BC** (le socle porte).

SPEC `leave` au jour 1 : `Demande` · `brouillon → soumise → validée | refusée` · `INV-1 fin ≥ début` · `R-1 seul le manager décide`. Le **solde** est dans le `owns` du CADRE mais **absent de la SPEC** : pas encore livré. *Pas de futur dans une SPEC.*

**T2 — une règle arrive pendant l’exec** (« au-delà de 10 jours, validation RH »). Vérité livrée ? **Non** → on modifie `CH-00` : SPEC patchée (`R-2`), critère ajouté, **re-gelé**, approbation, l’exec repart. **Aucune trace dans l’arbre** : ni dossier, ni task en plus.

**T3 — un vrai `EVOL`** (« la maladie exige un justificatif »). Vérité livrée → `CH-01`. L’exec livre aussi le justificatif sur les congés payés → **constat d’écart** : c’est une **dette**, retour exec, SPEC inchangée.

**T4 — un bug** (« un non-manager valide »). `R-1` existe → l’observé est faux **contre** la SPEC → **`CORRECTION`**. Pas de patch SPEC, e2e de repro puis vert.

Après trois changes, **`leave/SPEC.md` fait toujours une page** — elle a gagné deux lignes (`R-2`, `R-3`). Tout le volume est dans les `CH-*`, qui sont de l’archive.

---

## Tenir les règles

Une règle en markdown est une **suggestion** : un agent peut la sauter, et rien ne le rattrape. La fiabilité ne vient pas de mieux l’écrire — elle vient de la **déplacer**.

| Niveau | Mécanisme | Force |
|--------|-----------|-------|
| **Construction** | la structure rend la violation **impossible** (champ absent, chemin qui porte la cible, vue générée) | totale |
| **Check** | un validateur qui **échoue** | forte, immédiate |
| **Agent** | le QA | faible — un agent qui vérifie un agent partage ses angles morts |

**Méta-règle : toute règle déclare son niveau.** Une règle ni constructible ni checkable, et trop importante pour être laissée à un agent, se **réécrit** jusqu’à devenir checkable. Si tu ne sais pas écrire le check, la règle est encore floue.

**Moins de règles.** Chaque règle ajoutée dilue les autres : un agent devant 200 lignes normatives applique les saillantes, pas toutes. **Dix règles tenues > cinquante énoncées.**

**Les règles voyagent avec le travail.** À l’exécution, l’agent ne lit pas ce blueprint : il lit ce que l’orchestrateur lui tend. Les `POL-*` applicables, le périmètre et les AC sont **injectés dans la task** — jamais laissés à découvrir.

(Validateur : **à construire** — impact `RASTER_BLUEPRINT`.)

---

## Brancher Raster (optionnel)

Pact n’a pas besoin de Raster. Si Raster se branche : voir [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md) — projection lot ← socle\|BC, sous-lot ← change, task ← work.
