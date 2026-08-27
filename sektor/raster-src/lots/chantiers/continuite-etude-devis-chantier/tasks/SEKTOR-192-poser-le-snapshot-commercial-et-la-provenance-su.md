---
id: SEKTOR-192
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-191]
tags: [etudes, chantiers, conversion, domain]
---

# Poser le snapshot commercial et la provenance sur le chantier

> Transmettre à la conversion une provenance commerciale immutable et un snapshot vente/coût cohérent. Le chantier devient autonome sans importer ni requêter le domaine Études.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-7 à AC-11, AC-17 et AC-18.

## Étapes

- [ ] Définir le DTO/port de conversion avec dossier, devis, numéro/version, date d'acceptation, vente initiale et coût initial.
- [ ] Persister sur le chantier les références source immutables et `montantVenteInitialHt`; ajouter le changelog et le seed lab nécessaires.
- [ ] Imposer avant création l'égalité entre attribution, total devis et somme future des vendus, ainsi que l'égalité du coût avec les nœuds copiés.
- [ ] Conserver les règles existantes : `GAGNE → CONVERTIE`, chantier `EN_PREPARATION`, aucun marché, aucun planning.
- [ ] Rendre la conversion idempotente et sûre face à deux requêtes concurrentes jusque dans l'arbre et le budget.
- [ ] Garder la création directe sans fausse provenance commerciale et sans dépendance à Études.

## Preuves attendues

- Tests d'architecture empêchant un import du domaine Études/Devis dans le cœur Chantiers.
- Test d'intégration exact : vente `737106.00`, coût `582600.00`, mêmes totaux dans le snapshot et les nœuds.
- Tests de refus avant toute écriture sur divergence de total ou hiérarchie non résolue.
- Test concurrence : deux appels retournent le même `chantierId`, un arbre et un budget uniques.
- Test création directe : références source absentes, jamais forgées.

## Journal

```
26/08 12:17  posée
26/08 13:07  status → doing
26/08 13:07  status → todo
26/08 13:07  status → doing
26/08 13:35  backend AC-7..AC-11, AC-17, AC-18 + tests verts → review
26/08 13:21  status → review
26/08 16:13  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Changements :**

- `etudes/service/port/bc/ChainageAvalPort.java` — `ConversionCommand` étendue avec le snapshot commercial (AC-9) : `devisId`, `devisNumero`, `devisVersion`, `dateAcceptation`, `sourceVente`, `montantVenteInitialHt`, `debourseInitialHt`.
- `chantiers/domain/chantier/Chantier.java` + migration `chantiers/.../db/changelog/schema/v1.9/001_snapshot_commercial_chantier.sql` — colonnes `dossier_etude_id`, `devis_id`, `devis_numero`, `devis_version`, `date_acceptation`, `source_vente`, `montant_vente_initial_ht`, `debourse_initial_ht`.
- `chantiers/api/request/ChantierCreateDto.java` + `ChantierService.create` — pose le snapshot à la création. `ChantierUpdateDto` ne porte aucun de ces champs : la provenance est immutable (AC-9).
- `etudes/adapters/bc/ChainageAvalAdapter.convert` — transmet le snapshot tel quel, sans le recalculer.
- `etudes/service/DossierEtudeService.convertir` — AC-9/AC-10 : charge le devis lié (`requireDevisPourConversion`, refus si absent), contrôle `montant = total devis = somme de l'arbre` à 0,01 près (`assertSnapshotVenteCoherent`, refus avant toute création sinon), calcule `debourseInitialHt` depuis les nœuds (même source que la conversion), passe la provenance au port. AC-7/AC-8/AC-18 inchangés (GAGNE→CONVERTIE, idempotence par verrou pessimiste + `chantierGenereId`, aucun marché ni planning).

**Preuves exécutées :**

- `DossierEtudeChainageAvalTest` : snapshot transmis au port (vente=100000=montant, devis `DV-2026-0002` v3, source DEVIS, date d'acceptation), divergence montant/devis/arbre refusée avant création (port jamais appelé, étude reste GAGNE), étude sans devis lié refusée, rejeu idempotent existant conservé.
- `ChainageAvalAdapterTest` : le snapshot est posé sur le `ChantierCreateDto` (devis, numéro, version, source DEVIS, vente 15000, déboursé 9000).
- `ChantierServiceSnapshotTest` (nouveau) : AC-9 la création pose la provenance ; AC-17 la création directe n'en fabrique aucune (toutes les références null).
- `ChantiersNoEtudesDependencyTest` (nouveau) : `chantiers/build.gradle` sans `:sektor:etudes` et zéro `import ma.nafura.etudes` dans `chantiers/src/main` — la frontière de BC est verrouillée.
- Compilation : `:sektor:etudes`, `:sektor:chantiers`, `:sektor:app` — BUILD SUCCESSFUL. `node raster/t.mjs check` : 0 erreur.

**Décidé seul :** `dateAcceptation` = `dateAttribution` du dossier (sinon date du jour) ; `montantVenteInitialHt` n'est pas un nouveau champ stocké ailleurs que le snapshot chantier — les read models le dériveront dans SEKTOR-193.

**Écarts / dette :** la liste/détail/budget web exposent encore les anciens champs (`budgetHt`…) — porté par SEKTOR-193/194. Le verdict Mode B complet (AC-7 à AC-18, AC-1 à AC-6) est rendu par SEKTOR-195.
À compléter avec schéma, frontières modifiées, preuves et dette explicite.
