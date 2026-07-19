# Epic — Onboarding par reprise de données

**Statut** : spécifié, non implémenté
**Périmètre** : `products/sektor-btp/web/app/onboarding/`,
`products/sektor-btp/backend/app/src/main/java/ma/nafura/erp/onboarding/`
**Objectif** : remplacer la création d'un chantier fictif en fin d'onboarding par une reprise
guidée du référentiel de la société, appuyée sur l'import piloté par schéma déjà en place.

---

## Le problème en une phrase

L'onboarding se termine en demandant de **créer un chantier** — une donnée d'exploitation qui
présuppose clients, fournisseurs et employés, dont aucun n'existe encore à ce stade.

Diagnostic complet : [`00-REVUE.md`](00-REVUE.md).

## La cible en une phrase

Le dernier geste de l'onboarding devient **« montrez-nous vos données »**, pas « inventez-en ».

---

## Ordre de lecture

| # | Document | Contenu |
|---|---|---|
| 00 | [REVUE](00-REVUE.md) | Constat sur le code actuel, inventaire de l'existant |
| 00 | [ARCHITECTURE](00-ARCHITECTURE.md) | Parcours cible, contrats réutilisés, décisions D1–D8 |
| 01 | [Wizard de reprise](01-wizard-reprise.md) | Le parcours en 5 étapes — lot principal |
| 02 | [Complétude et retrait du chantier](02-completude-retrait-chantier.md) | Pondération, tenants déjà onboardés |
| 99 | [Questions ouvertes](99-questions-ouvertes.md) | À trancher avant implémentation |

---

## Glossaire

| Terme | Définition |
|---|---|
| **Reprise de données** | Chargement initial du référentiel d'une société à partir de ses propres fichiers |
| **Import magique** / `smart-import` | Orchestrateur d'extraction piloté par schéma, branché IA, avec relecture avant écriture |
| **`ExtractionDefinition`** | Contrat décrivant ce qu'on extrait : schéma de données, de présentation, instructions, clé de déduplication |
| **Handler d'import** | Service applicatif qui persiste une extraction relue (ex. `ClientImportService`) |
| **Complétude** | Score d'avancement de l'onboarding, par sections pondérées (`OnboardingCompletenessService`) |
| **Rendement** | Quantité de composant par unité d'ouvrage — ce qui se capitalise dans une bibliothèque de prix |

---

## Règles pour l'agent d'implémentation

0. **Recenser avant de créer.** Les cinq schémas d'extraction et les cinq handlers **existent
   déjà** (`shared/extraction-schemas/`, `shared/smart-import/handlers/`). L'orchestrateur, le
   dialogue de relecture et la coquille de wizard aussi. Cet epic est du **câblage**.
   Écrire un nouveau parseur ou un nouveau schéma serait un faux départ de plus — ce dépôt en a
   déjà produit plusieurs, dont un parseur XLSX maison supplanté par `smart-import`.

1. **« Passer » est un vrai passage.** Aucune étape n'est obligatoire, et un tenant qui passe les
   cinq doit disposer d'un outil pleinement fonctionnel. Pas de relance insistante, pas d'étape
   qui se re-présente.

2. **Aucune écriture sans relecture.** `smart-import` propose déjà ce contrat : l'IA extrait,
   l'utilisateur corrige, puis valide. Ne jamais persister une extraction non relue.

3. **Rien d'importé ne devient un défaut.** Sektor est multi-tenant : les données entrent comme
   données du tenant, jamais comme seed ni valeur par défaut d'un autre.

4. **Les prix importés sont datés.** Une bibliothèque reprise capitalise des **rendements** et des
   prix **indicatifs datés** — jamais un tarif courant. Voir D6.

5. Respecter `docs/AGENTS.md` : métier sous `products/sektor-btp/`, jamais dans `platform/`.
   Le code front va dans `products/sektor-btp/web/app/onboarding/` (alias `@app/*`).

6. Un lot = une PR.
