# Suivi — chantier front-ownership

**Dernière mise à jour** : 2026-07-19 — phases 0, 1 et 2 terminées et vérifiées.

---

## État

| Phase | Objet | Statut |
|---|---|---|
| 0 | Geler et cartographier | ✅ terminée |
| 1 | Récupérer les divergences | ✅ terminée |
| **2** | **Inverser la dépendance** | ✅ **terminée — 0 import `@applications` dans `platform/`** |
| 3 | Déplacer les fichiers | ⬜ à faire |
| 4 | Garde-fous ESLint | ⬜ à faire |

---

## Phase 0 — terminée

- `docs/AGENTS.md` corrigé : il désignait `platform/web/` et `products/sektor-btp/web/app/`
  comme sources canoniques, alors que ni l'un ni l'autre n'est compilé. Un tableau donne
  désormais les cibles réelles des alias, et la section « Interdit » a été reprise.
- Inventaire des divergences : [`02-INVENTAIRE-DIVERGENCES.md`](02-INVENTAIRE-DIVERGENCES.md).
- Build de référence capturé : `npx ng build --configuration development` → succès en ~45 s.

## Phase 1 — terminée

Le vivant est en avance partout. **Un seul fichier récupéré** :
`document-validation.service.spec.ts` (le service vivait déjà côté vivant, son test manquait).

Deux candidats écartés :
- `bpde-lot-import.util.ts` — **supplanté** par le framework `smart-import`
- `pages/etudes/consultation/` — supprimé par le lot 8 de l'epic étude de prix

> Découverte incidente : `smart-import` existe déjà, est piloté par schéma, embarque des
> **instructions LLM**, et livre des handlers pour article / client / employé / fournisseur /
> lot-chantier / **ouvrage** / réception-BL. Les lots 3 et 4 de l'epic étude de prix ont été
> réécrits pour s'appuyer dessus au lieu d'écrire un parseur.

## Phase 2 — terminée

**Critère de fin atteint** : `grep -rn "@applications" web/app/platform --include=*.ts` → **0**.
Vérifié par un **build AOT complet**, pas seulement un typecheck.

| Sous-phase | Couplage | Résolution |
|---|---|---|
| P2.1 | Configuration applicative (10 fichiers) | Registre `ApplicationConfig` — l'app s'enregistre depuis `app.config.ts` |
| P2.2 | **Design system → métier** (2 fichiers) | Validateurs remontés dans `platform/lib/validators`, ré-export côté app |
| P2.3 | Intégrations réglementaires (7 fichiers) | CNSS/DGI/OMPIC/banques rapatriées dans Sektor ; `whatsapp` reste et passe par `INTEGRATION_AUDIT_PORT` |
| P2.4 | Emplacements de shell (4 fichiers) | `SHELL_EXTENSIONS` + `ONBOARDING_WIDGETS_PORT` |
| P2.5 | Routes d'administration (3 imports) | L'app compose `ADMINISTRATION_ROUTES` + `ADMINISTRATION_APP_ROUTES` |

**Écarts assumés par rapport au plan initial :**

1. **P2.1 — registre de module au lieu d'un `InjectionToken`.** Ces valeurs sont calculées une
   fois depuis le hostname et lues depuis des gardes de route et des corps de méthode dans des
   classes volumineuses (`auth.facade.ts` > 1 000 lignes). Un jeton aurait imposé de modifier
   dix constructeurs pour une valeur qui ne varie jamais.

2. **P2.2 — les atomes n'ont pas bougé.** Le plan prévoyait de déplacer `ice-input` et
   `rib-input` dans Sektor. Impossible : l'organisme `entity-detail` de la plateforme les
   utilise. Seuls les **validateurs purs** sont remontés. ICE / RIB / phone-MA restent donc
   marocains dans le design system — cohérent avec le périmètre produit, et ce sera une
   modification de code, pas une migration, le jour où un produit non marocain apparaîtra.

3. **P2.4 — trouvaille non prévue.** `onSocieteSwitcherChange` (36 lignes) vivait dans le shell
   plateforme avec des identifiants de démo ERP **en dur** (`soc-somacom-btp`…) pour choisir une
   couleur de thème. Rapatrié dans `SocieteSwitcherComponent`.

4. **Onboarding : port et non emplacement.** Les widgets étaient chargés paresseusement derrière
   `environment.onboardingV2Enabled`. Un jeton statique aurait perdu le découpage de bundle et
   le drapeau.

**Invariant tenu** : tout emplacement et tout port est optionnel. Un emplacement sans extension
ne rend rien, le port d'audit retombe sur un no-op. **La plateforme compile et fonctionne seule** —
c'était l'objectif.

---

## Phase 3 — à faire

Déplacer les fichiers, `web/` disparaît. Voir [`01-PLAN.md`](01-PLAN.md) §Phase 3.

**Prérequis désormais acquis** : le découplage est fait, donc ce n'est plus qu'un déplacement.

Points d'attention :
- codemod sur **732** occurrences de `@applications/*` → `@app/*`
- `angular.json`, `tsconfig*.json`, `.storybook`, `playwright.config.ts`, `tsconfig.spec.json`
- `products/sektor-btp/Dockerfile.web` référence `web/nginx.conf` et `web/dist/...`
- `toolchain/ops/nlops.sh` (`release-frontend`) et le tableau de déploiement d'`AGENTS.md`
- boucle de vérification disponible : `npx ng build --configuration development` (~45 s)

## Phase 4 — à faire

Garde-fous ESLint (`no-restricted-imports` sur `platform/web/**`), frontière du design system,
contrôle anti-duplication, section dédiée dans `AGENTS.md`.

Sans eux, la dette se reformera — c'est la phase la plus importante à long terme.
