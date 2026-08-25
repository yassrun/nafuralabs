# Contrat — Planning : couche d'activités

> Ce sous-lot est autonome. Ancrage = `AC-n` ici.
> Gels : [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) — § Simplicité (palier 2), § planning = couche d'activités, § WBS libre + zone, § avancement en quantité (remontée).
> **Pas de task QA** : rien ici ne facture ; vérif Gantt = orch / humain.

**Qualification : EVOL.** Coquille front `chantiers/planning/` (phases) sans backend. `ActiviteCouvertureService` = stub vide (palier 1).

Gelé le **25/08/2026** depuis les gels du 23/08. Tasks exec **référencent** `AC-n`.

---

## Intention

Le planning **n'est pas** le Gantt de l'arbre. Il porte des **activités** (durée, calendrier, précédences, WBS libre, zone optionnelle) rattachées à **0..n nœuds** avec **quotité = quantité prévue**.

**Palier 1 intact** : sans aucune activité, avancement direct sur nœud, attachement et situation restent possibles. Dès qu'un nœud est couvert par ≥1 activité, la déclaration directe sur ce nœud est refusée (porte déjà dans `ActiviteCouvertureService`).

---

## Critères gelés

### Activité et structure

**AC-1 — L'activité est un objet du chantier.** CRUD API sous `/api/v1/chantiers/{id}/activites` (ou équivalent cohérent). Champs min : libellé, dates début/fin (ou durée + début), parent WBS optionnel, zone optionnelle (`ZoneChantier`), ordre.

**AC-2 — WBS libre.** Hiérarchie d'activités créée par l'humain. **Interdit** de générer la WBS depuis l'arbre des lots ou depuis les zones.

**AC-3 — Zone facultative.** Une activité peut n'avoir aucune zone. Le référentiel est celui du chantier (`ZoneChantier`) — pas un second référentiel.

**AC-4 — Liens de précédence.** Au moins FD ; DD / FF / DF supportés si peu coûteux (gel les nomme). Cycle refusé.

**AC-5 — Pas de dérivation depuis l'arbre.** Aucune activité auto-créée à la conversion ni depuis les nœuds. Facturation jamais depuis le planning.

### Rattachement et quotité

**AC-6 — Rattachement 0..n.** Une activité se rattache à zéro, un ou plusieurs nœuds (`ChantierLot` / postes unifiés côté arbre). Chaque lien porte une **quantité prévue** (quotité), pas un %.

**AC-7 — Quotité ≤ 100 % du nœud.** La somme des quantités prévues des activités sur un nœud ne dépasse pas la quantité du nœud. Dépassement → refus explicite.

**AC-8 — Couverture.** `ActiviteCouvertureService.activitesCouvrant(noeudId)` retourne les activités liées. Non vide → déclaration d'avancement **directe** sur ce nœud refusée (garde déjà prévu palier 1).

### Avancement

**AC-9 — Saisie sur l'activité.** Quantité faite sur activité rattachée ; % dérivé (`fait/prévu`), jamais stocké comme fait. Activité sans nœud : avancement en % saisi (installation, jalon).

**AC-10 — Remontée.** Quantités faites des activités → cumul par nœud → l'attachement de période **lit** ces quantités (pas de ressaisie parallèle pour les nœuds couverts).

**AC-11 — Palier 1.** Chantier sans activité : comportement vague 1 inchangé (déclaration sur nœud ouverte partout).

### Écran

**AC-12 — Gantt activités.** L'écran `/chantiers/planning` (et/ou onglet chantier) affiche les **activités**, pas les anciennes phases comme modèle de planning. Coquille phases : réécrire / brancher sur le backend activités ; ne pas livrer un second Gantt mort.

### Workspace conducteur (qualité étude) — gelé 25/08/2026

> Constat après SEKTOR-178 : l'API tient AC-1..AC-11 ; l'écran est une **lecture**. L'étude a un workspace (arbre + drawer + saisie). Le chantier, cœur BTP, doit le même grain **à l'écran**. Pas Primavera — le drawer de chiffrage, pas Postman.

**AC-13 — Créer sans quitter le Gantt.** Depuis `/chantiers/planning` (chantier filtré) et depuis l'onglet Planning de la fiche, un CTA **Nouvelle activité** ouvre le drawer. L'état vide propose la même action, **pas** « créez via l'API ». Création = libellé + dates ; parent WBS et zone facultatifs. Rien n'est généré depuis l'arbre.

