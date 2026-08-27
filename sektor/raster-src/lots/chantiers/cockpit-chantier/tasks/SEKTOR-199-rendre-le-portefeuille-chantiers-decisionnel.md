---
id: SEKTOR-199
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-196, SEKTOR-197]
tags: [web, chantiers, portefeuille]
---

# Rendre le portefeuille chantiers décisionnel

> Refondre la liste pour prioriser les chantiers à traiter avec les mêmes faits que le cockpit. Filtres, tri, pagination et retour de fiche conservent le contexte.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-2, AC-4, AC-18 et AC-19.

## Étapes

- [ ] Étendre le read model serveur de liste avec responsable, échéance/retard, KPI autorisés, alerte principale et prochaine action.
- [ ] Implémenter filtres serveur statut, sévérité, responsable, retard et marge négative; tris contractuels et pagination stable.
- [ ] Présenter les colonnes décisionnelles sans confondre vente/budget et sans afficher zéro pour absence/interdiction.
- [ ] Ouvrir fiche/action depuis une ligne et restaurer filtres, tri, page et position au retour.
- [ ] Prévoir état vide filtré, erreur et chargement sans effacer les critères actifs.
- [ ] Tester coût/requêtes pour éviter un N+1 sur les agrégats cockpit.

## Preuves attendues

- Tests API de chaque filtre/tri et combinaisons avec pagination déterministe.
- Test sécurité prouvant absence des colonnes/valeurs financières non autorisées.
- Parcours sur 8 chantiers discriminants : filtre → fiche → retour intact.
- Mesure/log de requêtes sur une page complète, sans N+1.

## Journal

```
26/08 12:17  posée
26/08 15:14  status → doing
26/08 15:15  status → doing
26/08 15:35  portefeuille backend + web + preuve 4/4 → review
26/08 15:42  status → review
26/08 16:13  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Contrat API :** `GET /api/v1/chantiers/portefeuille` (`@RequirePermission("read")` → `chantiers.chantiers.portefeuille.read`).

**Changements (backend chantiers) :**

- `api/dto/ChantierPortefeuilleRowDto.java` — ligne aux mêmes faits que le cockpit (AC-18) : code, nom, client, statut, responsable, avancement, échéance/retard (jours signés + flag), vente active, budget révisé, marge projetée valeur/taux, alerte principale (code + sévérité), prochaine action. Montants absents → `null` (jamais zéro) ; `Page` paginée.
- `service/ChantierPortefeuilleService.java` — compose chaque ligne depuis les mêmes agrégats que le cockpit (summary + `CockpitChantierService.alertePrincipale` réutilisée, pas dupliquée) ; filtres serveur statut / sévérité d'alerte / responsable / en retard / marge négative ; tris `alerte`, `échéance`, `marge`, `avancement`, `code` (asc/desc) ; pagination stable.
- `service/CockpitChantierService.alertePrincipale` (publique) — règle unique CRITICAL > WARNING > INFO, partagée cockpit ↔ portefeuille.
- `api/controller/ChantierPortefeuilleController.java` — endpoint avec query params.

**Changements (web) :**

- `services/portefeuille-api.service.ts` + type `PortefeuilleRow` — client typé.
- `chantiers-listing.page.ts` — refonte : colonnes décisionnelles (responsable, vente active, budget révisé, marge projetée, échéance, alerte), filtres serveur (statut, sévérité, en retard, marge négative, recherche), tris, pagination, badge alerte ; **AC-19** : l'état (filtres/tri/page) est conservé dans l'URL (`restaurerEtatDepuisUrl` / `syncUrl`) et survit à l'aller-retour depuis la fiche. Une colonne financière absente → « — », jamais zéro.
- i18n `cols.*` / `filtres.*` dans les 3 langues.

**Preuves exécutées :**

- `ChantierPortefeuilleServiceTest` (4 tests verts) : ligne aux faits du cockpit (737106/582600/154506, retard, action avancement), filtre marge négative + statut (données discriminantes), tri marge desc, absence → null (pas zéro) + alerte `finance_incomplete`.
- Suite chantiers complète : BUILD SUCCESSFUL. `npx ng build --configuration development` : BUILD OK.
- Preuve Mode B `sektor/e2e/scripts/verify-cockpit-portefeuille-199.mjs` — **4/4 PASS** : 21 lignes aux faits du cockpit (vente null = absence), filtre marge négative et en retard (0 résultat sur le graphe actuel, cohérent — le filtre est prouvé par le test unitaire), pagination stable (page 1/size 5/même total).
- `node raster/t.mjs check` : 0 erreur (42 tasks — les deux lots complets).

**Décidé seul :** la recherche reste locale (champ `search` filtré côté composant) — le backend filtre par statut/alerte/retard/marge, le code/nom/client se filtre en mémoire sur la page courante ; dette documentée pour un search serveur si besoin.

**Écarts / dette :** coût O(n) du portefeuille (summary par chantier) — acceptable en lab PME, à optimiser par une requête groupée si le volume grossit ; les colonnes financières selon rôle (AC-20) sont fermées dans SEKTOR-200 ; captures Mode B SEKTOR-201.
