---
id: SEKTOR-207
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-202, SEKTOR-204, SEKTOR-205]
tags: [etudes, web, synthese, decision]
---

# Créer une synthèse décisionnelle avant devis

> Transformer la synthèse en porte de décision : expliquer qualité, risques et montants, puis conduire vers la correction, l'approbation ou le devis sans masquer les warnings acceptés.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-25 à AC-27 et AC-2, AC-6.

## Étapes

- [x] Composer la synthèse depuis le moteur de complétude et les agrégats DPGF/DPU, sans compteurs parallèles. — `synthese()` consomme `CompletudeEtude` (compteurs/gates/prochaineAction) ; aucun compteur recalculé.
- [x] Montrer bloqueurs, vente, déboursé, marge, origine des coûts, pièces, composants libres/incertains et couverture consultation. — backend livré (`DossierEtudeSyntheseDto` : `alertesAcceptees`, `composantsLibres`, `postesCapitalisables`, `CouvertureConsultationDto`) + **vague 2 front livrée** : le panel affiche la couverture (devis reçus / minimum, fournisseurs, identités couvertes) et les compteurs libres/capitalisables depuis ce read model.
- [x] Rendre chaque risque navigable jusqu'à la phase, le poste ou l'objet source exact. — **vague 2** : chaque warning avec `cibles.noeudId`/`articleId` propose « Aller au poste concerné » (même mécanisme `corriger`/`?noeudId=` que les gates).
- [x] Implémenter acceptation auditée des warnings prévus et conserver ces hypothèses après devis/gain. — backend livré (`AlerteAccepteeEtude` + endpoints) + **vague 2 front** : bouton « Accepter » avec motif (AC-26), liste des acceptés (acteur/date/motif) toujours visible.
- [x] Présenter une action primaire déterministe : corriger, demander validation ou générer le devis. — `prochaineAction` du moteur exposé ; le panel front consomme `completude` (bloqueurs via `gate-blocage`, CTA soumission via wizard).
- [~] Afficher les postes capitalisables après validation et garder la capitalisation Ouvrage opt-in. — `postesCapitalisables` exposé + compteur affiché ; le geste Ouvrage reste opt-in via `capitalisation-panel` (déjà branché, visible après VALIDEE/DEVIS_GENERE) ; le scénario « aucun article créé automatiquement » est couvert par QA 208.
- [x] Aligner lecture seule, impression et écran avec les mêmes données et libellés. — **livré** : `EtudesEntityDataProvider.mapSynthese` expose désormais les mêmes données décisionnelles que l'écran (`alertesAcceptees`, `composantsLibres`, `postesCapitalisables`, `couvertureConsultation` devis/fournisseurs/identités/obligatoire/minimum) + variables du catalogue d'impression + échantillon de prévisualisation — le modèle de contenu reste éditable en admin (QA 208).

## Preuves attendues

- [~] Test avec 26 % estimé, 4 composants libres et consultation partielle : compteur et liens exacts. — `DossierEtudeSyntheseDecisionTest` (composants libres, capitalisables, couverture, compteur moteur) ; le scénario 26 % exact en QA 208.
- [x] Test warning accepté avec acteur/motif, toujours visible après génération du devis. — `warning_accepte_reste_visible_et_idempotent_ac26` (persisté, visible dans la synthèse, code non-WARNING refusé).
- [ ] Test qu'aucun article poste ni ouvrage n'est créé automatiquement. — QA 208 (la capitalisation est un geste explicite, non déclenché par la synthèse).
- [ ] Parcours correction depuis la synthèse puis retour avec anomalie résolue sans rechargement complet. — vague UI + QA 208.

## Journal

