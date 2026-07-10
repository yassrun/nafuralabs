# 📊 Progression détaillée — ERP Audit Roadmap

> Snapshot live mis à jour à chaque tâche complétée.
> Légende : ✅ FAIT · 🟡 PARTIEL · ❌ MANQUANT · 🔄 EN COURS

Dernière mise à jour : **2026-05-13** (audit R01 §01–02 : accents Planning/Budget, lookups HSE ← `SEED_CHANTIERS` ; TVA autoliquidation MA + `FiscalSettingsService` ; **R04** §06–08 : retenue TVA autoliq, société, login démo/2FA ; **R03** §05 stock : magasins enrichis, articles PMP/`posteBudgetId`, parcours sorties, sync budget V2 ; **R02** §03–04 : fil d’Ariane route-driven, AR/RTL, chips filtres mobile &lt;640px, fiscal %/MAD + mock inventaire `cloneTx` ; **R05** §09–10 : HSE CNSS/EPI volets/DUER matrice + PPSPS print démo, garde-fou planning INAPTE, registres PDF démo, paie journal + fiche paie + tests `PaieEngine`, tiers MA, `TvaAutoliquidationService` → `finance/services/`, SIMPL-IS + redirects 9421/1208, `erpAudit` sur exports sensibles listés §12.5 ; **R06** §11–12–14 : export listings par défaut + `LISTING_EXPORT_AUDIT`, PDF démo Playwright, services K/RG/avancement + facades audit RH/HSE/ventes ; **R07** §13–15 : pointage photo IndexedDB + compression ~800px + sync/conflits mock + bannière ; page **`/rh/pointage/validation`** ; planning équipes (filtres, affectation, conflit %&gt;100) ; carnet attachement saisie + signature canvas + seeds ; PWA `ngsw` groupe `shell-html` + doc **`PWA-CACHE-PROD.md`** ; branding document (`ThemeService.applyDocumentChrome`, shell société) ; tooltips (`nfTooltip` shell tour, géoloc pointage, `nf-filter-reset`, `entity-listing`) ; reset filtres dans **`entity-listing`** ; 4e tour onboarding **`pilotage`** ; échelle **`--nf-text-*`** dans `src/styles.scss` ; correctif syntaxe **`onSocieteSwitcherChange`** shell).

## 01-foundations — 🟢 100%

✅ Module foundations entièrement fonctionnel (i18n, locale, CI `lint:no-dollar`, seeds chantiers alignés achats/HSE).

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 1.1 | LOCALE_ID `fr-MA` + DEFAULT_CURRENCY_CODE MAD | ✅ | `app/app.config.ts:13-14,98-99` |
| 1.2 | Pipe `madCurrency` + remplacement `\| currency` | ✅ | **Migration 2026-05-10** : 21 fichiers migrés, 0 `\| currency` restant. **2026-05-13 (R01)** : revérification `app/` + `*.html` → 0 occurrence ; `lint:no-dollar` OK. |
| 1.3 | Bloquer `$` en CI | ✅ | **2026-05-10** : `web/scripts/check-no-dollar.mjs` + `npm run lint:no-dollar`. **CI** : `.github/workflows/web-lint-no-dollar.yml` (paths `web/**`, Node 20, `npm ci`). |
| 1.4 | Mock chantiers unifié | ✅ | **`SEED_CHANTIERS`** référence unique : achats mock `chantierCode` **`CH-2025-00x`**, `chantierName` = noms seeds (`Résidence Yasmine`, `Pont Bouregreg`, etc.), `chantierId` **`ch-00x`**, HSE idem. Numéros métiers DA/BC/AO restent en **2026** (exercice courant démo). **2026-05-13** : lookups chantier des facades **HSE** (incidents / NC / inspections) dérivés de `SEED_CHANTIERS` (plus de libellés divergents type « Les Acacias »). |
| 1.5 | i18n keys Matériel | ✅ | `public/assets/i18n/applications/erp/fr.json:2-29` |
| 1.6 | `<html lang>` dynamique | ✅ | `LocaleService.applyLang` + `index.html` |
| 1.7 | Accents Planning | ✅ | **2026-05-10** : `Dépendances`, `décalage`, `Période`, `Équipe`, + bonus Budget (Révisé/Engagé/Réalisé/Écart). **2026-05-13 (R01)** : légende statuts Gantt (`Planifié`/`Terminé`), toolbar (`Cette année`, `Granularité`, `Plein écran`), tiroir phase (`Détail`, `Début`, `Quantité`, etc.) ; Budget : dialog révision + motifs seed `budget.facade`. |
| 1.8 | Clé `core.ai.assistant.title` | ✅ | `core/fr.json:7-13` |
| 1.9 | Dashboard KPI cohérents | ✅ | `dashboard.page.ts:67-76` calcul pondéré |

