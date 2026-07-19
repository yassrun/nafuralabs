# Inventaire des mocks à éliminer

> Recensement exhaustif (snapshot **2026-05-13**) de tous les `*MockService` et de tous les fichiers (`page.ts`, `facade.ts`, `api.service.ts`, `component.ts`) qui les injectent.
>
> **Objectif :** chaque module doit terminer la migration avec **zéro résultat** sur :
>
> ```bash
> grep -rE "inject\((\w+MockService)\)" web/app/applications/erp/<module>/ web/app/applications/erp/pages/<module>/
> ```

---

## 1. Services mock à retirer

| Service mock | Dossier | Module backend cible |
|---|---|---|
| `AchatsMockService` | `web/app/applications/erp/achats/mock/` | `backend/domains/achats` |
| `VentesMockService` | `web/app/applications/erp/ventes/mock/` | `backend/domains/ventes` |
| `ChantiersMockService` | `web/app/applications/erp/chantiers/mock/` | `backend/domains/chantiers` |
| `EtudesMockService` | `web/app/applications/erp/etudes/mock/` | `backend/domains/etudes` |
| `RhMockService` | `web/app/applications/erp/rh/mock/` | `backend/domains/rh` |
| `PointageMockService` | `web/app/applications/erp/pages/rh/pointage/services/` | `backend/domains/rh` (pointage batch) |
| `HseMockService` | `web/app/applications/erp/hse/mock/` | `backend/domains/hse` |
| `HseExtendedMockService` | `web/app/applications/erp/pages/hse/services/` | `backend/domains/hse` (extensions) |
| `MarchesMockService` | `web/app/applications/erp/pages/marches/services/` | `backend/domains/marches` |
| `InventoryMockService` | `web/app/applications/erp/inventory/mock/` | `backend/domains/{item,stock}` (+ enrichissements) |
| `MaterielGmaoMockService` | `web/app/applications/erp/inventory/mock/` | `backend/domains/stock` (matériel) |
| `FinanceConfigMockService` | `web/app/applications/erp/finance/mock/` | `backend/domains/currency` (+ finance config) |
| `FinanceComptabiliteMockService` | `web/app/applications/erp/finance/mock/` | `backend/domains/finance` (à créer) |
| `FinanceTresorerieMockService` | `web/app/applications/erp/finance/mock/` | `backend/domains/finance` (trésorerie) |
| `FinanceRound2MockService` | `web/app/applications/erp/finance/mock/` | `backend/domains/finance` (round 2 extensions) |
| `ApprobationsMockService` | `web/app/applications/erp/pages/approbations/services/` | `backend/domains/approbations` |
| `AttachementMockService` | `web/app/applications/erp/pages/chantiers/attachements/` | `backend/domains/chantiers` (attachements) |
| `AvancementMockService` | `web/app/applications/erp/pages/chantiers/avancements/services/` | `backend/domains/chantiers` (avancements) |
| `DocumentsMockService` | `web/app/applications/erp/pages/chantiers/documents/services/` | `backend/domains/chantiers` (documents) |
| `SousTraitanceMockService` | `web/app/applications/erp/pages/chantiers/sous-traitance/services/` | `backend/domains/chantiers` (sous-traitance) |
| `PlanningMockFacade` | `web/app/applications/erp/pages/chantiers/planning/services/` | `backend/domains/chantiers` (planning) |
| `RetenuesGarantieMockFacade` | `web/app/applications/erp/pages/ventes/retenues-garantie/` | `backend/domains/ventes` (RG) |

**Total :** 22 mock services à supprimer une fois leur module migré.

---

## 2. Cartographie injecteurs → module

Cette section liste, par module backend, **tous** les fichiers frontend à nettoyer.

### 2.1 Achats — module `backend/domains/achats`

