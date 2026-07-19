# Revue de l'onboarding — le premier geste devrait être une reprise de données

**Statut** : proposition, non implémentée
**Périmètre** : `products/sektor-btp/web/app/onboarding/`, `backend/app/.../onboarding/`
**Date** : 2026-07-19

---

## Ce que fait l'onboarding aujourd'hui

```
signup → check-email → verify
   → /onboarding          questions guidées (identité, preset, plan comptable…)
   → /onboarding/chantier CRÉATION D'UN CHANTIER
   → /dashboard
```

La dernière étape enveloppe le wizard de création de chantier existant
(`OnboardingChantierPage` → `ChantierCreatePage` en `onboardingMode`).

Le modèle de complétude (`OnboardingCompletenessService`) pondère ainsi :

| Section | Poids |
|---|---|
| `identity` — identité société | 15 |
| `preset` — configuration initiale | 25 |
| `chart` — plan comptable | 15 |
| `numbering` — numérotation | 10 |
| `articles` — articles BTP | 10 |
| **`chantier` — premier chantier** | **15** |
| `team` — équipe invitée | 10 |

---

## Le problème : l'ordre est inversé

**Un chantier est une donnée d'exploitation. Il présuppose le référentiel, il ne le précède pas.**

Un chantier réel porte un maître d'ouvrage (donc un **client**), consomme des articles achetés à
des **fournisseurs**, et mobilise des **employés**. Demander à une société qui découvre l'outil de
créer un chantier avant d'avoir un seul client en base, c'est lui demander de saisir à la main, en
formulaire, ce qu'elle possède déjà sous forme de fichiers.

Trois conséquences concrètes :

| Effet | Détail |
|---|---|
| Le premier chantier est **fictif** | Sans client ni employé, il est créé pour franchir l'étape, puis abandonné. Il pollue la base dès le premier jour. |
| L'outil paraît **vide** après l'onboarding | La société arrive au tableau de bord avec un chantier bidon et zéro donnée réelle. Rien ne reflète son activité. |
| Le vrai coût d'entrée est **repoussé**, pas supprimé | La saisie du référentiel reste entièrement à faire, sans accompagnement, après l'onboarding. C'est là que les adoptions meurent. |

Le modèle de complétude le dit déjà à demi-mot : il compte `articles` (10) comme une section à
part entière. Le référentiel est donc déjà une notion de premier rang. **`chantier` est
l'intrus.**

---

## Ce qui existe déjà — recenser avant de créer

C'est la règle 0 de l'epic étude de prix, et elle s'applique ici : ce dépôt a déjà produit
plusieurs faux départs en réécrivant l'existant. **La proposition ci-dessous ne demande presque
aucun code neuf.**

| Brique | Emplacement | État |
|---|---|---|
| Orchestrateur d'import piloté par schéma | `platform/web/features/documents/smart-import/` | ✅ complet, branché IA |
| Déclencheur d'import réutilisable | `smart-import/components/smart-import-trigger.component.ts` | ✅ |
| Revue avant écriture | `smart-import-review-dialog.component.ts` | ✅ |
| Schéma + handler **client** | `shared/extraction-schemas/client.schema.ts`, `shared/smart-import/handlers/client-import.handler.ts` | ✅ |
| Schéma + handler **fournisseur** | idem `fournisseur.*` | ✅ |
| Schéma + handler **employé** | idem `employe.*` | ✅ |
| Schéma + handler **article** | idem `article.*` | ✅ |
| Schéma + handler **ouvrage** | idem `ouvrage.*` | ✅ |
| Coquille de wizard | `platform/web/lib/anatomy/.../wizard-shell` | ✅ (déjà utilisée au lot 2) |
| Déduplication à l'import | `dedupeKey` par handler (ex. ICE, sinon raison sociale) | ✅ |

**Les cinq imports dont la proposition a besoin sont déjà écrits et testés.** Ce qui manque, c'est
uniquement de les enchaîner dans le parcours d'onboarding.

---

## La cible proposée

```
signup → check-email → verify
   → /onboarding             questions guidées      (inchangé)
   → /onboarding/reprise     REPRISE DE DONNÉES     (nouveau)
        1. Clients           ┐
        2. Fournisseurs      │  chaque étape : déposer un fichier,
        3. Employés          │  l'IA extrait, l'utilisateur relit et corrige,
        4. Articles          │  puis valide — ou passe
        5. Bibliothèque prix ┘
   → /dashboard
```