## 02-chantiers-bugs — 🟢 100%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 2.1 | Fiche détail chantier | ✅ | `chantier-detail.page.ts` 6 onglets |
| 2.2 | Drill-down listings transverses | ✅ | **`openChantier`** + `ChantierDrilldownService` ; seeds **`chantierId`** mock achats/HSE = `ch-00x` (plus de `ch00x` seul). **Avancements** : `ouvrir-chantier` → saisie. |
| 2.3 | Routes Sous-traitance & Documents | ✅ | `sous-traitance.routes.ts`, `documents.routes.ts` |
| 2.4 | Drill-down Gantt | ✅ | `chantiers-planning.page.ts` — `attachGanttEvents` / `onTaskClick` (**~302–313**) : barre **CHANTIER** → `onOpenChantier(chantierId)` ; **PHASE** → `openPhase`. |

## 03-shell-ux — 🟢 100%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 3.1 | Breadcrumb global routing-driven | ✅ | **2026-05-13 (R02)** : `route-breadcrumb.util.ts` (`buildRouteBreadcrumbs`), export `@lib/anatomy` ; `config-driven-listing-page` / `config-driven-detail-page` consomment les segments route ; `data.breadcrumb` sur routes **Administration** (`app.routes.ts`), **inventaire** (`inventory.routes.ts` + enfants réceptions/transferts/retours/inventaires/pertes-chutes), **chantiers** (avancements, budget). |
| 3.2 | Command palette Ctrl+K | ✅ | `command-palette.component.ts` |
| 3.3 | Notifications panel | ✅ | `notification-bell.component.ts` |
| 3.4 | Toggle langue + AR/RTL | ✅ | **2026-05-13 (R02)** : `supportedLanguages` inclut `ar` ; packs `public/assets/i18n/core/ar.json` + `applications/erp/ar.json` ; sélecteur de langue (`language-selector.component.ts`) ; `LocaleService` applique déjà `dir` sur `<html>` ; overrides `[dir='rtl']` dans `src/styles.scss` (header, `nf-data-table`, toolbar listing, listing-controls). |
| 3.5 | Panneau IA fermable | ✅ | `chat-panel.component.ts` |
| 3.6 | Boutons création standardisés | ✅ | **2026-05-13 (R02)** : action globale `new` dans `default-listing-actions.config.ts` (icône `plus`, clés `listing.action.new` / `newAria`) ; i18n `core/fr|en` ; exemple chantier **sous-traitance** : `nf-button` + `ToastService` ; ne pas casser les listings déjà sur `nf-entity-listing`. |

## 04-tables-forms-states — 🟡 79%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 4.1 | Virtualisation tableaux | ✅ | **2026-05-10** : `cdk-virtual-scroll-viewport` sur `nf-list-view` (seuil 51 lignes) + `content-visibility` sur lignes `nf-data-table` sans pagination (&gt;50 lignes). **2026-05-13 (R02)** : pas d’ajout de virtual scroll natif `cdk` sur `mat-table` — listings ERP principalement paginés via `nf-data-table` ; surveiller un écran réel non paginé &gt; seuil perf avant d’investir. |
| 4.2 | `<nf-data-state>` | ✅ | **2026-05-10** : `nf-data-state` étendu (`loadingVariant`, `loadingMessage`) + **tous les listings `nf-entity-listing`** passent par le switch unifié (loading / error / empty / loaded). Reste (hors périmètre R02 optionnel) : pages liste ad-hoc hors `EntityListingComponent`. |
| 4.3 | Service Toast global | ✅ | `toast.service.ts` utilisé 25+ fichiers |
| 4.4 | CanDeactivate guards | ✅ | 6 routes couvertes |
| 4.5 | Filtres scrollables mobile | ✅ | **2026-05-10** : barre d’outils `entity-listing` scrollable horizontalement &lt;640px. **2026-05-13 (R02)** : rangée **chips filtres actifs** sous la toolbar (&lt;640px) dans `entity-listing` + resserrage panneau filtres `listing-controls.component.scss`. |
| 4.6 | Inputs MA (ICE/RIB/Phone/Money) | 🟡 | **2026-05-10** : `ice`/`rib`/`phone-ma`/`money-ma` + **`buildForm`**. **2026-05-13 (R02)** : **`parametres-fiscal.page.ts`** — taux / montants MAD via `nf-money-input`, `ToastService` à la sauvegarde ; **sous-traitance-listing** — colonne ICE + pattern création ; `money-input.component.ts` — bordure suffixe logique (RTL). Reste : formulaire détail sous-traitant plein `entity-detail` si page dédiée, compteurs non monétaires explicites `buildForm` partout. |
| 4.7 | Form error summary | ✅ | **2026-05-10** : `form-error-summary.component.ts` + intégration `entity-detail` (ancres `nf-field-*`, garde sur action `save`, bouton save cliquable si invalide). i18n `form.errorSummary.title`. |