**AC-14 — Le drawer est un workspace, pas un dump.** Lecture **et** édition : libellé, début, fin, parent (liste des activités du chantier, libellés), zone (liste du référentiel chantier, libellés). **Aucun UUID** affiché comme valeur principale. Vocabulaire : activité, zone, lot, poste, quantité — pas WBS / quotité / coverage à l'écran palier 2.

**AC-15 — Les lots ne sont pas des barres.** Le Gantt n'ajoute pas les lots / postes comme lignes calendrier (pas un Notion calendar des nœuds). Les lots restent dans l'arbre. Le rattachement est un **lien** depuis l'activité.

**AC-16 — Rattacher comme on décompose un poste.** Dans le drawer : picker de nœud (arbre du chantier : lot / poste, code + désignation) + **quantité prévue** + reste disponible sur le nœud. Dépassement (AC-7) : message métier dans le drawer, pas une 4xx brute. Détacher depuis la même liste. Zéro rattachement = activité interne / jalon, autorisé.

**AC-17 — Déclarer l'avancement dans le drawer.** Activité rattachée : quantité faite + date. Activité sans nœud : % saisi. L'attachement n'est pas ressaisi ici. Palier 1 inchangé s'il n'y a aucune activité (AC-11).

**AC-18 — Fallback manuel, pas d'IA obligatoire.** Aucun champ « Proposer » requis pour livrer. Glisser les dates sur le Gantt (déjà possible) reste un fallback ; créer / rattacher / avancer se fait au drawer si le drag ne suffit pas.

**AC-19 — Un seul Gantt vivant.** Le composant encore nommé `phase-drawer` est l'éditeur d'**activité**. L'onglet phases / import PDF n'est pas un second planning. Libellés i18n, pas de clés mortes « phase » pour une activité.

---

## Hors périmètre (autres sous-lots vague 2)

- Capacité MO / matériel, nivellement, besoins ST / matière → `capacite-et-engagement`
- Baseline, OS, intempéries → `baseline-et-os`
- Pointage RH → `pointage-impute`
- Magasin / DA matière → `matiere-et-magasin`
- Créer DA ou contrat ST depuis le planning
- Chemin critique, calendriers, baseline, lag, nivellement, import MPP/XER
- Formulaire de création de **lots** dans le Gantt (interdit AC-15)

---

## Scénarios e2e (état initial)

1. **Palier 1 intact** — chantier converti sans activité : POST avancement sur poste vendu → 2xx (comme vague 1).
2. **Créer activité + rattacher** — activité « Coffrage R+1 », rattache poste béton quotité 50 m³ sur 100 → OK ; seconde activité 60 m³ → 4xx (AC-7).
3. **Couverture** — après rattachement, POST avancement direct sur ce nœud → refus ; POST quantité faite sur l'activité → cumul nœud mis à jour.
4. **WBS + zone** — activité enfant sous parent ; zone optionnelle depuis référentiel chantier.
5. **Empty → CTA** — chantier sans activité : empty state + **Nouvelle activité** → drawer → barre sur le Gantt (aucun texte « API »).
6. **Rattacher à l'écran** — picker poste « Béton armé » 50 m³ OK ; trop → message drawer. Gantt sans barre lot.
7. **Avancer dans le drawer** — 12 m³ faits → nœud mis à jour ; avancement direct sur ce nœud refusé (AC-8).
8. **e2e chantier créé puis planifié** — étude 1 lot / 3 postes → devis → GAGNE → chantier `EN_PREPARATION` (comme le walk QA) ; **ensuite** créer au moins 2 activités (dont une rattachée au poste décomposé + qté faite). Preuve sous `sektor/e2e/` (script Mode B et/ou Playwright). Le Gantt du chantier n'est plus vide.

Canvas : [`ux/planning-workspace-wireframe.canvas.tsx`](ux/planning-workspace-wireframe.canvas.tsx).

Preuves = Playwright / Mode B sous `sektor/e2e/` — **pas** de task `type: qa`.

---

## Arbitrages figés ici (ouverts du gel § Ouvert)

- Types de lien : **FD obligatoire** ; DD/FF/DF si le modèle le permet sans explosion.
- Front : **réécrire** la coquille `planning/` sur le backend activités (pas deux écrans).