```
web/app/applications/erp/achats/services/matching.service.ts
web/app/applications/erp/pages/achats/appels-offres/ao-comparatif/ao-comparatif.page.ts
web/app/applications/erp/pages/achats/appels-offres/services/ao.facade.ts
web/app/applications/erp/pages/achats/appels-offres/services/ao-api.service.ts
web/app/applications/erp/pages/achats/commandes/services/bc.facade.ts
web/app/applications/erp/pages/achats/commandes/services/bc-api.service.ts
web/app/applications/erp/pages/achats/contrats/services/contrat.facade.ts
web/app/applications/erp/pages/achats/contrats/services/contrat-api.service.ts
web/app/applications/erp/pages/achats/demandes/services/demande.facade.ts
web/app/applications/erp/pages/achats/demandes/services/demande-api.service.ts
web/app/applications/erp/pages/achats/fournisseurs/services/fournisseur-api.service.ts
```

Injection courante : `AchatsMockService`.

### 2.2 Ventes — module `backend/domains/ventes`

```
web/app/applications/erp/pages/ventes/avoirs/services/avoir.facade.ts
web/app/applications/erp/pages/ventes/avoirs/services/avoir-api.service.ts
web/app/applications/erp/pages/ventes/bons-commandes-clients/services/bcc.facade.ts
web/app/applications/erp/pages/ventes/bons-commandes-clients/services/bcc-api.service.ts
web/app/applications/erp/pages/ventes/clients/services/client-api.service.ts
web/app/applications/erp/pages/ventes/factures/services/facture.facade.ts
web/app/applications/erp/pages/ventes/factures/services/facture-api.service.ts
web/app/applications/erp/pages/ventes/offres/services/offre.facade.ts
web/app/applications/erp/pages/ventes/offres/services/offre-api.service.ts
web/app/applications/erp/pages/ventes/retenues-garantie/retenues-garantie-mock.facade.ts
```

Injection courante : `VentesMockService`.

### 2.3 Chantiers — module `backend/domains/chantiers`

```
web/app/applications/erp/pages/chantiers/attachements/attachement-listing/attachement-listing.page.ts
web/app/applications/erp/pages/chantiers/attachements/attachement-saisie/attachement-saisie.page.ts
web/app/applications/erp/pages/chantiers/avancements/services/avancement.facade.ts
web/app/applications/erp/pages/chantiers/avancements/services/avancement-api.service.ts
web/app/applications/erp/pages/chantiers/chantier-detail/chantier-detail.page.ts
web/app/applications/erp/pages/chantiers/chantiers-listing/chantiers-listing.page.ts
web/app/applications/erp/pages/chantiers/create/chantier-create.page.ts
web/app/applications/erp/pages/chantiers/detail/chantier-detail-placeholder.page.ts
web/app/applications/erp/pages/chantiers/documents/documents-listing/documents-listing.page.ts
web/app/applications/erp/pages/chantiers/planning/services/planning-mock.facade.ts
web/app/applications/erp/pages/chantiers/situations/services/situation.facade.ts
web/app/applications/erp/pages/chantiers/situations/services/situation-api.service.ts
web/app/applications/erp/pages/chantiers/sous-traitance/sous-traitance-listing/sous-traitance-listing.page.ts
web/app/applications/erp/shell/chantier-drilldown.service.ts
```

Injection courante : `ChantiersMockService`, `AttachementMockService`, `AvancementMockService`, `DocumentsMockService`, `SousTraitanceMockService`, `PlanningMockFacade`.

### 2.4 Études — module `backend/domains/etudes`