## 05-stock-module — 🟢 100%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 5.1 | Magasins | ✅ | **2026-05-13** : modèle `Location` enrichi (`ville`, `latitude`/`longitude`, `capaciteM3`/`capaciteTonnes`, `responsableNom`, `budgetChantierId`, `notes`, types `ENTREPOT`/`TRANSIT`/`VIRTUEL`). Seeds **6 emplacements** dans `inventory-mock.service.ts` (`LOC_DEPOT_CASA`…`LOC_TRANSIT_JORF`). UI dépôts : `depots/config/detail/fields.ts`, `listing/columns.ts`, `sections.ts`. Filtre état stock « Dépôt / entrepôt / transit » : `etat-stocks.facade.ts` + `etat-stocks.page.ts`. |
| 5.2 | Articles | ✅ | **2026-05-13** : `inventory/models` `Article` — `pmp`, `prixAchatDernier`, `delaiReapproJours`, `fournisseurPrefereIds`, UM secondaire + `conversionFactor`, `isPerissable`/`isSerialise`, **`posteBudgetId`**. Seeds articles dans `inventory-mock.service.ts`. Catalogue : `articles/models/article.model.ts`, `article-api.service.ts` (`toArticle`), `config/detail/fields.ts` + `sections.ts`, `listing/columns.ts`. |
| 5.3 | Mouvements | ✅ | **2026-05-13** : `TxType` + `SORTIE`, motifs `mot-srt-*`, `validateSortie()` mock, seeds `tx-srt-*`. Parcours **`/inventory/mouvements/sorties`** : `sorties.routes.ts`, `sortie-listing.page.ts`, `sortie-detail.page.ts`, `services/sortie.facade.ts` (validation → déstockage + `InventoryTxesFacade.validateChantierOutflow`). Nav `erp-nav.generated.ts` + i18n `applications/erp/fr.json` `nav.stock.sorties`. Éditeur lignes : `perte-lines-editor.component.ts` `variant="sortie"`. |
| 5.4 | Inventaires | ✅ | listing + detail + lines editor |
| 5.5 | État stock + valorisation PMP/FIFO | ✅ | `etat-stocks`, `valorisation`, `costing-methods` — **2026-05-13** : `valorisation.facade.ts` agrège valeur hors chantier (dépôt+entrepôt+transit+virtuel), `valorisation.page.ts` pastilles type. |
| 5.6 | Alertes stock | ✅ | `alertes-reappro.page.ts` |
| 5.7 | **Liaison sortie stock → budget chantier** | ✅ | **V2 2026-05-13** : `Article.posteBudgetId` (code rubrique ex. `MATERIAUX`) + `InventoryTxesFacade.validateChantierOutflow()` résout l’article via `InventoryMockService.getArticle()` et passe `rubrique: art.posteBudgetId` à `StockBudgetSyncService.recordOutflow()` (heuristique **uniquement** si rubrique absente). Fichiers : `inventory/models/index.ts`, `inventory-tx.facade.ts`, `stock-budget-sync.service.ts`. |

## 06-marches-facturation — 🟢 100%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 6.1 | Contrats / Marchés | ✅ | `Marche` modèle complet + listing/detail |
| 6.2 | Avenants | ✅ | Workflow signature complet |
| 6.3 | Factures de situation | ✅ | Calculs + impression |
| 6.4 | Cautions bancaires | ✅ | `caution-listing.page.ts` |
| 6.5 | Révisions formule K | ✅ | `calculerK` + référentiel BTP01..18/MO |
| 6.6 | Pénalités de retard | ✅ | `penalites.page.ts` |
| 6.7 | Spécificités fiscales MA | ✅ | **2026-05-13** : `FiscalSettingsService` (+ `retenueTvaSurAutoliquidationTaux`), **`TvaAutoliquidationService`** (`finance/services/tva-autoliquidation.service.ts`) B2B résident vs non-résident, retenue TVA sur autoliq, option `forceTvaClassique` / `desactiveAutoliquidation` fournisseur. **`parametres-fiscal.page.ts`** (section autoliq + simulateur). **`ff-detail.page.ts`** : récap retenue, liens DGI (état 1208, param. fiscaux). **`FinanceComptabiliteMockService`** : totaux, écriture validation 3455/4456 + **4438** si retenue, `validerFacture` chaîne `Observable` (fix `ecritureId`). Seed **`FRS-013`** : ICE export, non-résident. Tests **`tva-autoliquidation.service.spec.ts`**. |
| 6.8 | Routing + sidebar | ✅ | `marches.routes.ts` |

