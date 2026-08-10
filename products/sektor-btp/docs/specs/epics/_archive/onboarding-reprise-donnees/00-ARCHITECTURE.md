# Architecture cible — Onboarding par reprise de données

## 1. Parcours cible

```
signup → check-email → verify
   → /onboarding              questions guidées            (inchangé)
   → /onboarding/reprise      REPRISE DE DONNÉES           (nouveau)
        1. Clients
        2. Fournisseurs
        3. Employés
        4. Articles
        5. Bibliothèque de prix
   → /dashboard
```

`/onboarding/chantier` est retiré du parcours. La création de chantier reste accessible depuis son
module, quand la société en a un vrai.

**Chaque étape suit le même cycle**, et c'est déjà celui de `smart-import` :

```
déposer un fichier  →  extraction  →  relecture / correction  →  validation  →  persistance
        │                                                                          │
        └────────────────────────── ou « Passer » ─────────────────────────────────┘
```

---

## 2. Contrats réutilisés — rien à redéfinir

### 2.1 Le déclencheur

`SmartImportTriggerComponent` (`nf-smart-import-trigger`), dans
`platform/web/features/documents/smart-import/` :

| Membre | Type | Note |
|---|---|---|
| `definition` | `ExtractionDefinition` | **requis** |
| `disabled` | `boolean` | |
| `accept` | `string` | défaut `.xlsx,.xls,.csv,.pdf` |
| `completed` | `EventEmitter<ReviewedExtraction>` | émis **après** relecture utilisateur |
| `cancelled` | `EventEmitter<void>` | |
| `failed` | `EventEmitter<SmartImportError>` | |

> `completed` n'est émis qu'après la relecture. C'est ce qui garantit la règle 2 sans code
> supplémentaire — il n'existe pas de chemin qui persiste une extraction non relue.

### 2.2 Les définitions et handlers existants

| Étape | Définition | Handler | Clé de déduplication |
|---|---|---|---|
| 1 | `CLIENT_IMPORT_DEFINITION` | `ClientImportService` | ICE, sinon raison sociale |
| 2 | `FOURNISSEUR_IMPORT_DEFINITION` | `FournisseurImportService` | *(à confirmer à la lecture)* |
| 3 | `EMPLOYE_IMPORT_DEFINITION` | `EmployeImportService` | *(idem)* |
| 4 | `ARTICLE_IMPORT_DEFINITION` | `ArticleImportService` | *(idem)* |
| 5 | `OUVRAGE_IMPORT_DEFINITION` | `OuvrageImportService` | *(idem)* |

Chaque handler expose `import(data): Promise<ApplicationImportResult>` avec :

```ts
interface ApplicationImportResult {
  created: number;
  skippedDuplicates: number;
}
```

**Ces deux compteurs sont le retour utilisateur de l'étape** — « 42 clients ajoutés, 3 doublons
ignorés ». Ne pas en inventer d'autres avant d'avoir constaté qu'ils manquent.

### 2.3 La coquille de wizard

`WizardShellComponent` (`nf-wizard-shell`), déjà employée par le dossier d'étude du lot 2 de
l'epic étude de prix. Attention au même piège : **elle indexe ses étapes à partir de 0**. Si
l'état de reprise est persisté en 1..5, convertir une fois, explicitement, et nommer la
conversion.

---

## 3. Décisions actées

| # | Décision | Justification |
|---|---|---|
| **D1** | La création de chantier sort de l'onboarding | Un chantier présuppose le référentiel : client, fournisseurs, employés. L'ordre actuel est inversé et produit un chantier fictif dès le premier jour |
| **D2** | Les cinq étapes sont **facultatives** | Une société sans ses fichiers le jour J doit pouvoir avancer. L'outil reste pleinement utilisable sur un tenant vide |
| **D3** | Aucun schéma ni handler nouveau | Les cinq existent et sont testés. Cet epic est du câblage — voir règle 0 |
| **D4** | L'état de reprise est **persisté** côté tenant | Un onboarding s'interrompt : reprendre où on s'est arrêté, comme `currentStep` du dossier d'étude. Sans ça, une déconnexion fait tout recommencer |
| **D5** | La section `chantier` de la complétude devient `referentiel` | Le poids reste 15. Détail et migration dans `02-completude-retrait-chantier.md` |
| **D6** | Une bibliothèque importée capitalise des **rendements** et des prix **datés** | Confirmé par l'expert métier le 2026-07-19 : « qu'il prenne seulement la forme et les formules, les chiffres devront être actualisés ». Identique à D10 de l'epic étude de prix — un prix de vente n'est jamais un tarif stocké |
| **D7** | Un import partiellement fautif **n'interdit pas** de continuer | Les lignes valides entrent, les fautives sont listées. Même principe que les gates du lot 2 : montrer ce qui coince, pas bloquer en silence |
| **D8** | L'ordre des étapes est **indicatif**, la navigation est libre | Les employés ne dépendent de rien ; les ouvrages gagnent à venir après les articles, sans que ce soit une contrainte technique |

---

## 4. Ce que l'architecture ne prévoit pas

- **Reprise depuis un ERP concurrent** (connecteurs, API tierces) — hors périmètre.
- **Import de chantiers ou de marchés en cours** — c'est de l'exploitation, pas du référentiel.
  À réexaminer une fois la reprise du référentiel en service.
- **Rapprochement inter-étapes** (associer automatiquement un employé à un fournisseur homonyme,
  par exemple). Chaque étape reste indépendante.

---

## 5. Point de vigilance — la relation entre étapes 4 et 5

Un ouvrage se compose d'articles. Importer la bibliothèque (5) avant les articles (4) produira des
composants qui ne pointent aucun `Item` du référentiel.

Ce n'est **pas** une raison d'imposer l'ordre (D8), mais l'étape 5 doit le dire : si des composants
ne trouvent pas leur article, l'indiquer et proposer de revenir à l'étape 4. Le comportement exact
— créer les articles manquants à la volée, ou seulement signaler — est la question **O5**.
