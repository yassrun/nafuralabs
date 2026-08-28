# Contrat — finition du parcours Étude → Devis → Chantier

> Ce sous-lot ferme les écarts encore visibles après `raffinement-etude` et `continuite-etude-devis-chantier` : garde-fous avant gain, vocabulaire de conversion, traçabilité Étude–Devis–Chantier–Catalogue, et IA du dossier ouvert.
> Plan : [`00-PLAN.md`](00-PLAN.md). UX : [`ux/finition-parcours-wireframe.canvas.tsx`](ux/finition-parcours-wireframe.canvas.tsx).
> Il complète [`../raffinement-etude/CONTRAT.md`](../raffinement-etude/CONTRAT.md) et [`../../chantiers/continuite-etude-devis-chantier/CONTRAT.md`](../../chantiers/continuite-etude-devis-chantier/CONTRAT.md) sans rouvrir leurs décisions déjà tenues (montants transférés, lien Étude → Chantier, filtres portefeuille, OS refusé si prérequis bloquants).

**Qualification : BUG + RAFFINEMENT.** Revue humaine du **27/08/2026** (parcours réel, sans mutation de données) + cartographie API Mode B du même jour sur `DE-0103` / `DV-2026-0060` / `CH-2026-101`.

Gelé le **27/08/2026**.

---

## Constat (arbre intégré, Mode B)

Le socle fonctionne : vente, lots, budget et marge arrivent sur le chantier ; l'étude convertie ouvre le chantier ; l'OS n'est plus proposé avec des bloquants.

Ce qui reste faux ou incomplet :

1. `gagne()` ne lit aucun moteur de complétude. Un dossier avec coûts non établis, avertissement de chiffrage et marge nulle affiche `anomaliesBloquantes = 0` et propose Marquer gagné.
2. `CompletudeEtudeService` est **absent** de `sektor/sources` malgré SEKTOR-202 `done-me`. `GET /completude` répond 404. Les gates restent le tableau plat `GET /gates` (étape 4 non bloquante, 1 problème, compteur 0).
3. Le CTA conversion dit « Créer chantier et marché » ; la fenêtre dit qu'aucun marché n'est créé. `marcheGenereId` reste nul. C'est le contrat `arbre-et-conversion` AC-10.
4. Après conversion, `dateDemarrage` et `dureeMois` peuvent être nuls ; Convertir reste actif.
5. La liste Devis déclare une route détail mais le clic de ligne n'ouvre rien.
6. Sur le chantier, `devisNumero` (ex. `DV-2026-0060`) est du texte. `openDevis()` / `openEtude()` existent et ne sont pas branchés.
7. Un composant `LIBRE` survit à la conversion sans décision, sans `itemId`, sans lien Catalogue.
8. `/etudes` redirige vers `/etudes/devis`. Double pagination Études et Devis. Portefeuille chantiers : faux état vide pendant le chargement. Pourcentages non arrondis. Statut « Devis généré » parfois doublé. Checklist 7/8 avec planning `A_FAIRE` sur un chantier déjà `EN_COURS`.

### Carte opérationnelle après conversion (hors ce sous-lot)

Mesure API Mode B sur `CH-2026-101` `EN_COURS`, sans créer de données :

| Chemin | État actuel |
|---|---|
| Cockpit, prochaine action | avancement → attachement → situation → budget |
| Demandes d'achat | API `/api/v1/demandes-achat?chantierId=` existe ; 0 DA ; pas d'entrée cockpit |
| BL / réception | réceptions de BC (`/bons-commande-achat/{id}/receptions`) ; `inventory-txs` générique ; pas de BL chantier |
| Clôture | `POST /clore` → 409 « Closing requires RECEPTIONNE_DEFINITIF » ; chaîne `EN_COURS` → réception provisoire → définitive → clos **sans** DA, BL ni situation |

Ces chemins appartiennent à `chantiers/matiere-et-magasin` (vague 2) et à un futur geste de réception/clôture. Ils ne sont pas des AC de ce sous-lot.

---

## Résultat attendu

Avant de marquer gagné, l'humain voit les risques commerciaux et les tranche. La conversion crée **un chantier**, pas un marché. Depuis l'étude, le devis et le chantier, on ouvre les deux autres objets par identifiant. Chaque composant autrefois `LIBRE` porte une décision Catalogue. L'IA parle du dossier ouvert, pas d'un assistant générique.

---

## Critères d'acceptation

### Garde-fous avant gain et conversion

**AC-1 — Un warning visible n'est pas un compteur zéro.** Si l'écran montre un avertissement de chiffrage, une part de coûts non établis ou une marge nulle, le compteur de la même phase n'affiche pas `0`. Les contrôles ont un code stable, une sévérité `BLOCKING | WARNING | INFO`, un message et une action. Le frontend ne recalcule pas le compteur.

**AC-2 — Le gain consomme les contrôles.** `gagne()` refuse s'il reste un `BLOCKING`. Un `WARNING` commercial (coûts partiellement non établis, marge sous seuil tenant, composants `LIBRE` non tranchés) n'autorise le gain qu'après acceptation auditée (acteur, date, motif). Sans acceptation : l'UI désactive Marquer gagné et l'API refuse.