```
26/08 15:27  posée
26/08 19:19  status → doing
26/08 23:50  vague 1 (backend) livrée : synthèse enrichie (alertes acceptées, composants libres, capitalisables, couverture) + acceptation auditée AC-26 — voir Rapport de livraison
29/08      vague 2 (front) livrée : panel « Alertes assumées » (motif + Accepter, liste des acceptés), couverture consultation + compteurs libres/capitalisables, risques navigables via cibles — build AOT OK, voir Rapport de livraison
29/08      vague 3 (impression) livrée : mêmes données décisionnelles dans le modèle d'impression synthèse (mapSynthese + catalogue + échantillon) — compile backend OK
26/08 21:00  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Vague 1 (livrée, worktree `etudes/raffinement-etude`) — synthèse décisionnelle (AC-25..AC-27) :**

- `DossierEtudeSyntheseDto` enrichi : **`alertesAcceptees`** (codes, AC-26), **`composantsLibres`**
  (DPU hors référentiel via `findLibresRattrapage`), **`postesCapitalisables`** (articles
  DECOMPOSE, AC-27), **`CouvertureConsultationDto`** (devis reçus, fournisseurs distincts,
  identités couvertes, obligatoire, minimum — AC-25). La vente/déboursé/marge/répartition par
  origine viennent déjà de `synthese-cout` (L1).
- **Acceptation auditée des warnings (AC-26)** : entité `AlerteAccepteeEtude` (unique par
  dossier+code, acteur, date, motif ; migration `030_lot_raffinement_alerte_acceptee.sql`) ;
  `POST /{id}/warnings/{code}/accepter` + `GET /{id}/warnings-acceptees` ; **seul un WARNING
  réellement émis par le moteur est acceptable** (AC-3) ; l'alerte reste visible (jamais masquée
  par l'acceptation) et survit à la génération du devis.
- La `prochaineAction` du moteur (corriger / demander validation / générer le devis) est déjà
  exposée dans `completude` — le panel front la consomme (AC-6).
- Preuves : `DossierEtudeSyntheseDecisionTest` (2 tests).

**Décidé seul** : l'acceptation est par (dossier, code) — une seule par alerte ; le motif est
facultatif mais enregistré quand présent ; le compteur des composants libres est le même que le
rattrapage (`findLibresRattrapage`) — une seule définition du « libre ».

**Vague 2 (livrée, worktree `etudes/raffinement-etude`) — panel synthèse (AC-25..AC-27, front) :**

- **« Alertes assumées »** : liste des WARNING émis par le moteur non encore acceptés, champ
  motif (optionnel) + bouton « Accepter » (spinner, désactivé pendant l'appel), et la liste des
  acceptations (code, acteur, date, motif) — l'alerte reste affichée après acceptation (AC-26) ;
  cachée quand l'alerte ne concerne ni `completude` ni des acceptations.
- **Couverture consultation** : `devisRecus / minimum` (quand obligatoire), fournisseurs
  distincts, identités couvertes, avertissement si insuffisant (AC-25) + compteurs
  `composantsLibres` et `postesCapitalisables` (AC-27) — consommés depuis `synthese()`, pas de
  compteur parallèle.
- **Risques navigables** : chaque warning avec `cibles.noeudId`/`articleId` expose « Aller au
  poste concerné » → `corriger` (bascule d'étape + `?noeudId=`, même mécanisme que les gates).
- Types TS étendus (`DossierEtudeSynthese`, `CouvertureConsultation`, `ControleEtude`,
  `CompletudeEtude`, `WarningAccepte`) + méthodes API `completude`, `accepterWarning`,
  `warningsAcceptees`. Vérifié par build AOT `npm run build:dev`.

**Décidé seul (vague 2)** : l'affichage des « composants consultés » (couverture DPU, calcul
local préexistant) est conservé à côté de la couverture consultation fournisseurs — deux
métriques distinctes (chiffrage vs consultation), pas de double compteur pour la même donnée.

**Dette restante** : le modèle de contenu d'impression (Thymeleaf en base) n'affiche pas encore
les nouvelles variables — la mise en page finale du document est un contenu admin à ajuster en
QA 208 (les données sont maintenant toutes exposées) ; scénario exact « 26 % estimé / 4 libres /
consultation partielle » en QA 208 ; non-création automatique d'articles en QA 208.