```
web/app/applications/erp/etudes/components/dpgf-editor/dpgf-editor.component.ts
web/app/applications/erp/etudes/components/metre-table-editor/metre-table-editor.component.ts
web/app/applications/erp/pages/etudes/appels-offres-clients/services/aoc.facade.ts
web/app/applications/erp/pages/etudes/appels-offres-clients/services/aoc-api.service.ts
web/app/applications/erp/pages/etudes/bibliotheque-prix/services/ouvrage-api.service.ts
web/app/applications/erp/pages/etudes/devis/devis-from-dpgf/devis-from-dpgf.page.ts
web/app/applications/erp/pages/etudes/devis/services/devis.facade.ts
web/app/applications/erp/pages/etudes/devis/services/devis-api.service.ts
web/app/applications/erp/pages/etudes/metres/metre-dpgf/metre-dpgf.page.ts
web/app/applications/erp/pages/etudes/metres/services/metre.facade.ts
web/app/applications/erp/pages/etudes/metres/services/metre-api.service.ts
```

Injection courante : `EtudesMockService`.

### 2.5 RH — module `backend/domains/rh`

```
web/app/applications/erp/pages/rh/conges/services/conge.facade.ts
web/app/applications/erp/pages/rh/conges/services/conge-api.service.ts
web/app/applications/erp/pages/rh/employes/services/employe.facade.ts
web/app/applications/erp/pages/rh/employes/services/employe-api.service.ts
web/app/applications/erp/pages/rh/paie/declarations/damancom.page.ts
web/app/applications/erp/pages/rh/paie/declarations/etat-1208.page.ts
web/app/applications/erp/pages/rh/paie/declarations/igr-etat-9421.page.ts
web/app/applications/erp/pages/rh/paie/paie-journal/paie-journal.page.ts
web/app/applications/erp/pages/rh/paie/services/paie.facade.ts
web/app/applications/erp/pages/rh/paie/services/paie-api.service.ts
web/app/applications/erp/pages/rh/planning-equipes/planning-equipes.page.ts
web/app/applications/erp/pages/rh/pointage/pointage-listing/pointage-listing.page.ts
web/app/applications/erp/pages/rh/pointage/pointage-saisie/pointage-saisie.page.ts
web/app/applications/erp/pages/rh/pointage/pointage-validation/pointage-validation.page.ts
```

Injection courante : `RhMockService`, `PointageMockService`.

### 2.6 HSE — module `backend/domains/hse`

```
web/app/applications/erp/pages/hse/duer/duer-listing.page.ts
web/app/applications/erp/pages/hse/formations/services/formation.facade.ts
web/app/applications/erp/pages/hse/formations/services/formation-api.service.ts
web/app/applications/erp/pages/hse/incidents/incident-detail/incident-detail.page.ts
web/app/applications/erp/pages/hse/incidents/services/incident.facade.ts
web/app/applications/erp/pages/hse/incidents/services/incident-api.service.ts
web/app/applications/erp/pages/hse/inspections/services/inspection.facade.ts
web/app/applications/erp/pages/hse/inspections/services/inspection-api.service.ts
web/app/applications/erp/pages/hse/non-conformites/services/nc.facade.ts
web/app/applications/erp/pages/hse/non-conformites/services/nc-api.service.ts
web/app/applications/erp/pages/hse/phs/phs-listing.page.ts
web/app/applications/erp/pages/hse/ppsps/ppsps-listing.page.ts
web/app/applications/erp/pages/hse/registres-legaux/registres-legaux.page.ts
web/app/applications/erp/pages/hse/services/hse-visite-medicale-planning.service.ts
web/app/applications/erp/pages/hse/tableau-bord-hse/tableau-bord-hse.page.ts
web/app/applications/erp/pages/hse/visites-medicales/visites-medicales-listing.page.ts
```

Injection courante : `HseMockService`, `HseExtendedMockService`.

### 2.7 Marchés — module `backend/domains/marches`

