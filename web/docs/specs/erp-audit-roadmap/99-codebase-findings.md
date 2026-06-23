# 99 — Trouvailles techniques (analyse codebase)

> Trouvailles complémentaires à l'audit UX, identifiées par lecture du code existant.
> Servent de **causes-racines techniques** ou de **dette à anticiper** lors des tâches 01–15.

## Architecture & dépendances

### TF-01 — Causes-racines de F-03 (currency `$`)

**Localisation** : `app/platform/lib/anatomy/components/organisms/data-table/data-table.component.ts:157,186`

```html
@case ('currency') {
  {{ $any(getFieldValue(row, col.field)) | currency }}
}
```

Le pipe Angular `| currency` sans paramètres utilise :
- `LOCALE_ID` provider → si non défini → `en-US`
- `DEFAULT_CURRENCY_CODE` → si non défini → `USD`
- Symbole : `$`

**Impact** : tout `type: 'currency'` dans les `columns.ts` config-driven affiche `$XX,XXX.XX`.

**Fix** : Task 1.1 + 1.2 dans `01-foundations.md`. Une fois `LOCALE_ID = 'fr-MA'` et `DEFAULT_CURRENCY_CODE = 'MAD'`, le pipe inchangé affichera correctement.

**Alternative** : créer pipe `mad` et remplacer dans le data-table — plus explicite mais plus de churn.

---

### TF-02 — Bug du double active sidebar (résolu)

**Constat lors de la session du 2026-05-09** : sur `/chantiers/planning`, les items « Mes chantiers » ET « Planning » étaient marqués actifs simultanément.

**Cause** : `routerLinkActive` du shell utilisait `[routerLinkActiveOptions]="{ exact: false }"` hardcodé. Le path `/chantiers` étant un préfixe de `/chantiers/planning`, les deux étaient actifs.

**Fix appliqué** :
1. Ajout de `exactMatch?: boolean` dans `SidebarNode` type
2. Shell template utilise `{ exact: item.exactMatch ?? false }`
3. Nav entry « Mes chantiers » a `exactMatch: true`

**Pattern à propager** : tout nav node dont la route est préfixe d'autres routes doit avoir `exactMatch: true`.

---

### TF-03 — Bug `BUDGET_CHANTIER_ROUTES is not iterable` (résolu)

**Cause** : `erp.routes.generated.ts` importait statiquement `BUDGET_CHANTIER_ROUTES` et le spreadait. Le module `permission.guard` créait une dépendance circulaire qui rendait la valeur `undefined` au moment du spread.

**Fix appliqué** : converti en `loadChildren` (lazy import) qui évite le cycle.

**Convention à propager** : éviter les imports statiques de routes dans le fichier généré. Toujours utiliser `loadChildren: () => import(...).then(m => m.X_ROUTES)`.

---

### TF-04 — `chantier-detail-placeholder.page.ts` est un placeholder confirmé

**Localisation** : `app/applications/erp/pages/chantiers/detail/chantier-detail-placeholder.page.ts:42-46`

```html
<nf-empty-state
  icon="construction"
  title="Chantier introuvable"
  message="Le chantier demande n'existe pas dans le mock courant."
  ...
```

Le code utilise `getChantierById(id)` qui retourne `undefined` si l'id n'est pas dans le seed → empty state. F-01 vient de là.

**Fix** : Task 2.1 dans `02-chantiers-bugs.md` (créer vraie fiche détail).

---

### TF-05 — `routePermissionGuard` à wirer correctement

**Constat** : `permission.guard` est utilisé dans `BUDGET_CHANTIER_ROUTES` mais pas systématique partout.

**Pattern attendu** : chaque route module devrait avoir son guard avec `data.permissions`.

**Action future** : audit transverse de toutes les routes pour appliquer les guards manquants.

---

## Patterns architecturaux à respecter

### Pattern config-driven listing/detail

```
pages/<module>/<entity>/
├── <entity>-listing/
├── <entity>-detail/
├── config/
│   ├── listing/{columns,filters,routes,index}.ts
│   └── detail/{config,fields,sections,routes,index}.ts
├── models/index.ts
└── services/{<entity>-api.service,<entity>.facade,index}.ts
```

**Modules de référence** :
- ✅ `inventory/` (~70% complet)
- ✅ `achats/` (5 entités complètes)
- ✅ `ventes/` (6 entités complètes, sauf retenues-garantie standalone)
- ✅ `etudes/` (4 entités complètes)
- ✅ `rh/` (3 entités complètes)
- ✅ `hse/` (4 entités stub à compléter)