## 07-pilotage-approbations — ✅ 100%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 7.1 | Modèle ApprovalRequest | ✅ | Engine présent |
| 7.2 | Approval rules service | ✅ | **`approval-rules.service.ts`** : `APPROVAL_MONETARY_THRESHOLDS` + `buildDefaultEtapes` / `circuitSummary`. **`approbations-mock.service`** injecte le service (plus de duplication). Tests **`approval-rules.service.spec.ts`** (BC/DA/NOTE_FRAIS/AVENANT). |
| 7.3 | ⚠️ **Boutons "Soumettre approbation" entités** | ✅ | **2026-05-10** : composant `<app-submit-approval-button>` + mock `submit()`. Pages : BC, DA, Contrat, Congé, FF. **2026-05-10 (suite)** : fiche **`avenant-detail.page.ts`** (`/marches/avenants/:avenantId`) avec barre d’approbation ; liste + onglet marché lient vers le détail. |
| 7.4 | Page inbox approbations | ✅ | **2026-05-10** : seeds alignés mocks (`bc001`/`bc004`/`bc007`, `da003`, `av-003`, `cng-001`, `ch-00x` + `CH-2025-*`). **Voir détail** → navigation fiche (`approval-entity-route.util`). **Code chantier** cliquable → `ChantierDrilldownService`. **`decide()`** → `erpAudit` `APPROVE`/`UPDATE`/`REJECT`. |
| 7.5 | Notifications approbations | ✅ | **2026-05-10** : alertes `APPROBATION` avec **id = `apr-xxx`** (plus de doublon `apr-apr-xxx`), **route** `/approbations?highlight=…`, navigation via **`navigateByUrl`**. Inbox : **`highlight`** → onglet auto (à traiter / historique), reset filtre type, **scroll** + surbrillance carte. |
| 7.6 | KPIs pilotage marges chantier | ✅ | **`pilotage-chantier-marges.service.ts`** : `buildPilotageMargeRows` + `PilotageChantierMargesService` (source unique pour **`marges-chantier.page`** et **`marge-consolidee.page`**). Page marges : KPI **marge HT cumul**, **export CSV** (`ExportService`), filtres reset corrigés. Tests **`pilotage-chantier-marges.service.spec.ts`**. |
| 7.7 | **Page marges consolidée** | ✅ | **`marge-consolidee.page.ts`** — route `/pilotage/marge-consolidee`, KPI groupe (portefeuille, facturé, encaissé, taux encaissement, marge %), top risques marge &lt;10%, répartition par ville, alertes. Nav `erp-nav` + i18n `nav.pilotage.margeConsolidee`. |
| 7.8 | KPI cash-flow projection | ✅ | **`cash-flow-projection.service.ts`** : `projectCashFlowMonths`, `DEFAULT_CASHFLOW_SEUIL_ALERTE_MAD`, `CashFlowProjectionService.months` consommé par **`cash-flow.page.ts`**. Tests **`cash-flow-projection.service.spec.ts`**. |

## 08-administration — 🟢 86%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 8.1 | Utilisateurs | ✅ | IAM en place |
| 8.2 | Rôles | ✅ | `role-detail.page.ts` |
| 8.3 | ⚠️ **Sociétés multi-entité** | ✅ | **2026-05-10** : modèles `Societe` + `Etablissement` (`pages/administration/societe/models/index.ts`), service singleton `SocieteService` (`shell/societe.service.ts`) avec seeds 3 sociétés / 6 établissements (SOMACOM BTP, TP, Logistique) + persistance `nafura-current-societe`. Switcher header `<app-societe-switcher>` (`shell/components/societe-switcher/societe-switcher.component.ts`) câblé dans `platform-app-shell` topbar (auto-masqué si ≤1 société). Page `societe.page.ts` refondue : tableau des sociétés + panneau détail (identité légale read-only depuis le service, extras coordonnées/RIBs persistés par société). |
| 8.4 | Paramètres société | ✅ | **2026-05-13** : `societe.page.ts` — TVA intra (read-only), section **paramètres de gestion** (code court groupe, devise, mois clôture, ville/pays siège, représentant légal) + extras persistés `localStorage` alignés multi-société. |
| 8.5 | Audit log page | ✅ | `erp-audit-log.page.ts` |
| 8.6 | Demo reset | ✅ | `demo-reset.page.ts` |
| 8.7 | ⚠️ **Login/2FA in-app** | ✅ | **2026-05-13** : `login.page.ts` — prod : bouton SSO explicite (MFA Keycloak) ; dev : `devAuthEagerBootstrap` + `completeDevInAppAuth` / restauration session (`AuthFacade`). `environment.ts` : `devInAppAuth`, `devAuthEagerBootstrap`. Doc **`docs/specs/erp-audit-roadmap/LOGIN-2FA-DEMO.md`**. |

