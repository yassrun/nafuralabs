# Contrat — Vie de chantier palier 1 (STE)

> Ce que **STE Al Binaa** attend de Sektor pour vivre [`SCENARIO.md`](SCENARIO.md), sans planning et sans finance.
> Journal : [`../../../DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) — palier 1, matière au chantier, marché à la notification, ST Achats / exécution Chantiers.
> Plan : [`00-PLAN.md`](00-PLAN.md). UX : [`ux/vie-de-chantier-wireframe.canvas.tsx`](ux/vie-de-chantier-wireframe.canvas.tsx).

**Qualification : FEATURE + BUG.** Les objets existent souvent (DA, BC, réception BL, documents, ST, marché, avancement). Ils ne forment **pas** une vie de chantier : le cockpit n'ouvre pas ces ops, la DA n'exige pas le nœud, la ST est collée au planning, la preuve QA s'arrête à « l'écran charge ».

Gelé le **27/08/2026**.

---

## Intention

Le conducteur pilote **un** chantier depuis le cockpit. Chaque jour il peut : déclarer une quantité, demander un achat, réceptionner un BL, déposer un document, voir le ST. Chaque mois il attache et situe. Le marché se notifie quand il existe. Rien de tout ça n'exige une activité.

L'étude a **déjà** produit l'arbre, le DPU et les consultations. Ce lot ne raffine pas Études.

---

## Ce que la STE attend, par BC

### Études (prérequis, pas le travail de ce lot)

- Postes décomposés vs ST vs forfait restent distincts jusqu'au snapshot chantier.
- Consultation Achats liée → flag CONSULTÉ sur l'article, pas une DA.
- Conversion : chantier sans marché, vente = devis.

### Catalogue

- Les articles du DPU (ciment, sable, acier, gravier créé) sont les mêmes que ceux de la DA et du BL.
- Magasin chantier **facultatif**. Al Qods = **livraison directe**. Le stock, s'il existe, reste `catalogue/`.
- Une réception BL n'invente pas un article.

### Achats

- **Consultation** ≠ **DA**. La première est l'étude. La seconde est le chantier.
- DA → BC → **réception BL** (`blNumero`, quantités). Livraison partielle tracée.
- **Contrat ST** : objet Achats, fournisseur, BPU, chantier, **nœud vendu** (poste 2.3 / 3). Pas un JSON dans `notes` si `frontieres-bc` l'a déjà sorti ; sinon on ne ré-encode pas.

### Chantiers

- Cockpit = porte. Prochaines actions **réelles** : avancement, DA, BL en attente, documents, ST, attachement, situation — selon le trou du moment, pas une liste fixe de quatre modules.
- Avancement = quantité sur nœud (contrats déjà gelés, à **exercer** dans Al Qods, pas à redéfinir).
- Documents : OS, plans, PV, BL scanné, rattachés au chantier (nœud facultatif). Pas des photos d'activité (palier 2).
- Nœud interne : coût, jamais situation.

### Marchés

- Naît à la **notification**, depuis le chantier (ou fiche marché ouverte depuis le cockpit).
- Après notification : vente active = marché. Avant : devis.
- Avenant = seul moyen de dépasser une quantité prévue. Hors finance.

### Finance — hors lot

Pas de lettrage, encaissement, écriture RAS, paie. La situation validée **peut** déjà pousser une facture Ventes (contrat `situation-et-retenues`) ; on ne prouve pas le règlement.

---

## Amendement produit — tranché A (27/08)

Le gel ST du 23/08 disait : *« Une ST affectée à un chantier sans activité — interdit. »*

**A, approuvé.** Au palier 1, le contrat ST s'accroche à un **nœud** de l'arbre, comme la DA. L'attachement ST reste une suite. Le planning **date** l'engagement, il ne le crée pas. Journal : [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) gel 27/08.

---

## Critères d'acceptation

### Porte cockpit

**AC-1 — Le cockpit ouvre les ops du jour.** Pour un chantier `EN_COURS`, `nextActions` et les modules incluent, quand l'état le justifie et que le rôle le peut : saisie d'avancement, nouvelle DA, réceptions BL du chantier, documents, ST, attachement, situation. Planning reste une **recommandation**, jamais la seule porte vers la matière ou la ST.

**AC-2 — Une action mène à un écran qui connaît le chantier.** La route porte `chantierId` (et le nœud si l'action part d'un poste). L'utilisateur ne re-cherche pas le chantier dans une liste tenant.

**AC-3 — Rôle.** Chef : avancement, documents, réception BL. Conducteur : DA, ST, attachement, situation, marché. Magasinier : réception, pas situation. DAF : finance, pas d'écriture terrain. Une action 403 n'est pas proposée.

### Matière palier 1

**AC-4 — La DA naît du chantier, optionnellement d'un nœud.** `chantierId` obligatoire. `noeudId` obligatoire dans le scénario 2.1 ; une DA sans nœud reste possible (besoin de base vie) et s'impute en interne, pas sur un vendu.

**AC-5 — BC et BL portent le même chantier / nœud.** Le BC vient de la DA. La réception porte `blNumero`, date, lignes. Un BL à 12 t sur un BC à 25 t laisse 13 t en reste ; le nœud n'est pas « livré ».

**AC-6 — Livraison directe, pas de stock obligatoire.** Réception BL valide → réel/engagé sur le nœud (ou le chantier si pas de nœud). Aucune obligation de magasin. Chemin magasin : hors Al Qods, pas cassé.

**AC-7 — Écart BL.** Quantité reçue > commandée : refus ou écart explicite à trancher. Jamais un écrêtage silencieux.

### ST palier 1

**AC-8 — Un contrat ST sans activité.** Création depuis le nœud 2.3 (ou 3) : fournisseur, BPU, montant, chantier, noeudId. Refus si le nœud est `INTERNE` ou n'appartient pas au chantier.

**AC-9 — L'exécution client reste le nœud.** L'avancement coffrage se saisit sur 2.3. Le contrat ST n'affiche pas un faux % (déjà AC-7 `frontieres-bc`). Facture ST et attachement ST : nommés, pas exigés pour Al Qods mois 1.

### Documents

**AC-10 — Documents depuis la fiche.** Onglet + action cockpit. Types utiles palier 1 : OS, plan, PV, BL, autre. Filtre `chantierId`. Dépôt visible sans recharger tout le tenant.

**AC-11 — Pas de document orphelin.** Un document a un chantier. Le nœud est facultatif.

### Marché

**AC-12 — Notification, pas conversion.** Après conversion, `marcheGenereId` est nul. Un geste **Notifier le marché** (cockpit ou Marchés avec chantier prérempli) crée et notifie. La vente active bascule. Un chantier sans notification reste vendu au devis.

### Preuve non superficielle

**AC-13 — Le graphe Al Qods est créé par la preuve.** Quantités 180 / 25 / 850 / 420. Rôles nommés. Aucun seed `DE-0103`.

**AC-14 — Chaque acte a un fait.** API + UI. Les six discriminants de l'acte 3 du scénario sont des tests, pas des observations « l'écran s'est affiché ».

**AC-15 — Réception provisoire.** Interdite tant qu'on est `EN_COURS` sans le geste. `POST /clore` depuis `EN_COURS` reste refusé. Le PV est un document, pas un statut magique.

---

## Hors périmètre

- `etudes/finition-parcours` (garde-fous, IA, pagination études) — **en pause**.
- Planning, activités, quotités, baseline.
- **Capacité** : plan de charge RH, engins / matériel, conflits, nivellement (`capacite-et-engagement`).
- **Engagement daté** : besoin matière né de l'activité (la DA palier 1 naît du nœud).
- Magasin chantier comme chemin principal ; pointage RH.
- Attachement ST / situation fournisseur (suite, après AC-8).
- Réception définitive, réserves, HSE.
- Finance : lettrage, encaissement, écritures, paie.
- Avenants complets (seul le **refus de dépassement** est exercé).

---

## Scénarios de preuve Mode B

Le détail vivant est [`SCENARIO.md`](SCENARIO.md). Noms stables :

| Id | Discriminant | AC |
|---|---|---|
| `alqods-etude-vers-os` | 4 postes, 2 ST, 1 interne, OS | prérequis |
| `alqods-da-bl-direct-2-1` | DA 40 t → BC → BL 40 t sur 2.1 | AC-4..7 |
| `alqods-bl-partiel-acier` | BC 25 t, BL 12 t, reste 13 | AC-5, AC-14 |
| `alqods-st-coffrage-sans-planning` | contrat sur 2.3, 0 activité | AC-8, AC-9 |
| `alqods-avancement-attachement-situation` | 40 m³ + 120 m² → attachement lu → situation | contrats voisins + AC-1 |
| `alqods-interne-hors-situation` | installation déclarée, absente attachement | AC-14 |
| `alqods-documents-os-pv` | OS + PV depuis cockpit | AC-10, AC-11 |
| `alqods-marche-notification` | vente bascule devis → marché | AC-12 |
| `alqods-roles` | chef / magasinier / daf | AC-3 |
| `alqods-reception-provisoire` | PV + POST réception, cockpit lecture seule, /clore refusé | AC-15 |
