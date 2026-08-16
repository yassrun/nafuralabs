# AGENTS.md — Raster (orchestrateur)

> **Raster** = **projet** (lot · sous-lot · **task**) **et** moteur (INDEX / Sprint / CLI). **Pas** Pact (SPEC / CH / canvas).  
> **`<projet>/raster-src/`** = fichiers Raster du projet — **obligatoire**.  
> **`raster/`** = le projet Raster (`raster/raster-src/` + `pact/` + moteur).  
> Blueprint : [`RASTER_BLUEPRINT.md`](../RASTER_BLUEPRINT.md) · Pact : [`PACT_BLUEPRINT.md`](../PACT_BLUEPRINT.md).

**Actors :** `me` | `agent` uniquement.  
**Contrainte #1 :** coût d’interaction (capture &lt; 5 s · scan INDEX &lt; 2 s · check progress = dialogue à deux).

---

## 0. Décisions figées (2026-08-11) — orchestrateur

| Décision | Choix |
|----------|--------|
| Rôle `raster/` | **Projet** Raster : app + moteur (regen vues, Sprint, CLI `t`) |
| Stockage tickets | **Dans le projet** sous `<projet>/raster-src/lots/…` — jamais sous `raster/nafura/…` (legacy) |
| Chemin tasks (canon) | `<projet>/raster-src/lots/<lot-slug>/…/tasks/{ID}-{slug}.md` |
| Chemin tasks (legacy) | **aucun** — `docs/specs/lots` et `raster/lots` sortis du dépôt (2026-08-13) |
| Inbox | **Une globale** : `raster/inbox.md` (dans le projet Raster) |
| IDs | **Par projet** (préfixe dédié, immuable) — ex. Sektor=`SEKTOR`, Platform=`PLT`, Raster=`RAS`, Personal=`PER`, Ops=`OPS` |
| Pact | `<projet>/pact/` si **app ou site** — Raster n’indexe pas les SPEC/canvas |
| Vocabulaire | **Lot** · **sous-lot** (= CH si branché sur Pact) · **Task** = seul item sprintable |
| Tout projet | **DOIT** avoir `raster-src/` (y compris `raster/raster-src/`), même hors IT |

**Plus de migration à faire :** l'ancien `docs/specs/lots` est sorti du dépôt (`Desktop/nafuralabs-archives/`). Sur un projet déjà développé, **Raster part du vide** — on ne reprend pas le passé.

---

## 0.1 Hard rules

1. **Rien ne s’exécute qui ne soit dans une task. Rien n’entre en task sans passer par le promote.** Un prompt va à l’**inbox**, jamais chez un exec. Le `sprint:` est commité par l’**orchestrateur**.
2. **Mode autonome.** Les agents posent les statuts. Tu n’interviens qu’à trois endroits : le **CADRE** (`gate: me`), une **question bloquante** (indécidable — pas une permission), le **`done-me`**. En contrepartie, la task porte un **rapport de livraison** à `done-agent` (§2) — sans lui, `done-me` est un blanc-seing.
3. Pas d’`estimate`. Pas de `dropped` (abandon = delete).
4. **Inbox = uniquement `raster/inbox.md`.** Chaque ligne = task draft (description). Lot / sous-lot sans Tasks : ne pas créer ; **pas** inbox.
5. **Backlog + Sprint = Tasks seulement.** Un lot/sous-lot n’est pas sprintable. Commit = `sprint:` sur une task.
6. **`done-me` → le fichier sort du dépôt.** `node raster/t.mjs sweep` le supprime et élague les dossiers vides. **Git porte l'histoire** — comme pour la SPEC. Pas d'archive. `done-agent` reste live (vue **Done agent**). *(Une archive reste à décider.)*
   **Contrepartie :** `<projet>/raster-src/NEXT` garde la **borne haute des IDs**. Sans lui, un id supprimé serait réattribué — la règle « IDs immuables » n'aurait plus rien pour la tenir.
7. Toute task a un **`type:`** `spec` | `feature` | `bug` | `tech` | `physical` | `qa` et un **`agent_type:`** `spec` | `exec` | `qa` (dérivé du type si absent). **`kind` n’existe plus** : lot et sous-lot sont des **dossiers**, pas des tickets (§2).
8. Status : `todo` \| `doing` \| `blocked` \| `review` \| `done-agent` \| `done-me`. Nav : Inbox · Backlog · Sprint · **Done agent**. DOR/DOD : `raster/pact/work/SPEC.md`.
   **`done-me` ne se pose pas — il se gagne.** Il sort du sélecteur de status : ce n'est pas un état qu'on choisit, c'est le résultat d'une approbation. À `done-agent`, la **gate** décide seule de la suite :

   | `gate:` | Après `done-agent` | Toi |
   |---------|--------------------|-----|
   | `none` | → **`done-me`** immédiat, puis sweep | rien — tu n'as jamais été requis |
   | `me` | reste **`done-agent`**, la task **t'attend** | ton approbation pose `done-me` |

   Conséquence assumée : une task `gate: none` sort du dépôt **sans que tu la voies**. C'est le prix du mode autonome, et c'est pour ça que la gate est le seul champ qui compte au découpage.