## 09-hse-module — 🟢 100%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 9.1 | Incidents/NC/inspections/formations | ✅ | **2026-05-13 (R05)** : champs CNSS / inspection / attestations sur `Incident`, `NonConformite`, `Inspection`, `Formation` dans `app/applications/erp/hse/models/index.ts` (`cnssMatriculeVictime`, `cnssReferenceDeclaration`, `organismeType`, etc.). |
| 9.2 | Registre EPI | ✅ | **2026-05-13 (R05)** : sous-routes `/hse/epi/reference`, `attribution`, `verification` — `epi.routes.ts`, `epi-shell.page.ts`, `epi-volet.page.ts`, données `epi-mock.data.ts` ; entrée depuis `tableau-bord-hse.page.ts`. |
| 9.3 | **DUER + PPSPS** | ✅ | **2026-05-10** : listings DUER/PPSPS + mock étendu. **2026-05-13 (R05)** : `Duer.matriceRisques` + modal matrice dans `duer-listing.page.ts` ; `ppsps-listing.page.ts` — impression démo « PDF R4532-65 » + `erpAudit` PRINT. |
| 9.4 | **Visites médicales** | ✅ | **2026-05-10** : listing visites + filtres. **2026-05-13 (R05)** : `HseVisiteMedicalePlanningService` + `planning-mock.facade.ts` bloque le déplacement de phase si dernière visite **INAPTE** pour le responsable ; `chantiers-planning.page.ts` alerte + refresh ; seed phase liée `emp-008` dans `chantiers-mock.service.ts`. |
| 9.5 | **Registres légaux exportables** | ✅ | **2026-05-10** : onglets + XLSX + print. **2026-05-13 (R05)** : `registres-legaux.page.ts` — `openPdfOfficiel()` (gabarit imprimable type CNSS, zone tampon en pointillés) + audit PRINT aligné exports sensibles. |
| 9.6 | Tableau de bord HSE | ✅ | `tableau-bord-hse.page.ts` |

## 10-paie-fiscal-maroc — 🟢 92%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 10.1 | Référentiel taux paie 2026 | ✅ | `bareme-paie-2026.ts` |
| 10.2 | PaieEngineService | ✅ | **`paie-engine.service.ts`** + tests Jasmine **`rh/paie/services/paie-engine.service.spec.ts`** (2026-05-13 R05 : cas nominaux, bornes barème 2026, retenues exceptionnelles, profil cadre). |
| 10.3 | UI fiche paie + journal + déclarations | ✅ | **`paie-journal.page.ts`** + route `journal` dans `paie.routes.ts` (avant `:id`), nav + i18n. **`paie-detail.page`** : récap brut/retenues/net + impression + `erpAudit.log('PRINT', 'FICHE_PAIE', …)`. Déclarations : état 1208, DAMANCOM, IGR, SIMPL-IS (voir 10.6). |
| 10.4 | Modèles tiers MA (ICE/IF/RC/Patente) | ✅ | **`rh/models/index.ts`** (`Employe` : `ice`, `ifFiscal`, `rc`, `patente`) + **`ventes/models/index.ts`** (`ClientVente` : complété `ifFiscal`, `patente` ; ICE/RC déjà présents) ; champs formulaires détail + seeds `rh/mock/seeds.ts`, `ventes/mock/seeds.ts`. |
| 10.5 | Engine fiscal centralisé | ✅ | **`finance/services/tva-autoliquidation.service.ts`** (+ spec) ; imports **`ff-detail.page.ts`**, **`finance-comptabilite-mock.service.ts`**, **`parametres-fiscal.page.ts`**. Ancien chemin `pages/marches/services/tva-autoliquidation*` supprimé. Reste possible : extraire d’autres briques fiscales hors périmètre TVA (ex. logique IGR restant dans `PaieEngineService`). |
| 10.6 | Génération exports DGI | ✅ | **`simpl-is.page.ts`** (TVA mensuelle démo) : annexes XLSX + XML, `erpAudit` sur exports sensibles. **`finance.routes.ts`** : redirections `finance/declarations/etat-9421` → `/rh/paie/declarations/igr` et `etat-1208` → `/rh/paie/declarations/etat-1208` pour éviter le doublon avec les écrans RH/DGI existants. |