```
web/app/applications/erp/pages/marches/avenants/avenant-detail/avenant-detail.page.ts
web/app/applications/erp/pages/marches/avenants/avenant-listing/avenant-listing.page.ts
web/app/applications/erp/pages/marches/cautions/caution-listing/caution-listing.page.ts
web/app/applications/erp/pages/marches/contrats/contrat-detail/contrat-detail.page.ts
web/app/applications/erp/pages/marches/contrats/contrat-listing/contrat-listing.page.ts
web/app/applications/erp/pages/marches/dgd/dgd-listing.page.ts
web/app/applications/erp/pages/marches/factures/facture-detail/facture-detail.page.ts
web/app/applications/erp/pages/marches/factures/facture-listing/facture-listing.page.ts
web/app/applications/erp/pages/marches/factures/print/facture-marche-print.component.ts
web/app/applications/erp/pages/marches/os/os-listing.page.ts
web/app/applications/erp/pages/marches/penalites/penalites.page.ts
web/app/applications/erp/pages/marches/revisions-prix/revisions-prix.page.ts
```

Injection courante : `MarchesMockService`.

### 2.8 Inventory & Matériel — modules `backend/domains/{item,stock}`

```
web/app/applications/erp/inventory/components/inventaire-lines-editor/inventaire-lines-editor.component.ts
web/app/applications/erp/inventory/components/perte-lines-editor/perte-lines-editor.component.ts
web/app/applications/erp/inventory/components/reception-lines-editor/reception-lines-editor.component.ts
web/app/applications/erp/inventory/components/retour-lines-editor/retour-lines-editor.component.ts
web/app/applications/erp/inventory/components/transfert-lines-editor/transfert-lines-editor.component.ts
web/app/applications/erp/pages/inventory/catalogue/articles/services/article.facade.ts
web/app/applications/erp/pages/inventory/catalogue/articles/services/article-api.service.ts
web/app/applications/erp/pages/inventory/catalogue/materiel/materiel-detail/materiel-detail.page.ts
web/app/applications/erp/pages/inventory/catalogue/materiel/services/materiel-api.service.ts
web/app/applications/erp/pages/inventory/configuration/{costing-methods,depots,familles,motifs,types-articles,uom,uom-categories}/services/*.facade.ts
web/app/applications/erp/pages/inventory/magasin-chantier/magasin-chantier.page.ts
web/app/applications/erp/pages/inventory/materiel/{affectations,carburant,controles,fiche-360,locations,maintenance,planning,pointage}/*.page.ts
web/app/applications/erp/pages/inventory/mouvements/inventory-txes/services/inventory-tx.facade.ts
web/app/applications/erp/pages/inventory/mouvements/sorties/services/sortie.facade.ts
web/app/applications/erp/pages/inventory/suivi/etat-stock/services/etat-stocks.facade.ts
web/app/applications/erp/pages/inventory/suivi/valorisation/services/valorisation.facade.ts
```

Injection courante : `InventoryMockService`, `MaterielGmaoMockService`.

### 2.9 Finance — module `backend/domains/finance` (à créer)

```
web/app/applications/erp/finance/mock/finance-comptabilite-mock.service.ts   (le mock lui-même)
web/app/applications/erp/pages/finance/analytique/analytique.page.ts
web/app/applications/erp/pages/finance/balance/balance.page.ts
web/app/applications/erp/pages/finance/caisses/**/*.page.ts                  (5 fichiers)
web/app/applications/erp/pages/finance/caisses-chantier/caisses-chantier.page.ts
web/app/applications/erp/pages/finance/conditions-paiement/services/condition-paiement-api.service.ts
web/app/applications/erp/pages/finance/declarations/{retenue-source,simpl-is}.page.ts
web/app/applications/erp/pages/finance/devises/services/devise-api.service.ts
web/app/applications/erp/pages/finance/effets/effets-commerce.page.ts
web/app/applications/erp/pages/finance/factures-fournisseurs/**/*.page.ts    (2 fichiers)
web/app/applications/erp/pages/finance/journaux/**/*.page.ts                 (4 fichiers)
web/app/applications/erp/pages/finance/lettrage/lettrage.page.ts
web/app/applications/erp/pages/finance/plans-comptables/services/plan-comptable.facade.ts
web/app/applications/erp/pages/finance/rapprochement/rapprochement.page.ts
web/app/applications/erp/pages/finance/recouvrement/recouvrement.page.ts
web/app/applications/erp/pages/finance/reglements/**/*.page.ts               (2 fichiers)
web/app/applications/erp/pages/finance/taux-change/services/taux-change.facade.ts
web/app/applications/erp/pages/finance/taux-change/services/taux-change-api.service.ts
web/app/applications/erp/pages/finance/virements/**/*.page.ts                (3 fichiers)
```

