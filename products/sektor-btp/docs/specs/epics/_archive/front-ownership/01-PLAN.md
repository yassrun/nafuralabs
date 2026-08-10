# Plan d'exécution — Sektor possède son front

**Prérequis de lecture** : `00-REVUE-ARCHI.md`.

**Principe directeur** : une seule direction de dépendance — **application → plateforme**, jamais
l'inverse.

⚠️ **Aucune de ces phases ne doit être mélangée à du développement fonctionnel.** Ce sont des
opérations de réorganisation : chacune doit se terminer par un build vert et un comportement
applicatif identique.

---

## Phase 0 — Geler et cartographier

**Objectif** : éviter d'aggraver la divergence pendant l'opération.

| # | Tâche |
|---|---|
| P0.1 | Annoncer le gel : plus aucune modification dans `platform/web/` ni `products/sektor-btp/web/app/` (les arbres morts) |
| P0.2 | Corriger `docs/AGENTS.md` lignes 96 et 183 : documenter que le code vivant est `web/app/`, avec un renvoi vers cette revue. La doc doit dire la vérité **avant** qu'on la change |
| P0.3 | Produire la liste exhaustive des divergences : `diff -rq` sur les deux paires, exportée en fichier de suivi |
| P0.4 | Vérifier que le build de référence passe et capturer l'empreinte du `dist` (taille, liste des chunks) — sert de comparaison à chaque phase |

---

## Phase 1 — Récupérer ce qui n'existe que dans les arbres morts

**Objectif** : ne rien perdre avant de supprimer.

Pour chacune des ~25 divergences, décider explicitement :

| Cas | Décision par défaut |
|---|---|
| Fichier seulement dans le **vivant** | garder tel quel |
| Fichier seulement dans le **mort** | examiner : reprendre s'il apporte quelque chose, sinon acter la perte par écrit |
| Fichier **différent** des deux côtés | le vivant fait foi ; comparer et reporter manuellement ce qui manque |

Candidats connus à la reprise :

| Fichier | Arbre | À examiner |
|---|---|---|
| `pages/chantiers/utils/bpde-lot-import.util.ts` | `products/` mort | fonctionnalité d'import à récupérer ? |
| `features/documents/doc-extractor/services/document-validation.service.spec.ts` | `platform/` mort | test à reprendre |

**Livrable** : un tableau de décisions, une ligne par divergence, validé avant la phase 2.

---

## Phase 2 — Inverser la dépendance *(le cœur)*

**Objectif** : zéro import `@applications/*` dans `web/app/platform/`.

À faire **en place**, dans l'arborescence actuelle, avant tout déplacement de fichiers. Déplacer et
découpler en même temps rendrait toute régression impossible à diagnostiquer.

### P2.1 — C1 : configuration d'application (8 fichiers)

```typescript
// platform — core/application/app-config.token.ts
export interface AppConfig {
  readonly applicationId: string;
  readonly defaultRoute: string;
  readonly requiresTenant: boolean;
}
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
```

L'application le fournit dans son `app.config.ts` ; la plateforme l'injecte à la place des imports
`@applications/config/routes`.

Aucun changement de comportement — c'est le même triplet de constantes, obtenu autrement.

### P2.2 — C6 : libérer le design system (2 fichiers) — *à faire tôt*

Le couplage le plus grave, et l'un des plus simples à défaire.

- déplacer `shared/validators/ma-validators.ts` (et son `.spec.ts`) → reste dans Sektor
- déplacer `lib/anatomy/components/atoms/ice-input/` et `rib-input/` → Sektor
- retirer leurs exports de l'index public de l'anatomie
- corriger les imports des pages qui les consomment (`@lib/anatomy` → chemin Sektor)

ICE et RIB sont des notions marocaines : elles n'ont pas leur place dans un design system générique.

### P2.3 — C2 : rapatrier les intégrations réglementaires (7 fichiers)

Déplacer de `platform/core/integrations/` vers `products/sektor-btp/.../integrations/` :

