# Revue d'architecture front — état des lieux

**Date** : 2026-07-19
**Objectif de la revue** : préparer le découplage. Sektor doit posséder son code front et ne
dépendre que des bibliothèques partagées de la plateforme.

---

## Résumé

Trois constats, par ordre de gravité :

1. **Les deux répertoires que `docs/AGENTS.md` désigne comme sources canoniques sont du code mort.**
   Tout le code vivant est dans `web/app/`.
2. **La plateforme dépend de l'application** — 23 fichiers de `platform` importent `@applications/*`.
   La dépendance est à l'envers.
3. **Le design system dépend du métier marocain** — `ice-input` et `rib-input` importent des
   validateurs de l'ERP. C'est le couplage le plus grave.

S'y ajoute une violation de la règle 5 d'`AGENTS.md` : les intégrations réglementaires marocaines
(CNSS, DGI, OMPIC, e-facture) vivent dans `platform/core/integrations/`.

---

## 1. Trois arborescences, une seule vivante

### Ce que dit la configuration de build

```
web/angular.json      → browser: "src/main.ts", tsConfig: "tsconfig.app.json"
web/tsconfig.app.json → include: ["src/**/*.d.ts", "app/**/*.ts"]
web/tsconfig.json     → "@core/*"        : ["./app/platform/core/*"]
                        "@lib/*"         : ["./app/platform/lib/*"]
                        "@platform/*"    : ["./app/platform/*"]
                        "@applications/*": ["./app/applications/erp/*"]
                        "@features/*"    : ["../platform/web/features/*"]
                        "@services/*"    : ["../platform/web/features/*"]
```

### Comptage des imports depuis l'arbre compilé (`web/app`)

| Alias | Cible | Imports | Verdict |
|---|---|---|---|
| `@lib/*` | `web/app/platform/lib` | 1 368 | vivant |
| `@applications/*` | `web/app/applications/erp` | 732 | vivant |
| `@platform/*` | `web/app/platform` | 82 | vivant |
| `@core/*` | `web/app/platform/core` | 81 | vivant |
| `@features/*` | `platform/web/features` | **0** | **mort** |
| `@services/*` | `platform/web/features` | **0** | **mort** |

### Conclusion

| Répertoire | Fichiers | État |
|---|---|---|
| `web/app/platform/` | 797 | ✅ **vivant** — la plateforme réellement compilée |
| `web/app/applications/erp/` | 1 811 | ✅ **vivant** — l'application réellement compilée |
| `platform/web/` | 774 | ❌ **mort** — aucun import depuis l'arbre compilé |
| `products/sektor-btp/web/app/` | 1 786 | ❌ **mort** — référencé par un seul fichier de test |

`docs/AGENTS.md` affirme (ligne 96) que `@applications/*` pointe vers `products/sektor-btp/web/app`
et (ligne 183) que ce répertoire est la source. **C'est faux dans les deux cas.**

### Les copies mortes ont divergé

Ce ne sont pas des copies figées — chaque arbre a du contenu unique, donc aucun ne peut être
supprimé sans perte.

**`web/app/applications/erp` (vivant) vs `products/sektor-btp/web/app` (mort)** :

| Seulement dans le vivant | Seulement dans le mort |
|---|---|
| `invitations/` | `pages/chantiers/utils/bpde-lot-import.util.ts` |
| `pages/chantiers/components/chantier-equipe-tab/` | |
| `pages/chantiers/services/chantier-affectation-api.service.ts` | |
| `pages/chantiers/documents/utils/` | |

**`web/app/platform` (vivant) vs `platform/web` (mort)** :

| Seulement dans le vivant | Seulement dans le mort |
|---|---|
| `core/config/public-web-origin.ts` | `features/documents/doc-extractor/services/document-validation.service.spec.ts` |
| `core/security/guards/unauthenticated-redirect.ts` | |
| `features/documents/smart-import/` | |
| `lib/anatomy/components/organisms/tree-table/tree-table.component.spec.ts` | |

Plus une vingtaine de fichiers qui diffèrent de part et d'autre (auth, IAM, doc-extractor…).

> **Impact immédiat** : tout développement fait dans `platform/web/` ou
> `products/sektor-btp/web/app/` ne part jamais en production. Un agent qui suit `AGENTS.md`
> travaille dans le vide.

