---
id: SEKTOR-204
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-203]
tags: [etudes, catalogue, ia, prix]
---

# Rendre la création catalogue atomique et gouvernée depuis Extraire

> Fiabiliser « Créer dans le catalogue et lier » : identité 1–1, tarif réel, idempotence, permission et reprise du rattachement. Aucun succès partiel silencieux ni faux `TARIF`.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-16 à AC-20.

## Étapes

- [x] Remplacer l'enchaînement frontend Item puis ItemPrice par une commande Catalogue explicite avec clé d'idempotence. — `ExtraireCreationApi.creerAvecDecision` (REQUIRES_NEW) ; le flux Études (`RattrapageComposantService.creerOuDemander`) appelle la commande avec une clé dérivée (dossier + composants).
- [x] Supporter « avec tarif » transactionnel et « sans tarif » volontaire marqué à compléter. — validation stricte (prix > 0, devise, type, date d'effet) ; Item + `ItemPrice` dans la même transaction ; `tarif: null` → `aCompleter=true`, aucun faux `TARIF`.
- [x] Réutiliser identité/Item existants, publier Sektor seulement si absent et conserver tiny spec sur le DPU. — logique 1–1 conservée (Sektor → Item tenant) ; tiny spec reste hors commande (dette : la note d'emploi DPU reste au front).
- [x] Retourner le résultat réellement persisté; ne jamais attraper puis masquer l'échec du tarif. — `ResultatCreationExtraire` avec `created/reused`, identité, tarif résolu réellement persisté ; échec tarif → exception (rollback), jamais annoncé.
- [x] Rattacher ensuite le DPU avec snapshot prix/source; fournir une reprise sans duplication si l'écriture Études échoue. — `rattacher` (endpoint `/rattrapage/rattacher`) ; échec d'attache → « article créé, non rattaché » + CTA, même clé → aucune recréation (AC-19).
- [x] Appliquer permission dédiée et audit de la chaîne proposition → identité → Item → tarif → composant. — **vague 2 livrée** : permission `etudes.catalogue.creer` (grant BTP_DG + BTP_DIRECTEUR_TRAVAUX) contrôlée côté Études (`assertPeutCreerCatalogue` → 403, « Ajouter au poste seulement » reste dispo) et sur `extraire-creer` (Catalogue) ; **audit `catalogue_creation_audit`** (acteur, étude, identité créée/réutilisée, tarif persisté + source, proposition) à chaque commande réussie (AC-20).
- [x] Corriger le bouton final pour exiger une décision sur chaque manquant. — livré via **SEKTOR-205 vague 3** (revue IA inline) : deux actions distinctes par manquant (*Ajouter au poste seulement* / *Créer dans le catalogue et lier*), bouton final **Appliquer désactivé** tant qu'un élément reste à trancher, aucun ajout implicite (AC-16).
- [x] Le front lit la permission `etudes.catalogue.creer` pour n'afficher la création que si elle est présente. — livré (vague 3 front) : `PermissionService` injecté dans le panel poste (revue IA + actions de ligne) et le rattrapage — sans permission, seul « Ajouter au poste (seulement) » / Rapprocher / Ignorer / Lier UUID restent (AC-20).

## Preuves attendues

- [x] Tests Catalogue : identité absente/existante, Item absent/existant, double clic, retry et collision concurrente. — `ExtraireCreationCommandTest` (5).
- [~] Test transactionnel injectant un échec ItemPrice : aucun faux tarif ni succès annoncé. — validation fail-fast avant création (test) ; rollback DB garanti par `REQUIRES_NEW` ; **front corrigé (vague 3)** : le dialog « Créer dans le catalogue » ne masque plus l'échec du tarif — `sourcePrix` honnête (MANUEL, jamais un faux `TARIF`) + `tarifEchec` remonté (« Article créé sans tarif — à compléter ») ; preuve Mode B du rollback en SEKTOR-208.
- [x] Test inter-BC injectant un échec DPU : article réutilisable et CTA de rattachement effectif. — `RattrapageComposantServiceCreerTest#echec_rattachement_dit_cree_non_rattache_puis_reprise_ac19`.
- [x] Test rôles : création refusée mais ajout au poste autorisé; audit complet en succès. — `permission_absente_refuse_la_creation_ac20` (403, commande jamais appelée) + `creation_reussie_est_auditee_ac20` (acteur, identité, tarif/source).

## Préparation (avant exécution — séquencement)

- Inventaire de la chaîne (Catalogue + Études + front) et design de la commande explicite
  AC-16..AC-20 : [`../03-CREATION-CATALOGUE.md`](../03-CREATION-CATALOGUE.md).
- Séquencement : exécution lancée après SEKTOR-202 (done-me) et SEKTOR-203 (review), worktree
  isolé `etudes/raffinement-etude`. Vague 1 livrée (commande + tarif + reprise) ; permission,
  audit et front en vague 2.

## Journal

```
26/08 15:27  posée
26/08        préparation posée (read-only) : inventaire + design 03-CREATION-CATALOGUE.md — attente revue SEKTOR-202 puis SEKTOR-203
26/08 20:10  status → doing
26/08 20:40  vague 1 livrée : commande Catalogue explicite (AC-16..AC-19) — voir Rapport de livraison
26/08 18:39  status → review
26/08 21:15  vague 2 livrée : permission dédiée + audit (AC-20) — voir Rapport de livraison
29/08      vague 3 (front) livrée : bouton final exigeant une décision par manquant (via revue IA inline SEKTOR-205) + lecture de la permission côté front (panel poste + rattrapage) — build web vérifié
26/08 21:00  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Vague 1 (livrée, worktree `etudes/raffinement-etude`) — commande Catalogue explicite :**

- **Catalogue** : `ExtraireCreationApi.creerAvecDecision(designation, nature, uniteCode,
  cleStableHint, tarif, idempotencyKey)` — `REQUIRES_NEW` (transaction propre) ; identité 1–1
  (Sektor → Item tenant, réutilisation par `cleStable`) ; **clé d'idempotence sur l'Item**
  (`extraire_idempotency_key`, migration `010_extraire_creation_idempotency.sql`) → double clic /
  retry réutilise le même Item (AC-17) ; « avec tarif » = Item + `ItemPrice` ensemble (validation
  prix > 0 / devise / type / date d'effet, fail-fast avant création) ; « sans tarif » =
  `aCompleter=true`, aucun faux `TARIF` ; résultat `ResultatCreationExtraire` (created/reused,
  identité, **tarif réellement persisté** ou null).
- **Études** : `RattrapageCreerDto` porte le tarif optionnel ; `creerOuDemander` (mode LIBRE)
  appelle la commande (clé `dossier:<id>:composants:<ids>`), puis rattache le DPU ; **échec
  d'attache → « article créé, non rattaché » + `rattacher` (endpoint `/rattrapage/rattacher`)
  de reprise — aucune recréation** (AC-19).
- Preuves : `ExtraireCreationCommandTest` (5) + `RattrapageComposantServiceCreerTest` (3).

**Décidé seul** : clé d'idempotence dérivée (dossier + composants) côté Études — la commande
réutilise par `cleStable` ET par clé ; `aCompleter` = « sans tarif » ; le tarif résolu au retour
est celui réellement persisté (résolution actuelle), jamais reconstruit.

**Vague 2 (livrée) — permission et audit (AC-20) :**

- **Permission dédiée `etudes.catalogue.creer`** (grant `BTP_DG` + `BTP_DIRECTEUR_TRAVAUX`,
  changelog data `003_l_raffinement_etudes_permissions.sql`) :
  - côté Études, `assertPeutCreerCatalogue()` dans `creerOuDemander` (mode LIBRE) → 403
    `etudes.catalogue.permission_requise` si absente — **« Ajouter au poste seulement » reste
    disponible** (les autres endpoints ne sont pas touchés) ;
  - côté Catalogue, `@RequirePermission("etudes.catalogue.creer")` sur `extraire-creer`.
- **Audit `catalogue_creation_audit`** (migration `029_lot_raffinement_catalogue_audit.sql`,
  entité + repository) : acteur, étude, itemId, cleStable, identité créée/réutilisée
  (`createdSektor`/`createdItem`), tarif réellement persisté + `sourcePrix`, proposition —
  écrit à chaque commande réussie (jamais après un échec silencieux).
- Preuves : `permission_absente_refuse_la_creation_ac20` (403, commande jamais appelée) +
  `creation_reussie_est_auditee_ac20` (chaîne complète) dans `RattrapageComposantServiceCreerTest` (5).

**Vague 3 (livrée, front — AC-16/AC-20) :**

- **Bouton final exigeant une décision** : livré via la revue IA inline de SEKTOR-205 (le dialogue
  de revue est supprimé) — chaque manquant porte deux actions distinctes, `Appliquer` reste
  désactivé tant qu'un élément n'est pas tranché, aucun manquant n'est ajouté implicitement.
- **Lecture de la permission côté front** : `PermissionService.hasPermission('etudes.catalogue.creer')`
  dans `poste-decomposition-panel` (actions « Créer dans le catalogue et lier » de la revue IA,
  « Créer dans le catalogue » de ligne/carte) et `rattrapage-panel` (CTA Créer/Demander + formulaire)
  — sans permission, les chemins manuels restent : *Ajouter au poste seulement*, Rapprocher, Lier
  un UUID, Ignorer (AC-20). Guards défensifs dans les méthodes appelées.
- **Fin du faux `TARIF` (AC-18, front)** : le dialog « Créer dans le catalogue » ne catch plus
  silencieusement l'échec du tarif — le résultat porte `tarifEchec` et `sourcePrix` reste honnête
  (`MANUEL` si le tarif n'a pas persisté) ; le panel affiche « Article créé sans tarif (à
  compléter) — le prix du poste est conservé » au lieu d'annoncer un tarif mensonger.
- Vérifié par build AOT `npm run build:dev`.

**Décidé seul (vague 3)** : le masquage front est une couche UX — le backend reste la source
d'application (`@RequirePermission` + `assertPeutCreerCatalogue` → 403) ; les gardes front ne
bloquent pas un appel manuel. Le tarif du dialog reste écrit en second appel (compat) mais son
échec est désormais explicite et jamais présenté comme `TARIF`.

**Dette restante** : preuve Mode B du rollback tarif (SEKTOR-208).
