# Revue de la plateforme — 2026-10-07

> Revue sur trois axes : fonctionnalités et maturité, homogénéité et UX, intégration et extensibilité.
> Faite en lisant la doc (`docs/`, `ROADMAP.md`, `capabilities.json`) et le code (`RecordController`, `Lifecycle`, archétypes liste et fiche, BC démo, `lib/anatomy`). Rien n'a été lancé.
> Les chantiers qui en découlent sont les specs 01 à 10 de ce dossier, à affecter une par une.

## Synthèse

| Axe | Note | En une phrase |
|---|---|---|
| Fonctionnalités et maturité | **6,5/10** | Le cœur (record, liste, permissions, seed, capabilities) est mûr ; autour (réglages, documents, i18n, écrans publics et opérateur) non. |
| Homogénéité et UX | **6/10** | Bonne direction (un manifeste, une grammaire de filtre, un contrat d'action), mais il reste deux couches d'écrans en parallèle : l'archétype du host et l'ancien de `lib/anatomy`. |
| Intégration | **8/10** | Un produit = `app.nafura.json` + BCs, garde-fous au build et au démarrage. Ajouter un écran ou une API se fait en configuration. |
| Extensibilité | **4/10** | Rien entre « configurer » et « coder un écran entier » : pas de bloc personnalisé dans une fiche, pas de point d'accroche métier côté serveur, pas de surcharge produit. |

**Priorité** : d'abord éliminer les doublons (specs 01 à 05), parce qu'une extension posée sur deux artefacts se fait deux fois. Ensuite les points d'extension (06 à 08), qui sont ceux que Sektor demandera en premier. Puis l'habillage produit et l'approbation par permission (09, 10).

## 1. Fonctionnalités et maturité

| Domaine | Livré | Manque | Note |
|---|---|---|---|
| Modèle produit (`app.nafura.json`, BCs, capabilities désactivables, garde-fous) | Complet, validé au build (web) et au démarrage (backend) | Publication BOM / npm (après Sektor) | 8/10 |
| Record (`RecordController` : CRUD, `/properties`, `/aggregate`, `/options`, filtre, recherche, relation à un saut) | Complet ; une configuration fausse empêche le démarrage | Aucun point d'accroche métier (spec 06) | 8/10 |
| Cycle de vie (états, transitions, `requires`, `approval`, `notify`) | Livré | Conditions calculées (spec 06), approbation par permission (spec 10), multi-étapes | 6/10 |
| Listes (table, board, calendrier, arbre, filtres rapides et libres, pied de tableau) | Livré | `timeline`, `gallery`, `list` ; vues enregistrées ; 10 écrans plateforme encore sur l'ancien archétype (spec 01) | 7/10 |
| Fiche (sections, onglets, étapes, actions, import d'un document) | Livré | Section personnalisée (spec 07), champs conditionnels (spec 08), types marocains (spec 03) | 6/10 |
| Notifications, audit, IA | Livré | Voir `docs/capabilities/` | 8/10 |
| IAM / Membres | API et écrans | Écrans sur l'ancienne fiche (spec 02) ; note 7/10 dans `iam.md`, 5/10 dans `ROADMAP.md` : à réconcilier | 6–7/10 |
| Multi-organisation, pages publiques, audience externe | API et garde-fous | Console opérateur, coquille `/p/{slug}`, débit, effacement, consentement | 5/10 |
| Réglages déclarés par BC, impression et marque, i18n par BC, tableau de bord | — | Tout | 2/10 |
| Outillage (lab, build) | — | Le lab ne démarre plus ; lenteur (ROADMAP 00) | 3/10 |

## 2. Homogénéité et UX

### Ce qui est homogène

- Un seul format de manifeste ; schémas validés au build.
- Une seule grammaire de filtre, partagée par l'API et l'écran.
- `PageAction` : même contrat d'action pour la liste et la fiche.
- L'archétype gère l'en-tête, le fil d'Ariane, la barre d'enregistrement, les états vide, erreur et chargement, et le filtrage par permission : c'est identique sur tous les écrans de BC.

### Doublons constatés

| # | Doublon | Où | Utilisateurs | Spec |
|---|---|---|---|---|
| D1 | Trois listes : `nf-listing-page` (host), `nf-entity-listing` + `ConfigDrivenListingPage` (ancien, avec son propre `ListingPageConfig` dans `lib/anatomy/types/index.ts:2121`), `LegacyListingPageComponent` | `platform/listing/`, `lib/anatomy/` | Ancien : 7 écrans plateforme (workflows, membres, modèles d'impression, journal d'audit, modèles d'e-mail, rôles, tâches planifiées). Legacy : 3 (clés d'API, webhooks, séquences). | [01](01-liste-unique.md) |
| D2 | Deux fiches : `nf-record-page` (host) et `nf-entity-detail` + `ConfigDrivenDetailPage` (1 239 + 757 lignes) | `platform/record/`, `lib/anatomy/` | Détail membre, détail rôle | [02](02-fiche-unique.md) |
| D3 | Deux jeux de types de champs : `FormFieldType` (fiche host) et `DetailFieldType` (ancienne fiche, seule à avoir `ice`, `rib`, `phone-ma`, `money-ma`, `currency`, `toggle`, `time`, `daterange`, `image`) | `lib/anatomy/types/index.ts` | Un BC ne peut pas saisir un ICE ou un RIB | [03](03-types-de-champs.md) |
| D4 | Deux couches serveur : `RecordController` et `CrudService` / `JpaCrudService` + `*ControllerBase` | `core/framework`, `features/configuration/sysconfig` | Calendriers, listes de codes, séquences, valeurs de référence, tags | [05](05-crud-unique.md) |
| D5 | Deux événements de transition : `Transitioned` (moteur) et `ErpEntityTransitionEvent` (adressé par rôle) | `core/framework` | L'ancien n'est publié que par Sektor (3 services) | [04](04-heritage-sektor.md) |
| D6 | Classes de pages de `lib/anatomy/pages` inutilisées par la plateforme : `ConfigDrivenDashboardPage`, `…DocumentWorkspacePage`, `…MasterSlavePage`, `…WizardPage`, `FeaturePage`, `FeatureListPage`, `FeatureDetailPage` (~1 950 lignes) | `lib/anatomy/pages/` | Sektor uniquement (≈ 180 fichiers web de Sektor utilisent l'ancien archétype) | [04](04-heritage-sektor.md) |
| D7 | Deux sources d'approbation : `approval` du cycle de vie JSON et les modèles de workflow administrables ; toutes deux désignent l'approbateur par **rôle** | `approbation/` | Écran « Workflows d'approbation », BC démo | [10](10-approbation-par-permission.md) (décision ouverte) |

Cause commune : `lib/anatomy` porte l'ancienne architecture (celle de Sektor), et la plateforme s'en sert encore pour ses propres écrans d'administration. Tant que ces écrans y restent, un BC qui copie un écran de la plateforme copie l'ancien modèle.

### UX

- **Libellés** : la plateforme passe par ngx-translate (`platform/host/i18n/fr.json`, clés `administration.*`) ; les BCs écrivent leurs libellés en dur. `spec.i18n` ne déclare que les langues.
- **Marque** : la marque d'organisation existe (`ThemeService`, `TenantBranding` : logo, couleur primaire via l'identité d'organisation). Le produit, lui, n'a que `mark` et `logo` (spec 09).
- **Fiche** : pas de champ affiché ou verrouillé selon le record, pas de valeur calculée à l'affichage (spec 08).
- **Écrans d'administration** : un comportement de liste différent de celui des écrans métier (D1, D2).
- Mobile : règle posée (UI.md), pas de campagne de vérification.

## 3. Intégration et extensibilité

### Ce qu'un produit ou un BC peut faire aujourd'hui

| Besoin | Possible ? | Comment / pourquoi |
|---|---|---|
| Ajouter un écran, une API, un statut, des données initiales | ✅ | Configuration (archétype, `RecordController`, cycle de vie JSON, seed) |
| Coder un écran entier | ✅ encadré | `spec.screens` + `ScreenPageComponent` + `screen-kit`, contrôlé par `architecture:check` |
| Ajouter un bloc personnalisé dans une fiche | ❌ | `RecordSection.kind` est fermé (`fields`, `attachments`, `comments`, `audit`, ou `listing`) |
| Ajouter un bloc au-dessus d'une liste (indicateurs) | ❌ | Aucun emplacement prévu |
| Logique métier à l'enregistrement (calcul, contrôle entre champs) | ⚠️ | `create`, `update` et `delete` sont publics et redéfinissables, mais les redéfinir contourne `requireEditable` et l'audit si on oublie `super`. Aucun point d'accroche. |
| Réagir à une transition | ⚠️ | `@EventListener` sur `LifecycleEngine.Transitioned` fonctionne mais n'est pas un contrat documenté |
| Bloquer une transition par une règle calculée | ❌ | Seuls `requires` (champs remplis) et `approval.when` existent |
| Champ visible ou verrouillé selon le record | ❌ | `FormFieldConfig.readonly` et `disabled` sont des booléens fixes |
| Couleurs ou libellés propres au produit | ❌ | Seulement `spec.product.mark` et `logo` |
| Un BC qui ajoute une section à la fiche d'un autre BC | ❌ | Interdit (un BC ne dépend pas d'un autre) ; aucun mécanisme de contribution. À concevoir seulement quand un second produit en aura besoin. |

### Principe des options retenues

Chaque option enrichit un artefact existant (règle 3 d'AGENTS.md). Aucune ne crée de mécanisme parallèle :

- section personnalisée = écran spécifique (`spec.screens`) projeté dans une fiche (spec 07) ;
- logique serveur = méthodes protégées de `RecordController`, endpoints `final` (spec 06) ;
- champs conditionnels = fonctions sur `FormFieldConfig`, comme `when` sur `PageAction` (spec 08) ;
- habillage produit = `spec.theme` et des libellés surchargés dans `app.nafura.json` (spec 09).

## Specs

| # | Spec | Axe | Taille | Profil | Dépend de |
|---|---|---|---|---|---|
| 01 | [Liste unique](01-liste-unique.md) | Homogénéité | L | front + back | 05 (pour 3 écrans) |
| 02 | [Fiche unique](02-fiche-unique.md) | Homogénéité | M | front | 03, 07 |
| 03 | [Types de champs unifiés](03-types-de-champs.md) | Homogénéité / UX | S | front | — |
| 04 | [Isoler l'héritage Sektor](04-heritage-sektor.md) | Homogénéité | S | front + back | — |
| 05 | [Une seule couche CRUD serveur](05-crud-unique.md) | Homogénéité | M | back | — |
| 06 | [Points d'accroche du record](06-points-accroche-record.md) | Extensibilité | M | back | — |
| 07 | [Section d'écran dans une fiche ou une liste](07-section-ecran.md) | Extensibilité | M | front | — |
| 08 | [Champs conditionnels et calculés](08-champs-conditionnels.md) | Extensibilité / UX | S | front | — |
| 09 | [Marque et libellés du produit](09-marque-et-libelles-produit.md) | Extensibilité / UX | M | front | — |
| 10 | [Approbation par permission](10-approbation-par-permission.md) | Maturité | M | back + front | — |

Ordre conseillé : 04 → 03 → 06 → 05 → 01 → 07 → 02 → 08 → 10 → 09. Les specs 03, 04, 06 et 08 peuvent partir en parallèle.

Chaque spec suit le gabarit de `specs/manques-plateforme/` (Objectif, Besoin, Existant, Contrat en lots, Règles, Vérification, Critères d'acceptation, Documentation). Elle est supprimée une fois livrée ; le comportement passe alors dans `docs/`.
