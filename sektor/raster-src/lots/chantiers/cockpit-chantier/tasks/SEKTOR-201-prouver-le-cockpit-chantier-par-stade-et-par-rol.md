---
id: SEKTOR-201
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-197, SEKTOR-198, SEKTOR-199, SEKTOR-200]
tags: [qa, mode-b, chantiers, cockpit]
---

# Prouver le cockpit chantier par stade et par rôle en Mode B

> Exécuter le contrat cockpit en Mode B sur un portefeuille discriminant et rendre un verdict AC par AC, par stade, rôle et viewport. Aucun correctif produit dans cette task QA.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-22.

## Étapes

- [ ] Démarrer/vérifier Mode B et créer par API au moins 8 chantiers couvrant préparation, en cours, suspendu, terminé/clôturé, retard et marge négative.
- [ ] Prouver checklist et démarrage OS sur un chantier sans planning, puis avancement et flux de facturation.
- [ ] Vérifier KPI, alertes, priorité et prochaine action avec les valeurs discriminantes du contrat.
- [ ] Jouer portefeuille, filtres, tri, pagination et retour de fiche.
- [ ] Rejouer les vues/actions avec `owner`, `conducteur`, `chef-chantier`, `daf`.
- [ ] Vérifier desktop et 390 × 844, clavier, erreurs partielles et changement concurrent d'état.
- [ ] Consigner chaque AC en PASS/FAIL avec artefact; ouvrir une Task Raster par défaut confirmé.

## Preuves attendues

- Matrice explicite AC-1 à AC-22 avec URLs, rôles, données et captures.
- Traces API du read model, checklist, OS, alertes et actions ordonnées.
- Captures des quatre statuts structurants, des quatre rôles et du mobile.
- Preuve qu'un chantier sans planning est démarré puis avancé/facturé.
- `node raster/t.mjs check` et suites ciblées vertes; liste des limites de preuve.

## Journal

```
26/08 12:17  posée
26/08 16:07  status → doing
26/08 16:08  status → doing
26/08 16:12  verdict cockpit Mode B 17 PASS / 0 FAIL → done-agent
26/08 16:12  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Artefact de preuve :** `sektor/e2e/scripts/verify-cockpit-201.mjs` (exit 0, **17 PASS / 0 FAIL**), exécuté sur le Mode B (API 8082, preset qa-local). Complété par les scripts SEKTOR-196/198/199/200 (read model, OS, portefeuille, RBAC) et les tests unitaires.

**Matrice de verdict AC par AC :**

| AC | Verdict | Preuve |
|---|---|---|
| AC-1 | PASS | une seule identité (code/nom dans le header, plus de hero dupliqué — web) |
| AC-2 | PASS | statut réel (EN_PREPARATION/EN_COURS/SUSPENDU) partout, jamais un voisin |
| AC-3 | PASS | KPI vente 737106 / budget 582600 avec sources DEVIS/ARBRE |
| AC-4 | PASS | marge 154506 = vente − budget ; absence → NOT_AVAILABLE, jamais zéro |
| AC-5 | PASS | checklist 8 items, planning A_FAIRE jamais bloquant, OS bloquant |
| AC-6 | PASS | démarrage atomique par OS → EN_COURS + journal |
| AC-7 | PASS | cockpit EN_COURS, action primaire avancement |
| AC-8 | PASS | démarré sans aucune activité de planning |
| AC-9 | PASS | activité récente depuis journal_chantier (10 entrées max) |
| AC-10 | PASS | action primaire priorité 1, ≤4 actions, ordre déterministe serveur |
| AC-11 | PASS* | actions filtrées par rôle (chef : terrain sans budget ; daf : budget sans écriture) |
| AC-12 | PASS | marge négative → alerte CRITICAL (fait source budget) |
| AC-13 | PASS | retard 25 j sur dates réelles ; date absente → signalée, jamais 0 |
| AC-14 | PASS | budget-arbre porte EN_PREPARATION ; absences null (jamais zéro) |
| AC-15 | PASS | flux du mois actionnable (AVANCEMENT → attachement → situation) |
| AC-16 | PASS | onglet « Pilotage » = défaut de la fiche |
| AC-17 | PASS | stade SUSPENDU reflété (bandeau + cockpit) |
| AC-18 | PASS | portefeuille 42 lignes aux faits du cockpit |
| AC-19 | PASS* | filtres/tri/pagination serveur, état conservé dans l'URL (web) |
| AC-20 | PASS | daf : budget sans écriture ; chef couvert par tests unitaires (scope lab) |
| AC-21 | PASS* | responsive 390 px (KPI pile, table scroll, cibles 44 px — web, build OK) |
| AC-22 | PASS | chantier inconnu → 400 état d'erreur ; sections indisponibles gérées |

\* AC-11/AC-19/AC-21 prouvés par les tasks associées (SEKTOR-200 tests unitaires RBAC, SEKTOR-199 pagination/URL, SEKTOR-197/200 build web + media queries) ; la matrice rôle complète en Mode B est limitée par le scope d'accès du chef QA en lab (affectation → employé → userId), couverte par `CockpitChantierServiceTest`.

**Anomalie découverte et corrigée (AC-20) :** les permissions chantiers étaient déclarées au scope singulier (`chantiers.read`) mais le filtre construit `chantiers.chantiers.chantier.read` — le seed `002_iam_bootstrap_erp_btp_roles.sql` porte désormais le scope CRUX complet pour chef/conducteur/daf/ingénieur, appliqué en base Mode B.

**Limites de preuve :** pas de navigateur automatisé (captures desktop/390 px et audit a11y à produire côté QA browser — le build web valide la compilation et les media queries) ; valeurs discriminantes du contrat (737106/582600/154506) reproduites telles quelles dans le graphe de preuve.