Injection courante : `FinanceConfigMockService`, `FinanceComptabiliteMockService`, `FinanceTresorerieMockService`, `FinanceRound2MockService`.

### 2.10 Approbations — module `backend/domains/approbations`

```
web/app/applications/erp/pages/approbations/components/submit-approval-button/submit-approval-button.component.ts
web/app/applications/erp/pages/approbations/inbox/inbox.page.ts
```

Injection courante : `ApprobationsMockService`.

### 2.11 Dashboard / Analytics / Pilotage — read endpoints multi-domaines

```
web/app/applications/erp/pages/dashboard/dashboard.page.ts
web/app/applications/erp/pages/analytics/tableau-achats/tableau-achats.page.ts
web/app/applications/erp/pages/analytics/tableau-chantiers/tableau-chantiers.page.ts
web/app/applications/erp/pages/analytics/tableau-financier/tableau-financier.page.ts
web/app/applications/erp/pages/analytics/tableau-hse/tableau-hse.page.ts
web/app/applications/erp/pages/analytics/tableau-rh/tableau-rh.page.ts
web/app/applications/erp/pages/pilotage/services/cash-flow-projection.service.ts
web/app/applications/erp/pages/pilotage/services/pilotage-chantier-marges.service.ts
web/app/applications/erp/pages/pilotage-analyses/services/pilotage-analyses-data.service.ts
web/app/applications/erp/shell/erp-notifications.service.ts
```

Injection courante : **plusieurs** mocks à la fois (Achats, Ventes, Chantiers, RH, HSE, Inventory). Ce sont les agrégats — ils ne peuvent migrer qu'une fois leurs sources backend disponibles.

---

## 3. Checklist de désinjection par module

À cocher en parallèle de la livraison backend correspondante :

- [ ] **Achats** — 11 fichiers nettoyés, `AchatsMockService` quarantined, puis supprimé
- [ ] **Ventes** — 10 fichiers nettoyés, `VentesMockService` quarantined, puis supprimé
- [ ] **Chantiers** — 14 fichiers nettoyés, 6 mocks quarantined puis supprimés
- [ ] **Études** — 11 fichiers nettoyés, `EtudesMockService` quarantined, puis supprimé
- [ ] **RH** — 14 fichiers nettoyés, 2 mocks (Rh + Pointage) supprimés
- [ ] **HSE** — 16 fichiers nettoyés, 2 mocks (Hse + HseExtended) supprimés
- [ ] **Marchés** — 12 fichiers nettoyés, `MarchesMockService` supprimé
- [ ] **Inventory** — 25+ fichiers nettoyés, `InventoryMockService` + `MaterielGmaoMockService` supprimés
- [ ] **Finance** — 24+ fichiers nettoyés, 4 mocks Finance supprimés
- [ ] **Approbations** — 2 fichiers nettoyés, `ApprobationsMockService` supprimé
- [ ] **Dashboard/Analytics/Pilotage** — 10+ fichiers nettoyés (dépend de TOUS les autres modules livrés)

---

## 4. Commande de validation finale

À la fin de la migration, **un seul résultat acceptable** :

```bash
grep -rE "inject\((\w+MockService)\)" web/app/applications/erp 2>/dev/null | grep -v ".spec.ts"
# (vide)

ls web/app/applications/erp/**/mock/
# (vide ou supprimé)
```

Tant que ces commandes renvoient du contenu (hors specs), la migration n'est **pas terminée**.
