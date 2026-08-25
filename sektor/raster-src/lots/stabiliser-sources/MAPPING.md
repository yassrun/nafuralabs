# Mapping socle vs dossiers actuels

> SSOT du lot `stabiliser-sources`. Gelé par SEKTOR-83. Aucun BC inventé. Platform / anatomy : **laisser**.

Cible web réelle (Angular `sourceRoot` vide) :

```text
sektor/sources/web/app/socle/
sektor/sources/web/app/<domaine>/
sektor/sources/web/src/          ← bootstrap Angular, on n’y touche pas
```

Cible backend :

```text
sektor/sources/backend/modules/socle/
sektor/sources/backend/modules/<nom>/   ← jars existants
sektor/sources/backend/app/             ← ErpApplication + gradle boot
```

---

## Web — socle (`app/socle/`)

| As-is | To-be |
|-------|--------|
| `app/config/` | `app/socle/config/` |
| `app/shell/` | `app/socle/shell/` |
| `app/onboarding/` | `app/socle/onboarding/` |
| `app/invitations/` | `app/socle/invitations/` |
| `app/integrations/` | `app/socle/integrations/` |
| `app/app.config.ts` | `app/socle/app.config.ts` |
| `app/app.routes.ts` | `app/socle/app.routes.ts` |
| `app/app.component.ts` | `app/socle/app.component.ts` |
| `app/administration-routes.ts` | `app/socle/administration-routes.ts` |
| `app/styles/` | `app/socle/styles/` |
| `app/routes/erp.routes.generated.ts` | `app/socle/routes/erp.routes.generated.ts` |
| `app/pages/dashboard/` | `app/socle/dashboard/` |
| `app/pages/administration/` | `app/socle/administration/` |
| `app/ARCHITECTURE.md` | `app/socle/ARCHITECTURE.md` (chemins to-be en SEKTOR-86) |

`app/shared/` → `app/socle/shared/` (transverse app, pas un domaine).

`src/main.ts` : retarget l’import `AppComponent` / `appConfig` vers `app/socle/…`.

## Web — domaines (fusion `pages/<x>/` → `app/<x>/`)

Aucun renommage. Si le dossier `app/<x>/` existe déjà, y fusionner `pages/<x>/`.

| As-is | To-be |
|-------|--------|
| `app/etudes/` + `app/pages/etudes/` | `app/etudes/` |
| `app/chantiers/` + `app/pages/chantiers/` | `app/chantiers/` |
| `app/achats/` + `app/pages/achats/` | `app/achats/` |
| `app/ventes/` + `app/pages/ventes/` | `app/ventes/` |
| `app/finance/` + `app/pages/finance/` | `app/finance/` |
| `app/rh/` + `app/pages/rh/` | `app/rh/` |
| `app/hse/` + `app/pages/hse/` | `app/hse/` |
| `app/marches/` + `app/pages/marches/` | `app/marches/` |
| `app/inventory/` + `app/pages/inventory/` | `app/inventory/` |
| `app/pages/catalogue/` | `app/catalogue/` |
| `app/approbations/` + `app/pages/approbations/` | `app/approbations/` |
| `app/analytics/` + `app/pages/analytics/` | `app/analytics/` |
| `app/pilotage/` + `app/pages/pilotage/` | `app/pilotage/` |
| `app/pages/pilotage-analyses/` | `app/pilotage-analyses/` |

**Ne pas fusionner :** `inventory` × `catalogue` · `uom` × `unit-of-measures` × `uo-mcategories` (dette, rapport SEKTOR-85).

Après fusion : **plus de `app/pages/`**.

## Web — laisser

| Zone | Pourquoi |
|------|----------|
| `src/environments/`, `src/index.html`, `src/styles.scss`, `src/main.ts` (fichier, pas le contenu d’import) | bootstrap Angular |
| `nafura-platform/sources/web/**` | platform / anatomy |
| `public/` | assets |
| aliases npm / node_modules | SEKTOR-86 seulement pour tsconfig |

SEKTOR-86 : un alias `@platform/*` + `@app/*` + `@env`. Drop `@core` `@lib` `@features` `@services`. Réécrire les imports Sektor.

---

## Backend — socle (`modules/socle/`)

Package Java `ma.nafura.erp` (et `ma.nafura.sektor` kernel) :

| As-is sous `app/src` | To-be |
|----------------------|--------|
| `onboarding/**` | `modules/socle` |
| `invitation/**` | `modules/socle` |
| `dev/**` (cursor-auth, QA local) | `modules/socle` |
| `print/SektorTenantIdentityProvider.java` | `modules/socle` |
| `ai/TenantAiRuntimePreferenceAdapter.java` | `modules/socle` |
| `ai/AiProvidersAdminController.java` | `modules/socle` |
| `config/DemoSeedProperties.java` | `modules/socle` |
| `config/DemoSeedRuntimeGuardAspect.java` | `modules/socle` |
| `ma.nafura.sektor.ai/**` (prompt, help, nav registries) | `modules/socle` |
| `ma.nafura.sektor.search/**` (registries search multi-domaine) | `modules/socle` |

## Backend — modules existants (pas le socle)

| As-is sous `app/src` | To-be |
|----------------------|--------|
| `etudes/**` (+ tests) | `modules/etudes` |
| `catalogue/**` (+ tests) | `modules/catalogue` |

## Backend — `app/` assembler

| Fichier | Reste |
|---------|--------|
| `ErpApplication.java` | `app/` |
| `app/build.gradle` | `app/` (dépend de `:sektor:socle` + modules existants) |

**Ne pas** créer de module item/stock fusionné. **Ne pas** toucher `nafura-platform/sources/backend`.

---

## Interdit (tout le lot)

- Plans, décisions et preuves Raster
- Inventer / renommer un BC
- Déplacer anatomy / platform
- Changer un comportement métier
- Réécrire l’UI
