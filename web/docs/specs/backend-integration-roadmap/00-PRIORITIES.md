# Priorités & vagues d'exécution

> Plan de sprint pour finaliser **toute l'intégration backend** de l'ERP en **5 à 7 vagues** (3 à 5 sprints pour un senior full-stack, 2 à 3 sprints pour une petite équipe parallèle).
>
> Estimation totale alignée sur `migration_plan.md` : **93 à 132 j.h**.
>
> **Règle d'enchaînement :** une vague ne démarre que si **toutes** ses dépendances (vague(s) précédente(s)) sont au moins en `[~]` (contrats API stables).

---

## Wave 0 — Shared Foundation (`01-shared-foundation.md`)

| ID | Tâche | Effort | Précondition |
|---|---|---|---|
| B-FND-01 | Stabiliser `item` / `stock` / `currency` (contrats API alignés frontend) | 2-3 j.h | — |
| B-FND-02 | Créer domaine `partner` (clients + fournisseurs + MOA + sous-traitants) | 2-3 j.h | B-FND-01 |
| B-FND-03 | Endpoints `/lookup` standardisés sur toutes les références | 1-2 j.h | B-FND-01 |
| B-FND-04 | Enregistrer 8 nouveaux domaines dans `erp.application.json` | 1 j.h | — |
| B-FND-05 | Conventions multi-tenant + permissions ERP + roleTemplates | 2-3 j.h | B-FND-04 |

**Total estimé :** 8-12 j.h
**Outcome :** baseline stable qui prouve que l'intégration CRUD réelle fonctionne sur le socle existant + `partner` disponible pour Wave 2.

---

## Wave 1 — Inventory & Finance (`02-inventory.md`, `03-finance.md`)

| ID | Tâche | Effort | Précondition |
|---|---|---|---|
| **Inventory** | | | |
| B-INV-01 | Articles BTP + désinjection `InventoryMockService` | 2-3 j.h | Wave 0 |
| B-INV-02 | Dépôts (warehouses) | 1-2 j.h | Wave 0 |
| B-INV-03 | Stock balances (lookup + agrégat) | 1-2 j.h | B-INV-01, B-INV-02 |
| B-INV-04 | Mouvements stock + transition VALIDER | 3-4 j.h | B-INV-03 |
| B-INV-05 | Réservations stock chantier | 1-2 j.h | B-INV-04 |
| B-INV-06 | Magasin chantier digital (read model) | 1-2 j.h | B-INV-05 |
| B-INV-07 | Matériel & équipements | 1-2 j.h | B-INV-01 |
| **Finance** | | | |
| B-FIN-01 | Devises + taux change (purge doublons écrans) | 1-2 j.h | Wave 0 |
| B-FIN-02 | Conditions paiement + modes règlement | 1-2 j.h | B-FIN-01 |
| B-FIN-03 | Plan comptable + journaux | 2-3 j.h | B-FIN-01 |
| B-FIN-04 | Règlements clients + fournisseurs | 2-3 j.h | B-FIN-03 |
| B-FIN-05 | Lettrage écritures | 2 j.h | B-FIN-04 |
| B-FIN-06 | Rapprochement bancaire (import OFX/CSV) | 2-3 j.h | B-FIN-04 |
| B-FIN-07 | Effets de commerce + virements | 2 j.h | B-FIN-04 |
| B-FIN-08 | Caisses chantier | 1-2 j.h | B-FIN-04 |

**Total estimé :** 16-24 j.h
**Outcome :** modules Inventory + Finance hors mock — déblocage de la chaîne Achats/Ventes (qui dépendent de `item`, `currency`, `partner`).

---

## Wave 2 — Commerce (`04-achats.md`, `05-ventes.md`)

| ID | Tâche | Effort | Précondition |
|---|---|---|---|
| **Achats** | | | |
| B-ACH-01 | Demandes d'achat + transitions | 2-3 j.h | Wave 0 + Wave 1 |
| B-ACH-02 | Appels d'offres achat + offres fournisseurs | 3-4 j.h | B-ACH-01 |
| B-ACH-03 | Bons de commande achat + lignes + réceptions | 3-4 j.h | B-ACH-02 |
| B-ACH-04 | Contrats fournisseurs + Art. 187 | 2-3 j.h | B-ACH-03 |
| B-ACH-05 | Catalogue articles fournisseur | 1-2 j.h | B-ACH-03 |
| B-ACH-06 | Attestations légales (workflow validité) | 1-2 j.h | B-ACH-04 |
| B-ACH-07 | 3-way matching BC ↔ BL ↔ FF | 2-3 j.h | B-ACH-03 + Finance |
| **Ventes** | | | |
| B-VEN-01 | Clients (segment + agrément MOA) | 1-2 j.h | Wave 0 |
| B-VEN-02 | Offres commerciales + transitions | 2-3 j.h | B-VEN-01 |
| B-VEN-03 | Bons de commande clients | 2-3 j.h | B-VEN-02 |
| B-VEN-04 | Factures clients (HT/TVA/TTC/RG/RAS server-side) | 3-4 j.h | B-VEN-03 + Finance |
| B-VEN-05 | Avoirs | 1-2 j.h | B-VEN-04 |
| B-VEN-06 | Retenues de garantie | 1-2 j.h | B-VEN-04 |