```
cnss-damancom.adapter.ts     cnss-dat.adapter.ts
dgi-simpl-is.adapter.ts      efacture-dgi.adapter.ts
ompic.adapter.ts             banques/
```

Le couplage à `ErpAuditService` disparaît de lui-même : ces fichiers rejoignent l'ERP.

Restent dans la plateforme : `whatsapp.adapter.ts` (transverse) et le contrat d'intégration
générique. Pour l'audit, y déclarer un port :

```typescript
export interface AuditPort { record(event: AuditEvent): void; }
export const AUDIT_PORT = new InjectionToken<AuditPort>('AUDIT_PORT');
```

Mettre à jour le commentaire de `core/integrations/index.ts:13` qui renvoie vers
`@applications/erp/integrations/...`.

### P2.4 — C3 et C5 : emplacements de shell (4 fichiers)

La plateforme expose des emplacements nommés ; l'application y enregistre ses composants.

```typescript
export type ShellSlot =
  | 'header-tenant-switcher'
  | 'notification-center-alerts'
  | 'onboarding-widgets';

export const SHELL_EXTENSIONS = new InjectionToken<ShellExtension[]>('SHELL_EXTENSIONS');
```

`platform-app-shell.component.ts` rend les extensions déclarées au lieu d'importer
`SocieteSwitcherComponent`. Conserver le chargement paresseux pour les widgets d'onboarding.

⚠️ `platform-app-shell.component.ts` fait **1 843 lignes au moins** (l'import paresseux est à la
ligne 1843). Ne pas entreprendre sa refonte ici : se limiter à remplacer les trois points de
couplage. Sa taille est un sujet distinct, à noter comme dette.

### P2.5 — C4 : routes contribuées (3 imports paresseux)

```typescript
export const APP_ROUTE_CONTRIBUTIONS = new InjectionToken<RouteContribution[]>('APP_ROUTE_CONTRIBUTIONS');
```

`administration.routes.ts` fusionne les routes contribuées par l'application au lieu de les importer
en dur.

### Critère de fin de phase 2

```bash
grep -rn "@applications" web/app/platform --include=*.ts | wc -l   # doit valoir 0
```

Build vert, application identique. **Ne pas passer à la phase 3 avant.**

---

## Phase 3 — Déplacer les fichiers

**Objectif** : Sektor possède son front ; `web/` disparaît.

Le découplage étant fait, ce n'est plus qu'un déplacement.

### P3.1 — Cible

```
platform/web/                 ← remplacé par le contenu de web/app/platform/
  core/  lib/  features/

products/sektor-btp/web/      ← remplacé par le contenu de web/app/applications/erp/
  angular.json  package.json  tsconfig*.json  nginx.conf  ngsw-config.json
  src/          ← ex web/src : main.ts, index.html, environments, styles
  app/          ← le front Sektor
  public/  tests/  .storybook/
```

`web/` est supprimé.

**Ordre imposé** : d'abord écraser les arbres morts par les vivants (le contenu vivant devient
canonique là où la doc l'attendait), ensuite supprimer `web/app`, enfin déplacer le workspace.

### P3.2 — Workspace autonome et dépendances npm *(décision A1 — actée)*

**Sektor a son propre `angular.json` et son propre `package.json`.**

Cette décision suit la convention déjà en vigueur : **il n'existe aucun `package.json` racine**, et
`marketing/corporate`, `marketing/products/mbs-studio`, `marketing/products/zenith` ont chacun le
leur. Sektor devient le quatrième front autonome du dépôt, pas une exception.

#### Le point à traiter : de quoi dépend la plateforme ?

`platform/web/` est consommé **par chemins tsconfig** (décision A2), donc ses fichiers sont compilés
dans le contexte de Sektor et utilisent le `node_modules` de Sektor. Ses besoins réels — Angular,
RxJS — restent implicites. Tant qu'il n'y a qu'un produit, ça fonctionne. À deux produits, rien
n'empêcherait une dérive de version.

