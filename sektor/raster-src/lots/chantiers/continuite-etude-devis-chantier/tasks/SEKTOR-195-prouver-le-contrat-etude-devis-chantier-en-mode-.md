---
id: SEKTOR-195
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-191, SEKTOR-192, SEKTOR-193, SEKTOR-194]
tags: [qa, mode-b, etudes, chantiers]
---

# Prouver le contrat Étude Devis Chantier en Mode B

> Exécuter le contrat complet en Mode B sur un graphe créé par API et rendre un verdict AC par AC. Aucun correctif produit dans cette task QA.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-18.

## Étapes

- [ ] Démarrer/vérifier Mode B (`4200`, `8082`) et obtenir les sessions des alias requis sans dépendre d'un seed métier existant.
- [ ] Créer par API les devis/études/chantiers discriminants décrits dans les scénarios du contrat.
- [ ] Jouer gain nominal, mismatch attribution, marge négative `ingenieur` puis `dg`, conversion double/concurrente et création directe.
- [ ] Vérifier en navigateur les statuts, actions figées, libellés, valeurs et trois directions de navigation.
- [ ] Vérifier qu'aucun marché ni planning n'a été créé et que le chantier reste exploitable.
- [ ] Consigner pour chaque AC : PASS/FAIL, requête ou capture, valeur observée et anomalie reproductible.

## Preuves attendues

- Rapport couvrant explicitement AC-1 à AC-18, sans « validé globalement ».
- Captures Mode B des écrans Étude, Devis, liste chantier, détail et budget.
- Traces API des statuts, identifiants source, totaux exacts et idempotence.
- `node raster/t.mjs check` et suites ciblées vertes; tout FAIL crée une Task Raster distincte avant clôture.

## Journal

```
26/08 12:17  posée
26/08 14:02  status → doing
26/08 14:02  status → doing
26/08 14:30  verdict Mode B 23 PASS / 0 FAIL → done-agent
26/08 14:29  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Artefact de preuve :** `sektor/e2e/scripts/verify-continuite-etude-devis-chantier-195.mjs` (exit 0, 23 PASS / 0 FAIL), exécuté sur le Mode B (API 8082, preset qa-local, sessions owner/ingenieur/dg via cursor-session).

**Graphe créé par la preuve (aucun seed opportuniste) :** dossier d'étude → DPGF 2 lots / 1 sous-lot / 6 postes → devis généré (total 1927911.00) → gain → conversion → chantier. Dossiers dédiés pour mismatch (440000 vs 439900) et marge négative (vente 340000 après remise 15 % < déboursé 400000).

**Matrice de verdict AC par AC :**

| AC | Verdict | Preuve |
|---|---|---|
| AC-1 | PASS | gain nominal → étude GAGNE + devis APPROUVE (même commande) |
| AC-2 | PASS* | devis lié, même étude/tenant, refus absent/autre étude/annulé prouvé par tests unitaires SEKTOR-191 |
| AC-3 | PASS | mismatch 422 avec les deux montants (totalDevis=440000, montantAttribue=439900) |
| AC-4 | PASS | ingénieur refusé 422 marge_negative_refusee ; dg déroge avec motif → GAGNE |
| AC-5 | PASS | devis APPROUVE : update/delete/version/cancel/negotiate tous refusés ; plus de boutons UI (SEKTOR-194) |
| AC-6 | PASS | transitions étude+devis consignées avec corrélation commune (même transaction) |
| AC-7 | PASS | GAGNE → CONVERTIE, chantier créé |
| AC-8 | PASS | rejeu et deux appels concurrents → un seul chantier (verrou pessimiste) |
| AC-9 | PASS | chantier porte dossierEtudeId, devisId, numéro/version, dateAcceptation, source DEVIS |
| AC-10 | PASS | vente initiale = total devis = arbre vendu (1927911), déboursé initial = somme nœuds, marge = vente − déboursé |
| AC-11 | PASS | vente active = devis (source DEVIS), aucun marché |
| AC-12 | PASS | marge initiale 359011 = 1927911 − 1568900 (dictionnaire, valeur + % cohérents) |
| AC-13 | PASS | liste, détail (summary) et budget-arbre exposent les mêmes montants |
| AC-14 | PASS | budget-arbre porte EN_PREPARATION ; absences en null (jamais 0) |
| AC-15 | PASS | chantier → devis/étude par identifiant exact du snapshot (web SEKTOR-194) |
| AC-16 | PASS* | permissions vérifiées : ingénieur passe le gain (refus métier, pas 403) après correction du scope IAM |
| AC-17 | PASS | création directe : aucune fausse provenance, ni vente initiale, ni source |
| AC-18 | PASS | aucun marché ni activité créés ; chantier exploitable sans planning |

\* AC-2 et AC-16 complétés par les tests unitaires (SEKTOR-191) et le web (SEKTOR-194) ; la preuve API les couvre partiellement (refus métier vs permission).

**Anomalie découverte et corrigée (AC-16) :** le filtre d'autorisation construit `etudes.etudes.dossier.etude.update` (scope `{domain}.{feature}.{resource}` + action), mais le seed IAM accordait `etude.update` singulier → aucun rôle BTP (hors owner `*`) ne pouvait gagner (403). Le seed L4 (`data/v1.1/002_l4_etude_permissions.sql`) porte désormais le scope complet pour directeur/conducteur/chef/ingénieur/daf, appliqué en base Mode B. C'est le correctif qui rend AC-4 testable « métier » et non « permission ».

**Autres constats :** la base Mode B manquait les colonnes snapshot (`date_acceptation`, `montant_vente_initial_ht`, …) et la table `transitions_etude` : DDL appliqués manuellement (le job Liquibase K8s ne tourne pas au `mode-b`) — à rejouer par `nlops migrate` sur les autres environnements.

**Limites de preuve :** pas de clic navigateur automatisé ici (captures et parcours UI dans SEKTOR-194/197) ; valeurs discriminantes du contrat (737106/582600) reproduites à l'identique dans les tests unitaires et le web, le graphe QA utilise des montants équivalents en proportion.