**Le chantier disparaît de l'onboarding.** Il reste créable normalement depuis son module, au
moment où la société en a un vrai — et où elle a le référentiel pour le remplir.

### Les règles que ce wizard doit respecter

**1. « Passer » doit être un vrai passage.** Chaque étape est franchissable sans rien déposer, et
un tenant qui passe les cinq doit arriver sur un outil pleinement utilisable. Une société qui
préfère saisir à la main, ou qui n'a pas ses fichiers sous la main ce jour-là, ne doit être ni
bloquée ni harcelée.

**2. Rien d'importé ne devient un défaut.** Règle 5bis du multi-tenant : les données entrent comme
données du tenant, jamais comme seed ni valeur par défaut. Le point est sensible pour l'étape 5 —
voir ci-dessous.

**3. Aucune écriture sans relecture.** `smart-import` propose déjà ce contrat : l'IA extrait,
l'utilisateur valide. On ne persiste pas une extraction non relue. C'est le même principe que le
contrat des ports d'extraction de l'epic étude de prix : *une suggestion IA n'est jamais persistée
directement.*

**4. Les prix importés sont datés, jamais présentés comme courants.** C'est la leçon du
2026-07-19 : interrogé sur son propre classeur, l'expert métier a répondu *« qu'il prenne
seulement la forme et les formules, les chiffres devront être actualisés »*. Une bibliothèque
importée capitalise donc **des rendements** — stables dans le temps — et des prix **indicatifs
datés**. C'est exactement la décision D10 de l'epic étude de prix. Afficher un prix importé sans
sa date reproduirait le défaut du tableur.

### Pourquoi l'étape 5 vaut d'être là

C'est celle qui distingue l'outil d'un tableur. Une entreprise de BTP a **toujours** ses
sous-détails de prix quelque part — un classeur, en général mal structuré. L'extraction menée le
2026-07-19 sur un classeur réel a produit **84 ouvrages et 290 composants**, avec des rendements
exacts au centime, à partir d'un fichier dont les formules cachaient les diviseurs.

C'est aussi le prérequis de la décision **D4** : sans corpus de rendements validés, l'assistance
IA hallucine. Une société qui importe sa bibliothèque au premier jour arrive chiffrable
immédiatement — et alimente le socle dont l'IA aura besoin.

---

## Ce que ça change dans le modèle de complétude

Le poids `chantier` (15) est à redistribuer. Proposition :

| Section | Avant | Après | Note |
|---|---|---|---|
| `identity` | 15 | 15 | — |
| `preset` | 25 | 25 | — |
| `chart` | 15 | 15 | — |
| `numbering` | 10 | 10 | — |
| `articles` | 10 | 10 | — |
| ~~`chantier`~~ | 15 | — | supprimée |
| **`referentiel`** | — | **15** | clients + fournisseurs + employés, au moins un des trois |
| `team` | 10 | 10 | — |

> **À vérifier avant d'implémenter** : la complétude doit-elle *monter* quand l'utilisateur passe
> une étape ? Deux lectures défendables — « j'ai fait le tour » contre « il me reste des données à
> mettre ». Trancher avec le métier plutôt que deviner, la réponse conditionne le ressenti de
> toute la barre de progression.

---

## Ce que cette proposition ne fait pas

- Elle ne touche pas au signup, à la vérification d'e-mail, ni aux questions guidées.
- Elle ne crée **aucun** schéma d'extraction ni handler : les cinq existent.
- Elle ne supprime pas la création de chantier — elle la sort du parcours d'accueil.
- Elle ne traite pas la reprise depuis un ERP concurrent (connecteurs, API) : hors périmètre.

---

## Questions ouvertes

| # | Question | Pourquoi ça compte |
|---|---|---|
| O1 | Passer une étape fait-il monter la complétude ? | Conditionne toute la barre de progression |
| O2 | Ordre imposé ou libre entre les 5 étapes ? | Les employés ne dépendent de rien ; les ouvrages gagnent à venir après les articles |
| O3 | Que devient le chantier créé par les tenants déjà onboardés ? | Données existantes — ne pas supprimer sans arbitrage |
| O4 | Un import partiellement en erreur bloque-t-il l'étape ? | `smart-import` sait déjà remonter les lignes fautives, comme les gates du lot 2 |