**AC-3 — 100 % de coûts non établis est bloquant.** Si le déboursé établi est nul ou indisponible alors qu'il existe des postes à chiffrer, le contrôle est `BLOCKING`. Ni le gain ni la conversion n'aboutissent.

**AC-4 — 0 / 0 n'est pas 100 %.** Zéro composant à contrôler s'affiche « aucun composant » ou « non disponible », jamais `0 / 0 (100 %)`.

### Conversion

**AC-5 — Vocabulaire unique.** CTA, titre de fenêtre et texte disent **Créer le chantier**. Interdit : « et marché ». Le texte rappelle : aucun `ContratMarche` ; la vente reste le devis validé ; le marché naît à la notification.

**AC-6 — Formulaire honnête.** Chaque champ est marqué obligatoire ou facultatif. Libellé du chantier : obligatoire. Code : facultatif, généré si vide. Date de démarrage et durée : facultatives à la conversion, à compléter avant l'OS. Convertir est désactivé tant que le libellé est vide.

### Traçabilité

**AC-7 — Devis ouvrable depuis sa liste.** Clic sur la ligne et sur le numéro → `/etudes/devis/{id}`. Aucune ligne morte.

**AC-8 — Chaîne source cliquable.** Étude convertie : devis et chantier. Devis approuvé : étude et chantier. Chantier issu d'un devis : étude et devis, numéro cliquable, identifiants du snapshot.

**AC-9 — `/etudes` ouvre le portefeuille Études.** Redirection `pathMatch: 'full'` vers `etudes/dossiers`.

### Catalogue

**AC-10 — Décision Catalogue persistée.** Pour chaque composant qui a été `LIBRE`, l'étude conserve : décision `POSTE_SEULEMENT | CREE_ET_LIE | RATTACHE_EXISTANT | IGNORE_MOTIF`, acteur, date, `itemId` si créé ou lié, lien Catalogue si item. Cette trace reste lisible après `GAGNE` et `CONVERTIE`.

### Portefeuilles et cockpit

**AC-11 — Une pagination par liste.** Études et Devis : une pagination serveur, en français, une seule taille de page.

**AC-12 — Chargement ≠ vide.** Pendant le fetch, état de chargement. Jamais « 0 chantier » / empty state avant la réponse. Erreur API ≠ liste vide.

**AC-13 — Pourcentages présentés.** Avancement et taux : au plus une décimale à l'affichage (`4.1846` → `4,2 %`). Le calcul interne ne change pas.

**AC-14 — Statut non dupliqué.** « Devis généré » apparaît une seule fois sur la fiche.

**AC-15 — Checklist : prérequis vs recommandé.** Un item non bloquant pour le stade courant (ex. planning sur `EN_COURS`) n'entre pas dans le ratio des prérequis. Afficher par exemple « 7/7 prérequis · planning recommandé ». Ne pas proposer l'OS s'il reste un bloquant (déjà tenu, à ne pas régresser).

### IA

**AC-16 — L'IA parle du dossier ouvert.** L'agent affiche numéro et objet courants. Actions contextuelles, pas un chat générique : contrôler le chiffrage, détecter les incohérences, proposer les rattachements catalogue. Chaque suggestion porte un état `acceptée | refusée | corrigée` visible. Pas de chatbot hors geste métier.

### Preuve

**AC-17 — Preuve Mode B.** Graphe créé par API sur `qa-local`. Scénarios ci-dessous. Captures desktop et 390 × 844. `node raster/t.mjs check` sans erreur.

---

## Hors périmètre

- Boucle DA → BC → BL magasin → consommation chantier (`matiere-et-magasin`, vague 2).
- Réception provisoire / définitive / PV / réserves comme chantier métier (autre chapitre).
- Exiger une situation, une DA ou un BL pour clore.
- Planning, activités, Gantt.
- Rouvrir tout `raffinement-etude` (AC déjà tenus : montants, OS, filtres).
- Course sur le numéro de dossier (SEKTOR-210, reste dans `raffinement-etude`).
- Approbation de SEKTOR-209 (gate humaine cockpit).

---

## Scénarios de preuve Mode B

| Scénario | Point discriminant | Couvre |
|---|---|---|
| `finition-gain-100pct-couts-refuse` | tous les postes sans déboursé établi | AC-1, AC-2, AC-3 |
| `finition-gain-warning-accepte-puis-conversion` | part de coûts estimés < 100 %, motif saisi | AC-2, AC-5, AC-6 |
| `finition-devis-clic-liste` | ligne et numéro ouvrent la fiche | AC-7, AC-9, AC-11 |
| `finition-chaine-cliquable` | étude ↔ devis ↔ chantier par id | AC-8 |
| `finition-catalogue-decision-libre` | un LIBRE créé et lié, un ignoré avec motif | AC-10 |
| `finition-portefeuille-chargement` | pas de faux 0 pendant le fetch | AC-12, AC-13 |
| `finition-checklist-planning-recommande` | chantier `EN_COURS` sans planning | AC-15 |
| `finition-ia-dossier-courant` | actions et journal sur le dossier ouvert | AC-16 |
| `finition-mobile-390` | conversion, liste devis, fiche chantier | AC-6, AC-7, AC-8 |