**Total estimé :** 22-31 j.h
**Outcome :** Achats + Ventes en API réelle. `AchatsMockService` et `VentesMockService` désinjectés.

---

## Wave 3 — Projets (`06-chantiers.md`, `07-etudes.md`)

| ID | Tâche | Effort | Précondition |
|---|---|---|---|
| **Chantiers** | | | |
| B-CHA-01 | Aggregate `Chantier` (CRUD + status) | 3-4 j.h | Wave 0 + Wave 2 |
| B-CHA-02 | Lots / phases / postes budgétaires | 2-3 j.h | B-CHA-01 |
| B-CHA-03 | Budget chantier (prévi / révisé / réalisé) | 2-3 j.h | B-CHA-02 |
| B-CHA-04 | Avancements physiques | 2 j.h | B-CHA-02 |
| B-CHA-05 | Situations + génération depuis avancements | 2-3 j.h | B-CHA-04 + Ventes |
| B-CHA-06 | Sous-traitance chantier | 1-2 j.h | B-CHA-01 + Achats |
| B-CHA-07 | Documents + journal + attachements | 1-2 j.h | B-CHA-01 |
| B-CHA-08 | Photos géolocalisées | 1 j.h | B-CHA-01 |
| B-CHA-09 | Read model `ChantierSummary` | 1-2 j.h | B-CHA-03 + B-CHA-04 |
| B-CHA-10 | Désinjection `ChantiersMockService` (pages listing/detail) | 1-2 j.h | B-CHA-01 |
| **Études** | | | |
| B-ETU-01 | Bibliothèque prix + ouvrages | 2 j.h | Wave 0 |
| B-ETU-02 | Métrés | 1-2 j.h | B-ETU-01 |
| B-ETU-03 | DPGF (LOT > SOUS_LOT > ARTICLE) | 2-3 j.h | B-ETU-02 |
| B-ETU-04 | DPU + composants | 2 j.h | B-ETU-01 |
| B-ETU-05 | Appels d'offres clients | 1-2 j.h | B-ETU-03 |
| B-ETU-06 | Devis (génération DPGF, versioning, calculs) | 2-3 j.h | B-ETU-03 + B-ETU-04 |

**Total estimé :** 27-36 j.h
**Outcome :** chantiers + études en API réelle. Le pivot ERP est fonctionnel sans mock.

---

## Wave 4 — Personnes & conformité (`08-rh.md`, `09-hse.md`)

| ID | Tâche | Effort | Précondition |
|---|---|---|---|
| **RH** | | | |
| B-RH-01 | Employés (CNSS, AMO, IF, contrat) | 1-2 j.h | Wave 0 |
| B-RH-02 | Pointage chantier (batch + multi-pointage) | 3-4 j.h | B-RH-01 + Chantiers |
| B-RH-03 | Congés (solde + workflow) | 1-2 j.h | B-RH-01 |
| B-RH-04 | Planning équipes (read model) | 1-2 j.h | B-RH-02 |
| B-RH-05 | Fiches de paie | 2-3 j.h | B-RH-01 |
| B-RH-06 | Heures supplémentaires | 1-2 j.h | B-RH-02 + B-RH-05 |
| B-RH-07 | Frais déplacement | 1 j.h | B-RH-01 |
| B-RH-08 | Contrats + habilitations | 1-2 j.h | B-RH-01 |
| **HSE** | | | |
| B-HSE-01 | Incidents + CNSS DAT | 2-3 j.h | Chantiers + RH |
| B-HSE-02 | Non-conformités + CAPA | 1-2 j.h | B-HSE-01 |
| B-HSE-03 | Inspections + audits | 1-2 j.h | Chantiers |
| B-HSE-04 | Formations HSE | 1 j.h | RH |
| B-HSE-05 | EPI dotation | 1 j.h | RH + Inventory |
| B-HSE-06 | PPSPS + PHS | 1-2 j.h | Chantiers |
| B-HSE-07 | Visites médicales | 1 j.h | RH |
| B-HSE-08 | Registres légaux | 1 j.h | Chantiers |
| B-HSE-09 | DUER | 1 j.h | Chantiers |
| B-HSE-10 | Read model `HseKpi` | 1-2 j.h | B-HSE-01 |

**Total estimé :** 16-24 j.h
**Outcome :** RH + HSE en API réelle. `RhMockService`, `PointageMockService`, `HseMockService`, `HseExtendedMockService` désinjectés.

---

## Wave 5 — Contrats & agrégats (`10-marches.md`, `11-approbations.md`, `12-dashboard-analytics.md`)