**Résolution** : donner à `platform/web/` un `package.json` **déclaratif, non installé**.

```jsonc
// platform/web/package.json
{
  "name": "@nafura/platform-web",
  "private": true,
  "description": "Bibliothèques front partagées. Consommé par chemins tsconfig, jamais installé.",
  "peerDependencies": {
    "@angular/core": "^19.0.0",
    "rxjs": "~7.8.1",
    "typescript": "~5.6.3"
  }
}
```

Il ne sert pas à installer quoi que ce soit : il **documente le contrat de version** que tout
consommateur doit respecter. Un contrôle d'intégration compare ces `peerDependencies` aux
`dependencies` de chaque produit consommateur et échoue en cas d'écart.

**Ce qu'on ne fait pas** : pas de workspaces npm à la racine, pas de publication de paquet, pas de
build de bibliothèque Angular. Ce serait la solution du dépôt à plusieurs produits front — on n'en a
qu'un. Promouvoir `platform/web` en bibliothèque publiée le jour venu est un changement de
configuration, pas une migration de données : cohérent avec la règle du lot 10 de l'epic étude.

#### Nettoyage préalable

`products/sektor-btp/web/node_modules/` contient **1 106 paquets sans `package.json` associé** —
vestige d'une installation faite quand ce répertoire était le workspace. À supprimer avant de
déplacer quoi que ce soit, sinon l'installation du nouveau workspace se fera par-dessus des
résidus.

```bash
rm -rf products/sektor-btp/web/node_modules products/sektor-btp/web/.angular products/sektor-btp/web/dist
```

Vérifier que `.gitignore` couvre bien ces chemins à leur nouvel emplacement.

#### Fichiers à déplacer depuis `web/`

| Fichier | Devient |
|---|---|
| `package.json`, `package-lock.json` | `products/sektor-btp/web/` — renommer `"name"` de `project-fountain` en `sektor-btp-web` |
| `angular.json` | idem — ajuster `outputPath`, `index`, `browser`, `assets`, `styles` |
| `tsconfig*.json` | idem — voir P3.2bis |
| `nginx.conf`, `ngsw-config.json`, `proxy.conf.json` | idem |
| `.eslintrc.json`, `eslint-rules/` | idem, + les règles de frontière de la phase 4 |
| `.storybook/`, `playwright*.config.ts` | idem |
| `public/`, `src/`, `tests/`, `tools/`, `scripts/` | idem |
| `docs/` | fusionner dans `products/sektor-btp/docs/` |

`outputPath` passe de `dist/project-fountain` à `dist/sektor-btp-web` — répercuter dans le
Dockerfile (P3.3).

### P3.2bis — Chemins tsconfig

`products/sektor-btp/web/tsconfig.json` :

```json
"paths": {
  "@core/*":     ["../../../platform/web/core/*"],
  "@lib/*":      ["../../../platform/web/lib/*"],
  "@platform/*": ["../../../platform/web/*"],
  "@features/*": ["../../../platform/web/features/*"],
  "@app/*":      ["./app/*"]
}
```

`@applications/*` **disparaît** : l'application ne se référence plus elle-même par un alias
plateforme. Remplacer ses 732 usages par `@app/*` — opération mécanique, mais volumineuse : la
faire par un codemod scripté, pas à la main.

Ajuster `angular.json` (chemins relatifs), `tsconfig.app.json` (`include`), `.storybook`,
`playwright.config.ts`, `tsconfig.spec.json`.

### P3.3 — Docker et ops

`products/sektor-btp/Dockerfile.web` référence aujourd'hui :

```dockerfile
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY web/dist/project-fountain/browser /usr/share/nginx/html
```

À réécrire sur `products/sektor-btp/web/nginx.conf` et
`products/sektor-btp/web/dist/sektor-btp-web/browser`. Le commentaire d'en-tête du Dockerfile décrit
la commande de build (`cd web && npm run build:prod`) — le corriger aussi.

