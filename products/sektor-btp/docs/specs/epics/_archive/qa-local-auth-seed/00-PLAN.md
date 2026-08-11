---
kind: epic-plan
app: sektor-btp
slug: qa-local-auth-seed
module: onboarding
raster_feature: ERP-40
status: active
language: fr
---

# QA local — auth unique + seed onboarding

> Un seul user/tenant local pour humain + agents (Cursor / Claude), auto-auth sans mdp,
> avec le **même seed référentiel** qu’un owner passé par l’onboarding.

**Objectif** : remplacer le bricolage `cursor.qa` (user SQL sans preset) par un tenant+owner QA
reproductible, auto-authentifié en `dev-up`, pour que toi et les agents voyiez **les mêmes données**.
**Périmètre code** (impl) : `products/sektor-btp/backend/app/…/dev/`, `…/onboarding/`,
`web/src/environments/environment.cursor.ts`, `toolchain/ops/`, seeds Liquibase / preset,
`.cursor/rules/cursor-qa-browser.mdc`, `CLAUDE.md`.
**Hors scope** : Keycloak passwordless ; activer quoi que ce soit sur staging/prod K8s ;
refonte complète des checklists `web/docs/qa/` (Lot 4 inventaire only) ; UI login fancy.

---

## 1. Verdict

Les agents (et souvent le Mode B) ne peuvent pas saisir un mot de passe Keycloak. Le chemin
`cursor-session` + `start:erp:cursor` résout l’auth, mais le user seedé **n’a pas exécuté**
`TenantPresetOrchestratorService` / `seedReferenceData` → UoM, devises, motifs, emplacements,
familles souvent absents ou incohérents. En parallèle, l’humain en `dev-up` et l’agent ne
partagent pas toujours le même compte → remarques / états divergents. Il faut **un compte unique
local** + **auto-auth** + **seed = parcours onboarding (sans wizard UI)**.

---

## 2. Constat

### 2.1 Bloquants

**A — User Cursor QA sans onboarding.**  
`db/changelog/data/v1.1/001_cursor_qa_user.sql` INSERT user + membership + rôles sur le tenant
bootstrap Nafura. Aucun appel à `seedReferenceData()` (UoM, currencies, locations, costing,
movement motifs, item categories).

**B — Guard skip onboarding UI.**  
`onboarding-complete.guard.ts` bypass si `cursorAuthAutoLogin` — correct pour les agents, mais
confondu avec « pas besoin de seed backend ».

**C — Deux mondes d’auth.**  
Humain parfois Keycloak / staging-local ; agent Mode B cursor → données et permissions différentes.

**D — Seeds QA outdated.**  
`web/docs/qa/`, scripts `seed-qa-*.mjs`, hosts `erp.nafura.local` / namespace `nafura-erp-dev` :
périmés vs Mode B (`127.0.0.1:4200`, `localhost:8082`, staging infra). Inventaire à faire **après**
le socle auth+tenant (Lot 4).

### 2.2 Ce qui marche déjà

- `POST /api/public/dev/cursor-session` + flag `NAFURA_DEV_CURSOR_AUTH_ENABLED` (local only)
- `npm run start:erp:cursor` → auto-login zéro mdp
- JWT HS256 onboarding-dev, SUPER_ADMIN possible
- `TenantReferenceDataSeedService` = chemin seed correct (à réutiliser, pas dupliquer)

---

## 3. Cible

### 3.1 Identités (décisions figées — voir ADR)

| Élément | Valeur |
|---------|--------|
| Tenant slug | `qa-local` |
| Tenant name | `QA Local` |
| Owner email | `qa@nafuralabs.local` |
| Owner name | `QA Owner` |
| Ancien `cursor.qa@nafuralabs.local` | **Alias déprécié** → même principal ou redirect config vers `qa@…` |

### 3.2 Comportement local

1. `dev-up` full + flag cursor auth → front **et** humain + agents se connectent **sans mdp**
   comme `qa@nafuralabs.local` sur tenant `qa-local`.
2. À la **provision** du tenant QA (migrate / boot / commande one-shot) : exécuter le **même
   preset** qu’un onboarding owner (`seedReferenceData` + presets métier nécessaires), **sans**
   forcer le wizard UI.
3. API agents : `POST …/cursor-session` (email fixé ou allowlist) → Bearer ; plus tard CLI
   `qa-token`.
4. Flags **jamais** sur pods staging/prod.

### 3.3 Principe

```
auto-auth  ≠  skip seed
skip wizard UI  +  run seed backend  =  OK
```

Schéma cible :

```
[Humain | Cursor | Claude]
        │
        ▼
 environment.cursor + auto-login
        │
        ▼
 POST /api/public/dev/cursor-session  →  qa@nafuralabs.local
        │
        ▼
 tenant qa-local  (référentiel seedé via preset onboarding)
```

---

## 4. Lots

| # | Lot | Intent (1 ligne) | Dépend |
|---|-----|------------------|--------|
| 1 | **Contrat + docs agents** | Figé naming ; playbook CLAUDE + rule Cursor QA (même user, `start:erp:cursor` only) | — |
| 2 | **Provision tenant+owner** | Créer `qa-local` + `qa@…` ; appeler preset/`seedReferenceData` (pas INSERT seul) | 1 |
| 3 | **Auto-auth unifié** | pointer cursor-session / env vers `qa@…` ; déprécier `cursor.qa` | 2 |
| 4 | **Inventaire seed** | Auditer `reference-data.json`, scripts `seed-qa-*`, docs qa — keep/kill/update | 2 |
| 5 | **CLI `qa-token`** | Une commande → Bearer + `X-Tenant-Id` pour API sans browser | 3 |
| 6 | **(Option) API key locale** | `nfk_` seedée si scripts longs ; sinon JWT suffit | 5 |

Les **status / tickets** → [`00-PROGRESS.md`](./00-PROGRESS.md).

---

## 5. Décisions ouvertes

Voir [`01-ADR-decisions.md`](./01-ADR-decisions.md).

Tranché dans l’ADR : naming tenant/email ; alias `cursor.qa` ; pas de Keycloak magic-link ;
seed = réutiliser orchestrateur onboarding.

Encore ouvertes (Lot 4+) : liste exacte des données métier à seed au-delà du référentiel
(partenaires démo, chantiers QA, etc.).

---

## 6. UX

`n/a` — pas de canvas ; éventuellement écran login « email only » plus tard (hors vague 1).

---

## 7. Liens Raster

| Rôle | Id |
|------|-----|
| Feature | ERP-40 |
| Spec / ADR | ce dossier |
| Tasks | ERP-41 … ERP-45 |

---

### DoD « PLAN prêt »

- [x] Frontmatter complet
- [x] Objectif = flux mince (auth+seed local)
- [x] Lots ordonnés
- [x] ADR lié
- [x] `00-PROGRESS.md` en parallèle