| ID | Tâche | Effort | Précondition |
|---|---|---|---|
| **Marchés** | | | |
| B-MAR-01 | Contrats marché (master + BPU) | 2-3 j.h | Ventes + Chantiers |
| B-MAR-02 | Avenants (workflow + propagation) | 2 j.h | B-MAR-01 |
| B-MAR-03 | Cautions bancaires | 1-2 j.h | B-MAR-01 |
| B-MAR-04 | Factures marché + DGD | 2-3 j.h | B-MAR-01 + Ventes |
| B-MAR-05 | Révisions prix (K) | 1-2 j.h | B-MAR-01 |
| B-MAR-06 | Pénalités | 1 j.h | B-MAR-01 |
| B-MAR-07 | Ordres de service | 1 j.h | B-MAR-01 |
| B-MAR-08 | Réceptions provisoire / définitive | 1-2 j.h | Chantiers |
| **Approbations** | | | |
| B-APR-01 | Approval workflow engine | 3-4 j.h | Wave 0 |
| B-APR-02 | Approval request + events + hash chain | 2-3 j.h | B-APR-01 |
| B-APR-03 | Délégation + escalade SLA | 1-2 j.h | B-APR-02 |
| B-APR-04 | Matrice pouvoirs | 1-2 j.h | B-APR-02 |
| **Dashboard / Analytics / Pilotage** | | | |
| B-DSH-01 | Read model `DashboardKpi` | 2-3 j.h | Toutes Waves précédentes |
| B-DSH-02 | Read model `AnalyticsBucket` (multi-axes) | 2-3 j.h | Toutes Waves précédentes |
| B-DSH-03 | Read model `CashFlowProjection` (dynamique) | 2-3 j.h | Finance + Chantiers + Ventes |

**Total estimé :** 20-29 j.h
**Outcome :** plus aucun mock injecté nulle part dans l'ERP. Les pages `dashboard`, `analytics`, `pilotage`, `pilotage-analyses` consomment des read endpoints réels.

---

## Tableau d'orchestration sprint par sprint

> Hypothèse : 1 sprint = 2 semaines, 1 dev senior full-stack = 8 j.h/sprint utiles + 1 dev junior = 6 j.h/sprint.

| Sprint | Wave | Modules visés | Notes |
|---|---|---|---|
| **S1** | 0 | shared foundation (B-FND-01 → 05) | démarrage seul (pas de parallèle utile) |
| **S2** | 1 | Inventory (B-INV-01 → 04) + Finance (B-FIN-01 → 03) | parallèle senior=Inventory / junior=Finance |
| **S3** | 1 fin + 2 démarrage | Inventory (05→07) + Finance (04→08) + Achats (B-ACH-01 → 02) | parallèle |
| **S4** | 2 | Achats (B-ACH-03 → 07) + Ventes (B-VEN-01 → 02) | parallèle |
| **S5** | 2 fin + 3 démarrage | Ventes (B-VEN-03 → 06) + Chantiers (B-CHA-01 → 02) + Études (B-ETU-01 → 02) | parallèle |
| **S6** | 3 | Chantiers (B-CHA-03 → 10) + Études (B-ETU-03 → 06) | parallèle |
| **S7** | 4 | RH (B-RH-01 → 08) + HSE (B-HSE-01 → 05) | parallèle |
| **S8** | 4 fin + 5 démarrage | HSE (B-HSE-06 → 10) + Marchés (B-MAR-01 → 03) + Approbations (B-APR-01 → 02) | parallèle |
| **S9** | 5 | Marchés (B-MAR-04 → 08) + Approbations (B-APR-03 → 04) + Dashboard (B-DSH-01) | parallèle |
| **S10** | 5 fin | Dashboard (B-DSH-02 → 03) + cleanup mocks + e2e full | hardening |

---

## Risques de planning

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Wave 0 (foundation) sous-estimée → cascade sur tout le reste | Moyenne | Élevé | Bloquer S1 sur foundation seule, pas de parallèle ; valider contrat API avec 1 page frontend Class A (items) |
| `partner` mal modélisé → re-travail Achats + Ventes + Chantiers | Élevée | Très élevé | Decision validée en Wave 0 (cf. `04-achats.md` § Decision points) : 1 entité `Partner` avec rôles multiples (CLIENT, FOURNISSEUR, MOA, ST) |
| Calculs server-side complexes (DGD, K, lettrage) → débordement Wave 5 | Moyenne | Moyen | Maintenir la version frontend en parallèle en lecture seule pendant 1 sprint après livraison API |
| Désinjection mock incomplète → état hybride qui casse les facades | Élevée | Élevé | Règle stricte : pas de `[x]` tant qu'un `grep MockService` retourne du contenu dans le module |
| Approbations bloque toutes les transitions de Wave 2-3-4 | Moyenne | Élevé | Phase 1 : transitions de statut directes (sans approval engine). Phase 2 : brancher l'engine. Pas de blocage. |

---

## Mise à jour

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-05-13 | — | Création — 78 tâches en 6 vagues sur 10 sprints. |