Mettre à jour `toolchain/ops/nlops.sh` (`release-frontend`, `release-app`) et le tableau
« Quel deploy après merge ? » d'`AGENTS.md` : la ligne `web/**` disparaît, tout passe par
`products/sektor-btp/**`.

Vérifier également les chemins dans `.dockerignore` racine et `web/.dockerignore`.

### P3.4 — Documentation

Reprendre `docs/AGENTS.md` : modèle monorepo, tableau « Où mettre le code », section « Interdit »
(la ligne 183 sur la duplication devient sans objet), dette connue.

---

## Phase 4 — Garde-fous

**Objectif** : que la dette ne se reforme pas. C'est la phase la plus importante à long terme —
sans elle, on refera le même constat dans deux ans.

### P4.1 — Frontière de dépendance en ESLint

Le dépôt a déjà un répertoire `eslint-rules/` — s'y greffer plutôt que d'ajouter un outil.

```json
{
  "files": ["platform/web/**/*.ts"],
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        { "group": ["@app/*", "@applications/*", "**/products/**"],
          "message": "La plateforme ne doit jamais importer d'une application. Utiliser un jeton d'injection." }
      ]
    }]
  }
}
```

### P4.2 — Frontière design system

Interdire à `platform/web/lib/**` d'importer depuis `platform/web/features/**` et
`platform/web/core/**`. Le design system ne dépend de rien.

### P4.3 — Contrôle anti-duplication et cohérence de versions

Un script d'intégration qui échoue si :
- un répertoire `web/` réapparaît à la racine ;
- un chemin de `tsconfig` d'un produit pointe vers un autre produit ;
- les `dependencies` d'un produit consommateur ne satisfont pas les `peerDependencies` déclarées
  par `platform/web/package.json` (contrat de version, P3.2).

Le troisième contrôle est ce qui rend tenable la consommation par chemins tsconfig : sans lui, la
dérive de version au 2ᵉ produit passerait inaperçue jusqu'à une erreur de compilation obscure.

### P4.4 — Sanctuariser la vérité dans `AGENTS.md`

Une section explicite : où vit le code front, quelle est la direction de dépendance, quels alias
existent. C'est l'absence de cette section qui a permis la dérive.

---

## Séquencement et risque

| Phase | Effort | Risque | Réversible |
|---|---|---|---|
| 0 — Geler et cartographier | S | nul | — |
| 1 — Récupérer les divergences | M | faible | oui |
| 2 — Inverser la dépendance | **L** | **moyen** | oui, par commit |
| 3 — Déplacer les fichiers | L | moyen — beaucoup de chemins | oui, mais lourd |
| 4 — Garde-fous | S | nul | — |

**Recommandation** : phases 0 et 1 immédiatement, phase 2 par sous-phases indépendantes (P2.1 à P2.5
peuvent être cinq PR distinctes), phase 3 en une seule opération dédiée, phase 4 dans la foulée.

**Ne pas faire les phases 2 et 3 dans la même PR.** Découpler puis déplacer : deux natures de
changement, deux diagnostics de régression différents.

---

## Articulation avec l'epic étude de prix

Le chantier **P1** de `../etude-prix-unifiee/00-PROGRESS.md` renvoie ici.

**Blocage** : le lot 2 de l'epic étude (dossier d'étude + wizard) crée des pages front. Il ne doit
pas démarrer avant la fin de la **phase 3**, sinon il faudra migrer ces pages une seconde fois.

En revanche, les lots **9** (référentiel), **1** (fusion du modèle) et **8** (suppression des tables)
sont **purement backend** — ils peuvent avancer en parallèle de tout ce chantier.

**Chemin critique conseillé** :

```
front : phases 0 → 1 → 2 → 3 → 4
back  : lot 9 → lot 1 → lot 8            (en parallèle)
                                   puis  → lot 2 → 3 → 4 → 6 → 5 → 7
```