## 11-design-system — 🟡 75%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 11.1 | StatusBadge centralisé | ✅ | 12 entités couvertes |
| 11.2 | Audit a11y WCAG AA | ✅ | **`tests/e2e/critical-pages-a11y.spec.ts`** : 9 routes clés (cf. §14.4 spec) + tags WCAG 2.0/2.1 AA ; `npm run e2e:a11y` inclut aussi `pointage-a11y`. **2026-05-13** : verts sur `chromium-desktop` et `chromium-mobile`. Pas d’eslint jsx-a11y (hors scope « léger »). |
| 11.3 | Pluriels ICU | ✅ | **`TranslateMessageFormatCompiler`** (`ngx-translate-messageformat-compiler`) dans `app.config.ts`. Clés ICU : `core/fr.json` + `en.json` (audit export, membres, recherche IA), `doc-extractor/fr|en.json`. |
| (atomes DS) | Money/ICE/RIB/Phone/Toast/Empty/Skeleton | ✅ | Tous créés |
| (typo) | Hiérarchie typographique | 🟡 | **`tokens.scss`** : échelle `--nf-text-*` + alias `--nf-font-size-*` / line-height. **`nf-page-shell`** / **`nf-page-header`** consomment les tokens. **2026-05-13 (R07)** : `:root` dans **`web/src/styles.scss`** — variables **`--nf-text-xs` … `--nf-text-2xl`** alignées spec. Reste : migrer les pages métier hors shell. |

## 12-exports-impressions — 🟡 72%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 12.1 | Bouton Exporter générique | 🟡 | **`listing-config.builder.ts`** : `DEFAULT_FEATURES.importExport: true` → export CSV (modal) sur tous les listings `nf-entity-listing` sauf override. **`LISTING_EXPORT_AUDIT`** + provider `app.config.ts` : `nf-entity-listing` enregistre `EXPORT` via `ErpAuditService`. `<nf-export-button>` reste pour cas ad hoc (HSE, contrats, audit log). |
| 12.2 | Templates documents imprimables | 🟡 | **2026-05-13 (R06)** : gabarits `@media print` — **`devis-detail`**, **`paie-detail`** (fiche paie). Reste : contrat marché, BR, DGD, etc. (cf. spec 12.2). |
| 12.3 | Génération PDF côté serveur | 🟡 | **`scripts/pdf-demo/render-pdf.mjs`** + **`docs/specs/erp-audit-roadmap/pdf-server-demo.md`** (contrat URL/HTML → PDF via `npx playwright pdf`). Script npm **`pdf:demo`**. |
| 12.4 | Numérotation auto conforme | ✅ | Catalogue **19 types** dont **`FICHE_PAIE`** → `PAI-{YYYY}-{####}`. Wiring : achats, études, finance FF, **RH** (**CNG** + **`createFichePaie` / seed `PAI-`**), marchés (MAR/FM/AVN), chantiers (SIT), ventes CMD, stock BL/BR. |
| 12.5 | Audit log export | ✅ | **2026-05-10** : `ExportButton`, `EntityListing` `(exported)`, … **2026-05-13** : exports CSV listing via **`LISTING_EXPORT_AUDIT`** ; aligné avec `ErpAuditService`. **2026-05-13 (R05)** : PRINT/XLSX/XML sensibles — `paie-detail` (fiche paie), `ppsps-listing`, `registres-legaux` (PDF officiel démo), `simpl-is`, matrice DUER (UPDATE via listing). |