---

## 2. La dépendance est à l'envers

23 fichiers de `web/app/platform/` importent `@applications/*`. La plateforme ne peut donc pas
exister sans l'ERP Sektor — c'est exactement ce qu'`AGENTS.md` note comme dette (« Shell platform
couplé à Sektor via `@applications/*` — à découpler au 2ᵉ produit front »).

### Inventaire par nature

| # | Nature | Fichiers | Ce qui est importé |
|---|---|---|---|
| C1 | **Configuration d'application** | 8 | `APPLICATION_DEFAULT_ROUTE`, `APPLICATION_REQUIRES_TENANT`, `ACTIVE_APPLICATION_ID` depuis `@applications/config/routes` |
| C2 | **Service d'audit ERP** | 7 | `ErpAuditService` depuis `@applications/erp/shell/erp-audit.service` |
| C3 | **Extensions du shell** | 3 | `SocieteSwitcherComponent`, `SocieteService`, `onboarding-shell-widgets` |
| C4 | **Routes d'administration** | 3 | imports paresseux de `societe`, `parametres-fiscal`, `demo-reset` |
| C5 | **Notifications** | 1 | `ErpNotificationCenterAlertsComponent` |
| C6 | **⚠️ Design system → métier** | 2 | `isValidIce`, `isValidRib` depuis `@applications/erp/shared/validators` |

### C1 — Configuration d'application

```
core/application/application-context.service.ts
core/application/application-route.guards.ts
core/pages/auth-callback/auth-callback.page.ts
core/pages/login/login.page.ts
core/pages/tenant-selection/tenant-selection.page.ts
core/security/services/auth-api.service.ts
core/security/services/auth.facade.ts
core/security/services/permission.service.ts
core/tenant/tenant.context.ts
core/tenant/tenant.guard.ts
```

Le plus répandu, mais le plus simple à résoudre : ce sont trois constantes. Un jeton d'injection
fourni par l'application au démarrage suffit.

### C2 — `ErpAuditService` dans les intégrations

```
core/integrations/banques/banque-base.adapter.ts
core/integrations/cnss-damancom.adapter.ts
core/integrations/cnss-dat.adapter.ts
core/integrations/dgi-simpl-is.adapter.ts
core/integrations/efacture-dgi.adapter.ts
core/integrations/ompic.adapter.ts
core/integrations/whatsapp.adapter.ts
```

**Double problème.** Ces adaptateurs importent un service de l'ERP, *et* CNSS / DGI / OMPIC /
e-facture sont des intégrations **réglementaires marocaines** — du métier, dans `platform/`.
`AGENTS.md` règle 5 : *« Métier uniquement sous `products/<app-id>/` »*.

La bonne résolution n'est pas d'abstraire l'audit : c'est de **déplacer ces intégrations dans
Sektor**. Elles n'ont rien à faire dans une plateforme générique. Seul `whatsapp` est réellement
transverse.

### C6 — Le plus grave

```typescript
// web/app/platform/lib/anatomy/components/atoms/ice-input/ice-input.component.ts
import { isValidIce, stripNonDigits } from '@applications/erp/shared/validators';

// web/app/platform/lib/anatomy/components/atoms/rib-input/rib-input.component.ts
import { isValidRib, stripNonDigits } from '@applications/erp/shared/validators';
```

**Le design system atomique dépend du code métier de l'ERP.** Un atome — le niveau le plus bas de
l'anatomie — importe des validateurs applicatifs.