9. **Une task ne s'écrit jamais à la main — le CLI est la seule voie d'écriture.** `t.mjs` possède le frontmatter et l'arborescence : `new` (alloue l'ID depuis `NEXT`, pose les enums, crée le dossier), `promote` (ligne d'inbox → task), `sprint`, `status`. Chaque commande regen. Un agent qui compose du frontmatter à la main n'est pas rapide, il est faux : `check` refuse.
   **Pourquoi :** un agent oublie `sprint:`, retombe sur l'inbox, invente un enum. À un agent tu relis ; à dix en parallèle, tu ne relis plus. L'orchestration autonome (§7) n'existe que si l'écriture est mécanique.
   *(2026-08-16 — décidé. `t.mjs` n'expose encore que `index` / `check` / `sweep` : les commandes d'écriture sont à implémenter.)*

### 0.2 Critère sous-lot — **mode Raster seul uniquement**

> **Branché Pact : ce paragraphe ne s’applique pas.** Le sous-lot **est** le CH, toujours, dès le premier. Voir [`RASTER_BLUEPRINT.md`](../RASTER_BLUEPRINT.md) § Projection.

Ci-dessous : projets **sans** Pact (compta, perso, ops), où aucun Change ne porte le découpage.

**Défaut : Lot → Task.** Le sous-lot n’est pas obligatoire.

Créer un **sous-lot** seulement si le lot mélange **≥ 2 flux livrables indépendants**.

Un flux est indépendant si **les 3** sont vrais :

1. Autre domaine / module / famille d’écrans (pas le même `00-PLAN`)
2. Peut être livré **sans** l’autre flux
3. Un agent peut l’exécuter **sans** lire les tasks de l’autre

| Contexte | Découpe |
|----------|---------|
| 1 app petite/moyenne, 1 contexte (Raster, ops, perso, MBS) | **Lot → Task** |
| 1 lot ERP = 1 chapitre, plusieurs flux (Sektor *Chantier* = fiche + pointage + ST + planning) | **Lot → Sous-lot → Task** |
| Lot encore vide / premier flux | Task directe sous le lot ; le 2ᵉ flux indépendant **crée** les sous-lots (reparent si besoin) |

**Interdit :** sous-lot vide « au cas où ». **Interdit :** rattacher une task au lot si ce lot a **déjà** des sous-lots (alors parent = sous-lot).

---

## 1. Où vit quoi

### Produit / projet

```
<projet>/                         # peer (sektor, raster, …)
  raster-src/                     # OBLIGATOIRE — lots / sous-lots / tasks
    lots/
      <lot-slug>/
        tasks/
          {ID}-….md
        <sous-lot-slug>/          # optionnel — §0.2 ; si Pact = un CH
          00-PLAN.md
          tasks/
            {ID}-….md
      _archive/
      _backlog/tasks/
  pact/                           # SI app ou site
  ops/                            # SI Pact
  e2e/
  sources/                        # runtimes — NAFURALABS.md § Intérieur
    backend/                      # Gradle ici — un seul
    web/
  ROADMAP.md                      # ordre des lots — écrit à la main (hors raster-src) — §7
```

### Projet Raster (`raster/`)

```
raster/
  raster-src/         # tickets du projet Raster (RAS-*)
  pact/               # app → oui
  sources/web/        # UI
  AGENTS.md           # ce contrat
  inbox.md            # capture globale
  regen.mjs / t.mjs   # moteur — racine du projet, pas sources/
  INDEX.tsv           # GÉNÉRÉ
  SPRINT.md           # GÉNÉRÉ
  BACKLOG.md          # GÉNÉRÉ
```

### App UI

Vit dans `raster/sources/web/`. Le moteur (`t.mjs`, INDEX) reste à la racine du projet Raster.

---

## 2. Schema ticket

### Les chapeaux ne sont plus des tickets

**Lot et sous-lot = des dossiers.** Aucun fichier ticket. Leur état se **dérive** :

| | État | D’où |
|--|------|------|
| **Lot** | jamais `done` | constant — rien à stocker |
| **Sous-lot** | `done` ⇔ **toutes** ses tasks `done` | calculé au scan |
| Titre | slug du dossier · ou l’`Intention` de la SPEC si branché Pact | — |

Un dossier sans task n’apparaît nulle part : le « sous-lot vide au cas où » devient **impossible**, plus besoin de l’interdire.

**`kind` est supprimé.** Un seul axe : `type:`.

### Obligatoire

```yaml
id: CNG-9
status: todo                 # todo | doing | blocked | review | done-agent | done-me
context: nafura              # nafura | saham | personal
type: feature                # spec | feature | bug | tech | physical | qa
agent_type: exec             # spec | exec | qa   (dérivé de type si absent)
priority: P1                 # P0 | P1 | P2 | P3
assignee: agent              # me | agent | either
gate: none                   # none | me
```

### Fréquent

```yaml
sprint: 2026-W33
blocked_by: [CNG-4]
tags: [sektor, ux]
```

**`parent:` est supprimé** — il est dans le chemin (`lots/<lot>/<CH>/tasks/…`). Un champ de moins qui peut être faux. `blocked_by:` reste : une dépendance entre tasks n’est pas positionnelle.

### Corps

```markdown
# Titre

> 2 lignes max.

## Étapes
- [ ] …                      étapes de travail, PAS des critères

## Journal
```
DD/MM HH:MM  append-only
```

## Rapport de livraison       ← obligatoire à `done-agent`

ce qui a changé      2 lignes — fichiers / écrans
critères prouvés     AC-n → preuve exécutée
décidé seul          les arbitrages pris sans toi
écarts / dette       ce qui n'est pas fait
```

**Le rapport n’est pas du confort.** En mode autonome tu ne valides plus **avant** : il est la seule chose qui te dit ce qui a été décidé sans toi.

### `## Question` — obligatoire dès qu'une task t'attend

Toute task qui te rend la main (`gate: me` à `done-agent`, ou `blocked` externe, ou question bloquante) porte une section `## Question` :

```markdown
## Question

<la décision attendue, une phrase>

- **A** — … (conséquence)
- **B** — … (conséquence)

Recommandé : A — <pourquoi, une ligne>
```

**Sans elle, l'attente est muette.** L'UI n'aurait qu'un `gate: me` à afficher, et tu devrais ouvrir le fichier pour savoir ce qu'on te demande — donc tu ne le ferais pas. Une task qui t'attend sans question posée est une task mal rendue : l'agent doit la formuler **avant** de te repasser la main.

**Pas de section « Critères d’acceptation ».** Ils vivent dans `CH.md` (`AC-1`, `AC-2`) ; la task les **référence**. Un critère recopié est un critère qui divergera.

Enums fermés — ne jamais inventer. Pas de compteurs dérivés dans le frontmatter.

| `type` | Sens | `agent_type` |
|--------|------|--------------|
| `spec` | écrire SPEC / CADRE / CH / canvas | `spec` |
| `feature` | comportement nouveau | `exec` |
| `bug` | le code rattrape une SPEC déjà juste | `exec` |
| `tech` | refonte / perf / migration — **même** comportement | `exec` |
| `physical` | travail **non logiciel** (appeler, signer, acheter) — hors Pact | `exec` |
| `qa` | exécuter les preuves, verdict | `qa` |

`physical` dit **quelle nature de travail**, `assignee: me` dit **qui le fait**. Une `feature` peut être `assignee: me`. Ne pas confondre les deux axes.

---

## 3. Pipeline

| # | Action | Où |
|---|--------|-----|
| 1 | **Capture** | `raster/inbox.md` (globale) — non spécifié = **reste ici** |
| 2 | **Promote / balayage** | rattacher à un **sous-lot**, ou au **lot** s’il n’a pas encore de sous-lots. Sinon rester inbox |
| 3 | **Commit** | `sprint: 2026-Wn` sur une **Task** seulement |
| 4 | **Check progress** | status + journal sur les tickets produit |
| 5 | **Sweep** | `done-me` → **supprimé du dépôt** (`t.mjs sweep`) · `NEXT` bumpé |

Pack agent « nouveau CH » (**branché Pact**) :

1. Dossier `raster-src/lots/<lot-slug>/<CH-nn-TYPE-slug>/` — **nom identique au CH côté `pact/`**
2. `tasks/` : les tasks du pack (`spec` + `feature`\|`bug`\|`tech`, + `qa`)
3. `00-PLAN.md` **seulement si ≥ 2 tasks exec**
4. Regen Raster (`node raster/t.mjs index`)

Pack agent « nouveau lot » (**Raster seul**, §0.2) :

1. Dossier `raster-src/lots/<lot-slug>/tasks/` — N× tasks
2. `LOT.md` optionnel si le slug ne suffit pas comme titre
3. `ux/` si UI
4. Regen Raster

**Aucun ticket de chapeau** dans les deux cas : le dossier *est* le chapeau.

---

## 4. IDs par projet (exemples)

| Projet (peer) | Préfixe |
|-----------------------|---------|
| `nafura-platform` (racine) | `PLT` |
| `sektor-btp` / `sektor` | `SEKTOR` (legacy tickets `ERP-*` encore en vie) |
| `raster` | `RAS` |
| `personal` | `PER` |
| `ops` | `OPS` |
| `nafuralabs-migration` | `MIG` |
| client MBS… | `MBS` (ou préfixe dédié) |

IDs **immuables**. Jamais renumérotés / réutilisés.

---

## 5. Vues générées (Raster owns)

- `INDEX.tsv` — entrée agents  
- `SPRINT.md` — semaine ISO + dates lun→dim  
- `BACKLOG.md` — tree projet → feature → tasks  
- Regen après chaque mutate : `node raster/t.mjs index`

---

## 6. Interdit

- Créer des tasks sous `raster/nafura/…` (legacy)
- `00-PROGRESS.md` comme SSOT de suivi (suivi = tickets)
- Feature commitée / exécutée sans enfants Task
- Epic docs pour un bug
- Dupliquer un ticket (une seule copie fichier)
- Inventer enums / `estimate` / Kanban global

---

## 7. Orchestration

> Objectif : tu planifies **un lot ou deux**, l'orchestrateur déroule sans attendre de prompt. Tu n'interviens qu'aux trois endroits du §0.1-2.

**Unité d'isolation = le lot.** Un lot n'est jamais travaillé par deux orchestrateurs à la fois : celui qui le tient possède son périmètre d'écriture. Deux lots indépendants tournent en parallèle.

**Pourquoi le lot, et pas la task :** la collision qui casse le travail parallèle n'est pas logique (`blocked_by:` la couvre déjà), elle est **physique** — deux agents qui éditent le même fichier. Le lot est la plus grosse frontière qu'on tient sans avoir à déclarer un périmètre de fichiers task par task.

**Grain de fan-out = le sous-lot.** L'orchestrateur du lot lance **un exec par sous-lot ouvert**, en parallèle ; à l'intérieur d'un sous-lot les tasks se déroulent en **série**. Deux lots planifiés = autant d'agents que de sous-lots ouverts.

Le CH est déjà la frontière de périmètre côté Pact (`PACT_BLUEPRINT.md`) : fan-outer dessus ne crée pas de nouvelle notion, et deux CH d'un même lot ne se marchent pas dessus par construction. C'est ce qui permet à l'orchestrateur de ne **jamais arbitrer** une collision — s'il devait le faire, il le ferait seul, et tu le découvrirais au rapport.

| Niveau | Rôle | Concurrence |
|--------|------|-------------|
| **Lot** | isolation — un seul orchestrateur | parallèle entre lots |
| **Sous-lot** | grain de fan-out — un exec | parallèle dans le lot |
| **Task** | unité de travail | **série** dans le sous-lot |

### Roadmap — `<projet>/ROADMAP.md`

**Écrite à la main, hors `raster-src/`.** Les lots dans l'ordre, et ce qui bloque quoi. C'est le **seul** endroit où tu planifies, et ce que l'orchestrateur lit pour savoir quel lot ouvrir quand il en libère un.

**Pourquoi à la main et pas dérivée d'un `after:` :** la roadmap est un **acte**, pas un calcul. Elle porte ce que tu veux — y compris des lots qui n'ont encore aucune task, ni dossier. Un ordre dérivé ne dirait que ce qui existe déjà, donc jamais l'intention. Et ça garde les chapeaux sans frontmatter (§2).

**Raster ne l'indexe pas.** `ROADMAP.md` n'est ni Backlog ni Sprint : un lot inscrit sans task n'apparaît nulle part ailleurs. Cohérent avec « seule la task est un ticket ».

### La borne

`ROADMAP.md` porte un marqueur unique `<!-- borne -->`. **Au-dessus : ouvert à l'orchestrateur. En dessous : pas encore.** Il enchaîne les lots dans cette fenêtre sans rien te demander, puis s'arrête à la borne et te le dit.

**Déplacer la borne est ton acte de planification** — le seul geste. Un lot ou deux d'avance, et tu peux partir.

Une borne, pas un flux continu : ton autonomie est bornée par ta **décision**, pas par ta présence. Un découpage raté ne se propage pas au-delà de la fenêtre que tu as ouverte.

### Le skill et les agents

Boucle = **skill `orchestration`** (`.claude/skills/orchestration/`). Rôles lancés = **subagents** (`.claude/agents/` : `exec`, `spec`, `qa`) — le fan-out par sous-lot n'a personne à lancer sans eux, et un rôle redécrit à chaque lancement dérive.

**Le skill ne possède aucune règle.** Un skill n'est lu que par Claude Code ; **Cursor ne le voit pas**. Tout ce que les deux doivent savoir reste dans ce fichier — le skill y **renvoie**. Une règle recopiée dans le skill, c'est Cursor qui orchestre avec une règle en moins.

Ce qu'il porte, la boucle et rien d'autre :

1. lire `ROADMAP.md` → premier lot au-dessus de la **borne**
2. sous-lots ouverts de ce lot
3. **un subagent par sous-lot**, en parallèle — tasks en série à l'intérieur
4. collecter les **rapports de livraison** (§2)
5. libérer le lot → suivant
6. s'arrêter à la borne, sur `gate: me`, ou sur question bloquante (§0.1-2)

### Qui appuie sur le bouton

**L'app lance l'orchestrateur d'un lot** — un bouton, un spawn côté serveur, et c'est *lui* qui fan-oute sur les sous-lots. L'UI ne lance jamais un exec directement : elle redécrirait la boucle du skill, et deux boucles finissent par diverger.

« Pas de spawn SDK » (l'ancien contrat de l'app, brief copié à coller dans Cursor) **tombe** : il supposait que tu sois devant l'écran à chaque lancement.

### Readiness — calculée, jamais stockée

**Grain = le sous-lot.** Il est **lançable** si toute task dont il dépend *hors de lui* est `done-agent` \| `done-me` (ou absente). À l'intérieur, `blocked_by:` ne fait qu'**ordonner** — les tasks sont en série, l'exec suit l'ordre.

**`status: blocked` = blocage externe uniquement.** J'attends un client, une signature, une livraison — quelque chose que Raster ne voit pas. Un sous-lot dont une task est `blocked` n'est pas lançable, quels que soient ses `blocked_by`.

| Notion | Qui la pose | Portée |
|--------|-------------|--------|
| `blocked_by:` | toi / l'agent au découpage | **interne** — calculé, jamais affiché comme un état posé |
| `status: blocked` | toi | **externe** — hors Raster |

Ce qui manquait n'était pas d'avoir une seule notion, c'était que **ni l'une ni l'autre n'était calculée** et que rien ne disait laquelle sert à quoi. Readiness reste dérivée : rien dans le frontmatter (§2).

*(2026-08-16 — décidé. Reste : implémenter.)*

---

## Changelog

| Date | Décision |
|------|----------|
| 2026-08-16 | **Écriture = CLI seul** (§0.1-9) · orchestration : lot = isolation, sous-lot = fan-out, task = série (§7) · **`ROADMAP.md`** écrit à la main + **borne** d'autonomie · skill `orchestration` = la boucle, **jamais** les règles (Cursor ne lit pas les skills) |
| 2026-08-13 | Orchestrateur Raster (`nafura-orch`) · exec → `review` · spec consolide SPEC+UX · QA pose `done-agent` sur feature/bug |
| 2026-08-13 | `type: qa` · `agent_type:` spec \| exec \| qa · QA = task dédiée (`review` / `gate: qa` legacy) |
| 2026-08-13 | **`raster-src/`** obligatoire par projet · **`raster/`** = projet Raster · **`pact/`** si app/site |
| 2026-08-05 | Pipeline Capture→…→Archive · pas d’estimate |
| 2026-08-11 | Brand **Raster** · `pm/` → `raster/` |
| 2026-08-11 | **Orchestrateur** : tasks dans `epics/<slug>/tasks/` · IDs par projet · plus de stockage métier sous `raster/` |
| 2026-08-12 | Inbox **globale** `raster/inbox.md` (pas liée à un projet) · filtre projet = Backlog / Sprint seulement |
| 2026-08-12 | **`kind: bug-umbrella`** figé (comme `feature`) · enfants = `kind: bug` |
| 2026-08-13 | Inbox **uniquement** `raster/inbox.md` · ligne = task draft |
| 2026-08-13 | `type:` spec \| feature \| bug \| physical · DOR/DOD · `done` = me · `review` = QA (feature/bug) |