## 13-rh-terrain — 🟢 92%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 13.1 | Pointage chantier mobile | ✅ | **`pointage-photo-idb.service.ts`** (store `photos`, JPEG ~800px), intégration **`pointage-saisie.page.ts`** (`data-testid="pointage-photo"`), bannière offline/sync étendue sans casser l’existant. |
| 13.2 | Validation/cumul desktop | ✅ | **`pointage-validation.page.ts`** + route **`/rh/pointage/validation`** (`rh.routes.ts`) ; lien depuis **`pointage-listing.page.ts`**. |
| 13.3 | Planning équipes | ✅ | **`planning-equipes.page.ts`** : filtres chantier/employé, grille semaine, dialogue nouvelle affectation (`addAffectation`), alerte cumul &gt;100 %. |
| 13.4 | Carnet d'attachement | ✅ | **`attachement-saisie.page.ts`** (canvas signature, brouillon), **`attachement-mock.service.ts`** + route **`/chantiers/attachements/saisie`**. |
| 13.5 | Journal de chantier | ✅ | `journal-chantier.page.ts` |
| 13.6 | PWA + offline-first | ✅ | Mock : miroir `localStorage`, fingerprint / **`CONFLICT`**, compteur photos pending, **`syncPending`** + intervalle / `visibilitychange` / message SW ; photos IDB syncées côté mock. **2026-05-13 (R07)** : `ngsw-config.json` (cf. §15.5). E2E mobile : `npm run e2e -- tests/e2e/pointage-offline.spec.ts --project=chromium-mobile` **vert** après lot. Reste prod : vrai backend + stratégie conflits serveur. |

## 14-tests-audit — 🟡 78%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 14.1 | Audit log centralisé | 🟡 | **2026-05-10** : 7 facades critiques câblées (BC, DA, AO, Contrat, Situation, Facture, Congé, Avancement). **2026-05-13** : export CSV **Marges chantiers** ; **`LISTING_EXPORT_AUDIT`** (exports listing) ; facades **Employé**, **Fiche paie** (CRUD + valider/payer), **Incident / NC / Inspection**, **Retenue garantie** (mutations). Reste : autres facades / exports ad hoc. |
| 14.2 | ⚠️ **Tests unitaires services calcul** | 🟡 | **2026-05-10** : 4 specs Karma+Jasmine baseline. **2026-05-13** : + pilotage, **`paie-engine.service.spec.ts`**. **2026-05-13 (R06)** : + **`formule-revision-k.service.spec.ts`**, **`retenue-garantie-calcul.service.spec.ts`**, **`avancement-calcul.service.spec.ts`**. Reste : couverture mesurée, autres moteurs. |
| 14.3 | Tests e2e Playwright | ✅ | **2026-05-10** : `playwright.config.ts` + test mobile offline `tests/e2e/pointage-offline.spec.ts`. Validation réelle : `npm run e2e -- tests/e2e/pointage-offline.spec.ts --project=chromium-mobile` vert. |
| 14.4 | axe-core CI | ✅ | **`npm run e2e:a11y`** : `pointage-a11y` + **`critical-pages-a11y`** (9 pages clés). Verts **desktop + mobile** (2026-05-13). |
| 14.5 | Lighthouse CI | ✅ | `.lighthouserc.json` + `npm run lighthouse:ci`. **CI** : `.github/workflows/web-lighthouse-ci.yml` (paths `web/**`, Node 20, `npm ci` puis `lighthouse:ci`). |
| 14.6 | Tests visuels Storybook | ✅ | **2026-05-10** : `.storybook/` ajouté, targets Angular `storybook` / `build-storybook` câblés dans `angular.json`, `tsconfig.storybook.json` dédié, story baseline `status-badge.stories.ts`. Validation réelle : `npm run storybook -- --smoke-test --ci` démarre via builder Angular. |
| 14.7 | Tests intégration load | ✅ | **2026-05-10** : `artillery` installé + scénario `tests/load/pointage-smoke.yml` et script `npm run test:load`. |
| 14.8 | Documentation testing | ✅ | **`_TESTING_GUIDE.md`** : e2e:a11y (2 specs), **`pdf:demo`** (2026-05-13). |

## 15-polish — 🟢 88%

| Task | Description | Statut | Évidence / Reste à faire |
|---|---|---|---|
| 15.1 | Branding multi-tenant | ✅ | **`theme.service.ts`** : `applyDocumentChrome` (favicon + `Title`). **`platform-app-shell.component.ts`** : couleur primaire démo par société + chrome doc au switch ; correctif **`onSocieteSwitcherChange`**. |
| 15.2 | Dark mode | ✅ | `ThemeModeService` complet |
| 15.3 | Raccourcis clavier | ✅ | 12 raccourcis |
| 15.4 | Tooltips systématiques | 🟡 | **`TooltipDirective`** : shell (tour onboarding), géoloc pointage, **`nf-filter-reset`**, barre **`entity-listing`**. Reste : toolbar « icônes seules » sur davantage d’écrans prioritaires. |
| 15.5 | Manifest PWA + offline | ✅ | **`provideServiceWorker`** + `ngsw-config.json` (**dataGroup `shell-html`** pour `/index.html`, freshness). Doc prod **`docs/specs/erp-audit-roadmap/PWA-CACHE-PROD.md`**. |
| 15.6 | Bouton Réinitialiser filtres | 🟡 | **`entity-listing.component`** : `FilterResetComponent` + `onResetFilters()` (tous les listings `nf-entity-listing`). Listings ad hoc déjà équipés inchangés ; mesurer le ratio global vs spec. |
| 15.7 | Onboarding tour | ✅ | **`onboarding.service.ts`** : 4e tour **`pilotage`** (marges + cash-flow). |
| 15.8 | Polish typographique | 🟡 | **`web/src/styles.scss`** : échelle **`--nf-text-*`**. Reste : appliquer systématiquement aux composants métier (coord. §11). |
| 15.9 | ⚠️ **Page 404 brandée** | ✅ | **2026-05-10** : `not-found.page.ts` (logo Nafura, dark mode, raccourcis ERP, bouton retour). Routée dans `app.routes.ts` (shell + public). |
| 15.10 | Démo seed BTP | ✅ | SOMACOM BTP SARL |