Et ICE (Identifiant Commun de l'Entreprise) et RIB sont des notions **marocaines**. Un design system
générique ne devrait pas les connaître. La source des validateurs le confirme :
`web/app/applications/erp/shared/validators/ma-validators.spec.ts`.

---

## 3. Ce que ça empêche

| Conséquence | Détail |
|---|---|
| Impossible d'ajouter un 2ᵉ produit front | La plateforme ne compile pas sans Sektor |
| Impossible de tester la plateforme isolément | Toute suite de tests plateforme tire l'ERP |
| Le design system n'est pas réutilisable | Il embarque des règles marocaines |
| La documentation ment | Deux répertoires canoniques sont morts |
| Divergence silencieuse | Quatre arbres, personne ne sait lequel fait foi |
| Généricité compromise | Réglementaire marocain dans `platform/` (cf. lot 10 de l'epic étude) |

---

## 4. Architecture cible

### Principe

**Une seule direction de dépendance : application → plateforme.** Jamais l'inverse.

Ce qui est propre à Sektor (métier BTP, réglementaire marocain, shell ERP) vit dans
`products/sektor-btp/`. Ce qui est réutilisable par un futur produit vit dans `platform/`.

```
platform/web/                 ← bibliothèques partagées, ZÉRO import applicatif
  core/                       auth, tenancy, http, i18n, navigation, shell à emplacements
  lib/design-system/          tokens, primitives
  lib/anatomy/                composants génériques
  features/                   transverses : IAM, notifications, documents

products/sektor-btp/web/      ← Sektor possède TOUT son front
  angular.json, package.json, tsconfig*.json
  src/                        main.ts, index.html, environments, styles
  app/
    config/                   APP_CONFIG fourni à la plateforme
    shell/                    société, audit, widgets d'onboarding
    integrations/             CNSS, DGI, OMPIC, e-facture, banques  ← rapatriées
    shared/validators/        ICE, RIB  ← + les atomes correspondants
    pages/                    le métier BTP

web/                          ← disparaît
```

### Les six couplages et leur résolution

| # | Couplage | Résolution |
|---|---|---|
| C1 | Constantes d'application | `APP_CONFIG` — `InjectionToken` fourni par l'app dans `app.config.ts`, consommé par la plateforme |
| C2 | `ErpAuditService` + intégrations MA | **Déplacer** les intégrations réglementaires dans Sektor. Pour `whatsapp` (transverse) : port `AuditPort` + jeton |
| C3 | Extensions du shell | **Emplacements nommés** : la plateforme expose des slots, l'app enregistre ses composants via un jeton |
| C4 | Routes d'administration | L'app **contribue** ses routes via un jeton ; la plateforme les fusionne |
| C5 | Alertes de notification | Même mécanisme d'emplacement que C3 |
| C6 | `ice-input` / `rib-input` | **Déplacer atomes + validateurs dans Sektor.** Ils sont marocains, pas génériques |

Aucune de ces résolutions n'est exotique — ce sont des jetons d'injection et des emplacements de
composants, mécanismes standards d'Angular.

---

## 5. Ce qu'il faut décider

| # | Question | Décision |
|---|---|---|
| A1 | Sektor devient-il un workspace Angular **autonome** ? | ✅ **Oui** — son `angular.json` et son `package.json`. Suit la convention du dépôt : aucun `package.json` racine, et les trois fronts `marketing/*` ont déjà le leur |
| A2 | La plateforme est-elle consommée par **chemins tsconfig** ou comme **bibliothèque publiée** ? | ✅ **Chemins tsconfig**, avec un `package.json` déclaratif dans `platform/web` fixant le contrat de version (`peerDependencies`). Promotion en bibliothèque au 2ᵉ produit front |
| A3 | Que fait-on des divergences entre arbres morts et vivants ? | Revue fichier par fichier des ~25 divergences. Le vivant fait foi par défaut ; récupérer explicitement ce qui n'existe que dans le mort |
| A4 | `whatsapp` : plateforme ou Sektor ? | **Plateforme** — seule intégration réellement transverse du lot |

Le plan d'exécution est dans `01-PLAN.md`.

---

## 6. Nettoyage repéré au passage

| Constat | Action |
|---|---|
| `products/sektor-btp/web/node_modules/` — 1 106 paquets, **aucun `package.json`** à côté | Vestige d'installation orpheline. Supprimer avant la phase 3 (avec `.angular/` et `dist/`) |
| `platform-app-shell.component.ts` — au moins 1 843 lignes | Dette distincte. **Ne pas** refondre pendant ce chantier |
| `web/` contient des documents de travail (`audit_claude.md`, `migration_plan.md`, `SECURITY_REVIEW.md`, `SUPER_ADMIN_WORKFLOW.md`, `_TESTING_GUIDE.md`) | Trier lors du déplacement : conserver dans `products/sektor-btp/docs/` ou supprimer |
| `web/docs/specs/` — roadmaps historiques | `AGENTS.md:191` note déjà que leurs chemins sont périmés. À déplacer dans `products/sektor-btp/docs/` avec un avertissement d'obsolescence |
