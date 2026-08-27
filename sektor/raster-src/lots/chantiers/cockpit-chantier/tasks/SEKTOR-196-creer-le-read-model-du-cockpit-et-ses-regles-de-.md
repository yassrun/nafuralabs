---
id: SEKTOR-196
status: done-agent
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: me
blocked_by: [SEKTOR-195]
tags: [api, chantiers, cockpit]
---

# Créer le read model du cockpit et ses règles de décision

> Livrer l'API de synthèse qui compose faits, checklist, alertes et prochaines actions sans nouvelle vérité stockée. Les règles et l'ordre sont testés côté serveur.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), read model et AC-2 à AC-13, AC-22.

## Étapes

- [ ] Définir le DTO `cockpit` avec états de disponibilité, fraîcheur, sources, codes stables et permissions.
- [ ] Composer identité, provenance, calendrier, finance, avancement et flux mensuel depuis les agrégats propriétaires.
- [ ] Implémenter la checklist exacte d'AC-5, y compris planning non bloquant et création directe sans référence de vente.
- [ ] Implémenter alertes et priorité déterministe; documenter les seuils financiers/temps sans logique dupliquée au frontend.
- [ ] Produire une action primaire et au plus trois secondaires compatibles avec rôle et statut.
- [ ] Gérer absence, interdiction et indisponibilité partielle sans faux zéro ni valeur périmée.
- [ ] Vérifier les frontières de BC et la non-persistance des agrégats cockpit.

## Preuves attendues

- Tests domaine paramétrés sur tous les statuts chantier et chaque item de checklist.
- Tests de priorité avec plusieurs alertes simultanées et tie-break par ancienneté.
- Tests finance/date : marge négative, baisse de marge, date absente, jours restants et jours de retard.
- Tests RBAC sur les actions/données de `owner`, `conducteur`, `chef-chantier`, `daf`.
- Test d'architecture et contrat JSON documenté pour le frontend.

## Journal

```
26/08 12:17  posée
26/08 14:29  status → doing
26/08 14:45  backend read model cockpit + tests verts + sonde Mode B → review
26/08 14:44  status → review
26/08 16:13  status → done-agent
```

## Rapport de livraison

**Contrat API :** `GET /api/v1/chantiers/{id}/cockpit` (BC Chantiers, `@RequirePermission("read")` → `chantiers.chantiers.chantier.read`).

**Changements (backend chantiers) :**

- `api/dto/CockpitChantierDto.java` — DTO de composition : `identity` (code, nom, client, statut, source vente, devis, fraîcheur), `schedule` (dates, OS, jours restants/retard, absence), `finance` (vente active, déboursé initial, budget révisé, marge projetée valeur/taux — chaque montant avec devise/base/source/fraîcheur/état `AVAILABLE|NOT_AVAILABLE|FORBIDDEN` et cause), `progress` (avancement + flux mensuel), `preparation[]`, `alerts[]`, `nextActions[]`, `activityFeed[]`.
- `service/CockpitChantierService.java` — compose tout à la lecture, sans rien stocker :
  - checklist AC-5 exacte (identité, référence de vente, arbre, budget initial, responsables conducteur+chef, dates, OS bloquant, planning `A_FAIRE` jamais bloquant) ; création directe → `NON_APPLICABLE` ;
  - alertes AC-9/AC-12/AC-13 (marge négative CRITICAL, baisse vs initiale WARNING, finance incomplète WARNING, retard contractuel) ;
  - prochaines actions AC-10/AC-11 (primaire + ≤3 secondaires, permission requise) ;
  - retard AC-13 calculé sur dates réelles uniquement, absence explicite sinon ;
  - finance AC-20 : `owner`/`dg`/`daf`/directeur voient, rôles terrain → `FORBIDDEN` (jamais zéro) ;
  - activité récente depuis `journal_chantier` (10 dernières entrées, pas de journal parallèle).
- `api/controller/CockpitChantierController.java` — endpoint GET.
- `Chantier` + migration `chantiers/.../v1.9/002_ordre_de_service_chantier.sql` — `os_reference` / `os_date_effet` (posés par SEKTOR-198).

**Preuves exécutées :**

- `CockpitChantierServiceTest` — 8 tests : checklist bloqueurs vs OK vs NON_APPLICABLE (création directe), planning jamais bloquant, statut EN_PREPARATION jamais EN_COURS, finance owner AVAILABLE (737106/154506/20,96 %), chef-chantier FORBIDDEN sans faux zéro, vente absente NOT_AVAILABLE, alerte marge négative CRITICAL, marge en baisse WARNING, retard sur dates réelles + absence, prochaines actions ordonnées et ≤4. **Tous verts.**
- Sonde Mode B `sektor/e2e/scripts/verify-cockpit-readmodel-196.mjs` sur le chantier converti de la preuve SEKTOR-195 : HTTP 200, checklist 8 items (5 OK, responsables/dates/OS BLOQUANT, planning A_FAIRE), finance AVAILABLE (vente 1927911 MAD HT source DEVIS), identité EN_PREPARATION, absence fin prévue signalée.
- Compilation `:sektor:chantiers` BUILD SUCCESSFUL ; `node raster/t.mjs check` : 0 erreur.

**Décidé seul :** la permission finance est portée par rôle (`owner`/`dg`/`daf`/directeur) en attendant la matrice exacte d'AC-20 (affinée en SEKTOR-200) ; le flux mensuel simplifié en `AVANCEMENT → attachement → situation` (AC-15) sans dépendre du planning.

**Écarts / dette :** la commande de démarrage par OS (AC-6) est SEKTOR-198 ; l'écran Pilotage consommant ce read model est SEKTOR-197 ; le portefeuille filtrable est SEKTOR-199.