---

## 🚀 Plan d'attaque (sprint courant)

Ordre priorisé fort levier / faible risque d'abord :

### Vague 1 — Quick wins (séquentiel, agent principal)

1. ✅ **Task 1.2** — Migration `\| currency` → `\| mad` (21 fichiers) [2026-05-10]
2. ✅ **Task 1.7** — Corriger résidus accents Planning + Budget [2026-05-10]
3. ✅ **Task 15.9** — Page 404 brandée [2026-05-10]
4. ✅ **Task 14.1** — Câbler `erpAudit.log()` dans 7 facades critiques [2026-05-10]
5. ✅ **Task 7.3** — Bouton "Soumettre pour approbation" sur 5 entités (BC/DA/Contrat/Congé/FF) [2026-05-10]
6. ✅ **Task 5.7** — Liaison sortie stock → consommation chantier [2026-05-10]
7. ✅ **Task 1.3** — Script `check-no-dollar.mjs` (lint local OK) [2026-05-10] · workflow CI = follow-up
8. ❌ **Task 4.2** — Annulé : `EntityListingComponent` gère déjà loading/empty/error en interne ; les listings standalone restants sont sync (mock).
9. ✅ **Task 12.5** — Audit log EXPORT/PRINT câblé (ExportButton, EntityListing, Contrats, Budget, DAMANCOM) [2026-05-10]

### Vague 2 — Multi-agent parallèle (6 sous-agents) [2026-05-10]

10. ✅ **Task 14.2** — Tests Jasmine PaieEngine + TVA + RAS + Timbre fiscal (23 tests verts)
11. 🟡 **Task 4.6** — 4 field types MA (`ice`/`rib`/`phone-ma`/`money-ma`) ajoutés au framework + 5 formulaires migrés
12. ✅ **Task 10.6** — DGI : état 1208 (XML/XLSX + audit) + **SIMPL-IS** (TVA mensuelle) ; redirects finance → RH pour **9421 / 1208** (dédoublonnage nav)
13. ✅ **Task 12.4** — `NumberingService` centralisé (17 entités, persistance localStorage, 4 specs Jasmine, BC wiring)
14. ✅ **Task 8.3** — Multi-tenancy sociétés (`Societe` + `Etablissement` + switcher topbar)
15. ✅ **Task 9.1–9.6** — HSE : modèles CNSS, EPI 3 volets, DUER matrice + PPSPS print démo, planning **INAPTE**, registres PDF démo, TB HSE

### Reste à planifier (effort plus élevé)

- **Task 13.6** — Suite offline : IndexedDB photos, background sync, conflits métier (SW déjà en place, voir 15.5)
- **Task 12.3** — Génération PDF côté serveur (Puppeteer/Playwright)
- **Task 11.2** — Audit a11y WCAG AA (étendre au-delà du smoke pointage)
- **Task 11.3** — Pluriels ICU dans les fichiers i18n
- **Task 14.2** — Étendre tests unitaires (avancement, RG, formule K)
- ✅ **Task 8.7** — Login/2FA in-app + doc démo vs prod [2026-05-13]
- ✅ **Task 10.5** — `TvaAutoliquidationService` centralisé sous `finance/services/` [2026-05-13 R05]
- Suite **Task 4.6** — Migrer le reste des formulaires achats/ventes/RH au fil de l'eau
- Suite **Task 12.4** — Câbler `NumberingService` dans DA/AO/CT/FF/FM/SIT/AVN (BC déjà câblé)
- Suite **Task 8.3** — Filtrer les datasets par `currentSocieteId` + tracer la société dans `erpAudit.log()`