**Patterns d'erreurs vus** (corrigés en session précédente) :
- `FieldConfig` au lieu de `DetailFieldConfig` (TS2305)
- `'primary'/'secondary'` dans `statuses` (BadgeVariant attend `'default'/'info'`)
- `'multiselect'` au lieu de `'multi-select'`
- `SectionConfig` au lieu de `DetailSectionConfig`
- `private router = inject(Router)` qui clash avec `protected router` du base
- `ColumnConfig<T>[]` (le type n'est pas générique)

**À éviter** quand on génère du nouveau code via agent.

---

### Pattern facade vs service API

**Convention** :
- `<entity>-api.service.ts` : appels HTTP purs (typés)
- `<entity>.facade.ts` : signaux + cache + lookups + orchestration UI
- `<entity>-mock.service.ts` : mock implémentation pour dev/tests

**Pattern recommandé pour mocks** : `MockApiService` interceptant HTTP (cf DATA-02 audit) → désactivable via env. Mais actuellement chaque module a son propre mock service.

---

## Datasets mock — état actuel

**Mocks chantiers** : `app/applications/erp/chantiers/mock/seeds.ts` contient `SEED_CHANTIERS` avec 6 entrées `CH-2026-001..006`.

**Trouvaille** : l'audit pointe `CH-2025-XXX` et `PROJ-2024-XXX` dans la liste actuelle. Cela suggère qu'il existe **un autre seed** (legacy ou hardcodé inline). À traquer dans Task 1.4.

```bash
grep -rn "CH-2025\|PROJ-2024" app/applications/erp/
```

---

## Routes wired vs définies

**Modules sidebar visibles** (cf erp-nav.generated.ts) : Tableau de bord, Chantiers, Achats, Stock, Matériel, Études, Marchés, Finance, RH, Qualité/HSE, Pilotage, Approbations, Administration = **13**

**Modules routés actuellement** :
- ✅ `chantiers.routes.ts` (planning, avancements, situations, budget, listing, detail)
- ✅ `achats.routes.ts` (5 entités)
- ✅ `ventes.routes.ts` (6 entités)
- ✅ `inventory.routes.ts` (catalogue, configuration, mouvements, suivi)
- ✅ `etudes.routes.ts` (4 entités)
- ✅ `finance.routes.ts` (12 routes wired en S1)
- ✅ `rh.routes.ts` (3 entités)
- ✅ `hse.routes.ts` (4 entités stub)
- ✅ `analytics.routes.ts`
- ❌ Stock — **manquant** (sidebar pointe `/stock`, redirige vers `/`)
- ❌ Marchés — **manquant** (sidebar pointe `/marches`, redirige vers `/`)
- ❌ Pilotage — **manquant**
- ❌ Approbations — **manquant**
- ❌ Administration — **manquant** (existe `platform/features/administration` scaffolded)

→ Confirme F-09 (4 modules absents) et F-07 + F-08 (Stock + Marchés manquants).

---

## Génération de tâches : priorité d'attaque pour agents

### Vague 1 (parallèle) — Fondations + Quick wins
1. `01-foundations` (1 agent) — locale + currency + mock unifié
2. `02-chantiers-bugs` Task 2.1 (1 agent) — fiche détail réelle
3. `02-chantiers-bugs` Task 2.3 (1 agent) — routes ST + Documents

### Vague 2 — Modules manquants
4. `05-stock-module` (2 agents en parallèle, 1 par section : référentiel + mouvements)
5. `06-marches-facturation` (2 agents : contrat/avenant + facture/cautions)

### Vague 3 — UX shell
6. `03-shell-ux` (1 agent multi-tâches)
7. `04-tables-forms-states` (1 agent)
8. `11-design-system` MVP (1 agent)

### Vague 4 — Pilotage
9. `07-pilotage-approbations` (2 agents)

### Vague 5 — Spécifique MA
10. `09-hse-module` (1 agent)
11. `10-paie-fiscal-maroc` (1 agent partie paie + 1 agent partie fiscal)

### Vague 6 — Production-readiness
12. `08-administration` (2 agents : RBAC + multi-tenancy)
13. `12-exports-impressions` (1 agent)
14. `14-tests-audit` (1 agent transverse)

### Vague 7 — Polish
15. `13-rh-terrain` (1 agent + besoin tablette physique pour test)
16. `15-polish` (1 agent multi-tâches)

---

## Risques techniques anticipés

| Risque | Mitigation |
|---|---|
| Régressions sur les modules existants lors du replace currency | Test e2e qui scrape `$` en CI (cf Task 1.3) |
| Conflits de mock entre modules | Service `MockApiService` centralisé (DATA-02) |
| Performance dégradée à 1000+ entrées | Virtualisation systématique (Task 4.1) |
| RTL casse certains layouts | Test e2e dédié AR + revue manuelle DS |
| Calcul paie/fiscal erroné | Tests unit ≥ 95% + validation expert MA |
| PWA offline corrompt données | Stratégie sync conflict + test e2e dédié |
| Multi-tenancy fuit données entre tenants | Filtre `companyId` strict + test isolation |

---

## Liens utiles

- **Audit source** : `web/audit_claude.md`
- **Specs originales agents** : `docs/specs/erp-frontend-agents/`
- **Conventions code** : `docs/specs/erp-frontend-agents/00-CONVENTIONS.md`
- **Stratégie mocks** : `docs/specs/erp-frontend-agents/00-MOCK-DATA-STRATEGY.md`
- **Principes UX** : `docs/specs/erp-frontend-agents/00-UX-PRINCIPES.md`
