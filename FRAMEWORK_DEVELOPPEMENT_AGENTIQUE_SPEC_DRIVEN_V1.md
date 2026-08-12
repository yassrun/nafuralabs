# Framework de développement agentique piloté par les spécifications

**Version :** 1.0  
**Statut :** spécification de référence pour implémentation  
**Public cible :** agents de spécification, agents d'exécution et équipe construisant la plateforme

---

## 1. Finalité

Ce framework standardise la manière de décrire, découper, faire évoluer et vérifier un logiciel développé avec des agents IA.

Son principe fondateur est le suivant :

> Aucun changement de code ne peut être exécuté à partir d'une demande brute. Toute intervention doit d'abord devenir une spécification de changement contextualisée, validée et vérifiable.

Le framework doit fonctionner :

- pour une application créée de zéro ;
- pour une application existante ;
- pour une application complexe contenant plusieurs bounded contexts ;
- pour une petite application correspondant à un seul bounded context ;
- pour les fonctionnalités, bugs, changements techniques, obligations de conformité et retraits ;
- lorsque certaines capacités transverses sont développées localement ou fournies par une plateforme d'entreprise.

Le framework est indépendant de la stack technique, de la méthodologie de gestion de projet et du mode de déploiement.

---

## 2. Principes normatifs

Les termes **DOIT**, **NE DOIT PAS**, **DEVRAIT** et **PEUT** ont une valeur normative.

1. Toute application **DOIT** posséder un lot obligatoire nommé `Socle`.
2. Un lot métier **DOIT** représenter un bounded context durable.
3. Le lot `Socle` **DOIT** suivre exactement les mêmes règles de spécification, de changement, de versionnement et de preuve que les lots métier.
4. Un sous-lot **DOIT** représenter une capacité durable du lot. Il est optionnel.
5. Un changement **DOIT** cibler un seul lot ou un seul sous-lot.
6. Toute création initiale, évolution, correction de bug, modification technique, mise en conformité ou suppression **DOIT** passer par une spécification de changement.
7. Une task **DOIT** décrire un résultat attendu et vérifiable ; elle ne représente pas automatiquement une couche technique.
8. Une même task **PEUT** modifier le backend, le frontend, les données, les tests, la configuration et l'infrastructure si ces impacts sont nécessaires au même résultat.
9. Un agent d'exécution **NE DOIT PAS** commencer une task dont la spécification n'est pas approuvée.
10. Un changement **NE PEUT PAS** être terminé sans preuves rattachées à ses critères d'acceptation.
11. Les lots et sous-lots sont vivants : ils ne deviennent pas `DONE`. Seuls les changements et les tasks se clôturent.
12. Après un changement terminé, la spécification courante de la cible **DOIT** refléter la nouvelle vérité attendue du logiciel.

---

## 3. Les deux plans du framework

Le framework sépare deux dimensions qui ne doivent pas être confondues.

### 3.1. Plan structurel durable

Il décrit ce que le logiciel est et ce qu'il sait faire.

```text
Entreprise / Plateforme
└── Solution
    └── Application
        ├── Lot obligatoire : Socle
        │   └── Sous-lots optionnels : capacités transverses
        └── Lots métier : bounded contexts
            └── Sous-lots optionnels : capacités métier
```

### 3.2. Plan temporel des changements

Il décrit ce que les agents doivent changer maintenant.

```text
Demande brute
└── Spécification
    └── Un ou plusieurs changements
        └── Une ou plusieurs tasks
            └── Exécution et preuves
                └── Consolidation de la spécification courante
```

La structure durable ne doit pas être recréée pour chaque évolution. Un changement vient transformer l'état d'un lot ou d'un sous-lot existant.

---

## 4. Modèle conceptuel

### 4.1. Application

Une application est une unité logicielle exploitable et versionnée. Elle possède :

- une finalité ;
- des responsabilités ;
- un lot `Socle` obligatoire ;
- zéro ou plusieurs lots métier ;
- des contraintes héritées de l'entreprise et de la solution ;
- un historique de changements et de releases.

La version de release de l'application et la version de spécification d'une capacité sont deux notions distinctes.

### 4.2. Lot

Un lot est une frontière durable de responsabilité dans l'application.

Il existe deux types de lots :

| Type | Rôle |
| --- | --- |
| `FOUNDATION` | Lot obligatoire `Socle`, responsable des capacités et règles transverses |
| `BUSINESS` | Lot métier correspondant à un bounded context |

Un lot n'est ni une phase projet, ni une release, ni un budget commercial, ni un ticket. Il subsiste tant que sa responsabilité existe dans l'application.

Chaque lot possède au minimum :

- un identifiant stable ;
- une mission ;
- ce qu'il possède ;
- ce qu'il ne possède pas ;
- son vocabulaire ;
- ses invariants ;
- ses contrats publics ;
- ses dépendances autorisées ;
- une spécification courante versionnée ;
- un statut de cycle de vie.

### 4.3. Lot obligatoire `Socle`

Chaque application **DOIT** avoir exactement un lot `Socle` de type `FOUNDATION`.

Le Socle peut contenir notamment :

- authentification ;
- autorisation ;
- audit ;
- observabilité ;
- gestion des erreurs ;
- configuration et secrets ;
- conventions d'API ;
- messaging ;
- persistance et migrations ;
- multitenancy ;
- sécurité ;
- CI/CD et déploiement ;
- résilience ;
- internationalisation.

Le Socle n'est pas un simple dossier de code partagé. Il décrit à la fois :

1. les capacités transverses disponibles ;
2. les contrats permettant de les consommer ;
3. les politiques obligatoires imposées aux autres lots ;
4. les mécanismes locaux d'intégration avec la plateforme d'entreprise.

Une capacité du Socle peut être :

| Mode | Signification |
| --- | --- |
| `LOCAL` | développée et opérée dans l'application |
| `PLATFORM_CONSUMED` | fournie par une plateforme d'entreprise et intégrée localement |
| `EXTERNAL_MANAGED` | fournie par un service externe avec un contrat local |

Même lorsqu'une capacité est fournie par la plateforme, l'application doit représenter dans son Socle son contrat de consommation, sa configuration, ses responsabilités locales et ses changements d'intégration.

Le Socle est soumis aux mêmes règles que les autres lots : sous-lots optionnels, changements spécifiés, tasks, preuves, consolidation et versionnement.

### 4.4. Sous-lot

Un sous-lot est une capacité durable à l'intérieur d'un lot.

Exemples :

- dans `Account Management` : `Account Opening`, `Account Closure` ;
- dans le `Socle` : `Authentication`, `Audit`, `Observability`.

Un sous-lot est créé seulement lorsqu'il réduit réellement le contexte nécessaire aux agents. Il est justifié si la capacité :

- possède ses propres règles et scénarios ;
- évolue de manière relativement indépendante ;
- regroupe plusieurs changements dans le temps ;
- mérite une spécification courante autonome ;
- est trop importante pour être gérée directement au niveau du lot.

Un sous-lot ne doit pas représenter :

- une page ;
- une couche backend ou frontend ;
- un sprint ;
- une release ;
- un redesign ponctuel ;
- une task.

Le framework ne rend pas le sous-lot obligatoire. Quand un lot est suffisamment cohérent et compact, les changements ciblent directement le lot.

### 4.5. Demande

La demande est l'expression brute d'un besoin, d'un défaut ou d'une contrainte. Elle peut provenir d'un utilisateur, du métier, de la production, de la sécurité, de l'architecture ou de la réglementation.

Une demande n'est pas exécutable. L'agent de spécification la transforme en un ou plusieurs changements.

Une demande touchant plusieurs lots doit être décomposée en plusieurs changements mono-lot reliés par des dépendances. La demande conserve l'unité fonctionnelle globale.

### 4.6. Changement

Le changement est l'unité versionnée de spécification et de transformation.

Il décrit le passage d'un état de référence vers un état attendu :

```text
Changement N : état de référence → état attendu
```

Un changement cible exactement :

- un lot ; ou
- un sous-lot appartenant à ce lot.

Types obligatoires :

| Type | Effet |
| --- | --- |
| `INITIALIZATION` | crée la première version de la cible |
| `EVOLUTION` | modifie le comportement attendu |
| `CORRECTION` | réaligne l'implémentation sur un comportement déjà attendu |
| `TECHNICAL` | modifie l'implémentation sans changer le comportement métier attendu |
| `COMPLIANCE` | applique une exigence réglementaire, de sécurité ou d'architecture |
| `RETIREMENT` | déprécie ou retire une capacité ou un comportement |

Un changement comporte au minimum :

- son type ;
- sa cible ;
- sa motivation ;
- son état de référence ;
- son état attendu ;
- son périmètre et ses exclusions ;
- les règles applicables du Socle ;
- ses impacts ;
- ses risques ;
- ses critères d'acceptation ;
- ses exigences de preuve ;
- ses tasks ;
- ses dépendances éventuelles avec d'autres changements.

### 4.7. Task

La task est la plus petite mission autonome qu'un agent peut comprendre, exécuter et prouver.

Elle est formulée comme un changement observable, souvent depuis le point de vue d'un acteur :

> En tant que conseiller bancaire, je veux ouvrir un compte courant pour un client éligible afin qu'il puisse utiliser les services bancaires.

Cette task peut nécessiter dans une même exécution :

- une modification du domaine et du backend ;
- une API ;
- une interface frontend ;
- une migration de données ;
- des contrôles de sécurité ;
- des événements ;
- des tests unitaires, d'intégration et de parcours.

Ces impacts ne deviennent pas automatiquement des tasks séparées. Le découpage par couche technique doit être évité lorsqu'il empêche une task de démontrer une valeur ou un comportement de bout en bout.

Une séparation technique est permise seulement si chaque task obtenue :

- possède un résultat autonome ;
- est vérifiable indépendamment ;
- expose un contrat clair aux autres tasks ;
- réduit réellement le risque ou permet une parallélisation sûre.

### 4.8. Preuve

Une preuve démontre qu'un critère d'acceptation ou une politique a été respecté.

Types de preuves possibles :

- test automatisé ;
- test de non-régression ;
- résultat de build ;
- rapport de sécurité ;
- validation de migration ;
- capture ou test de parcours ;
- mesure de performance ;
- revue humaine ou métier ;
- décision d'architecture enregistrée.

Une affirmation de l'agent n'est pas, à elle seule, une preuve.

---

## 5. Sources de vérité et versionnement

Le framework conserve trois sources distinctes.

### 5.1. Spécification courante

Elle décrit ce que la cible doit faire maintenant. C'est la vérité normative fonctionnelle et transversale transmise aux agents.

### 5.2. Historique des changements

Il explique comment et pourquoi la spécification courante et l'implémentation ont évolué.

### 5.3. Preuves d'implémentation

Elles démontrent que le code respecte la spécification approuvée.

Règles de versionnement :

- chaque lot et sous-lot possède une version de spécification monotone ;
- un changement référence obligatoirement la version de base utilisée pour le spécifier ;
- un changement modifiant la vérité attendue produit une nouvelle version de spécification ;
- une correction ne modifie normalement pas la spécification courante ;
- si un bug révèle une ambiguïté ou une absence dans la spécification, celle-ci doit être clarifiée et versionnée avant la correction ;
- une release applicative peut agréger plusieurs changements terminés et possède son propre numéro de version.

Les versions de spécification et de release ne doivent pas être confondues.

---

## 6. Cycle agentique standard

### Étape 1 — Intake

Le système enregistre la demande brute sans l'envoyer directement à un agent d'exécution.

### Étape 2 — Ciblage

L'agent de spécification :

1. identifie l'application ;
2. identifie le lot concerné ;
3. identifie le sous-lot existant ou décide que le changement doit cibler directement le lot ;
4. propose un nouveau sous-lot uniquement si une nouvelle capacité durable apparaît ;
5. décompose la demande en plusieurs changements si plusieurs lots sont concernés.

### Étape 3 — Chargement du contexte effectif

Le contexte fourni à l'agent doit être compilé à partir de :

```text
Contraintes pertinentes d'architecture d'entreprise
+ décisions pertinentes d'architecture de solution
+ contrats de plateforme consommés
+ spécification courante du Socle
+ contrat du lot cible
+ spécification du sous-lot cible, s'il existe
+ état de référence utile
+ demande brute
```

L'agent ne doit pas charger toute l'entreprise ou tout le dépôt si ces informations ne sont pas pertinentes.

### Étape 4 — Spécification du changement

L'agent de spécification qualifie le changement et produit :

- le problème ou besoin ;
- l'état actuel ou observé ;
- l'état attendu ;
- les règles métier et transverses ;
- les scénarios nominaux et alternatifs ;
- les impacts et contrats ;
- les risques ;
- les critères d'acceptation ;
- les preuves exigées ;
- les tasks verticales nécessaires.

Il ne modifie pas le code.

### Étape 5 — Validation de la spécification

La spécification est validée selon le risque : automatiquement, humainement, par le métier, l'architecture, la sécurité ou la conformité.

Aucune task ne passe à `READY` avant l'approbation du changement.

### Étape 6 — Exécution

L'agent d'exécution reçoit uniquement :

- la task approuvée ;
- le changement parent ;
- le contexte effectif pertinent ;
- le périmètre autorisé ;
- les critères d'acceptation ;
- les preuves attendues.

Il inspecte l'implémentation, modifie toutes les couches nécessaires, exécute les validations et produit les preuves.

Il ne doit pas inventer une nouvelle règle métier. En cas d'ambiguïté, de contradiction ou d'impact hors périmètre, il bloque la task et renvoie un écart à l'agent de spécification.

### Étape 7 — Vérification

Chaque critère d'acceptation est relié à au moins une preuve. Les tests, contrats, migrations, politiques du Socle et non-régressions sont vérifiés.

### Étape 8 — Consolidation

Après validation :

- la task est terminée ;
- le changement est terminé lorsque toutes ses tasks requises sont validées ;
- la spécification courante est mise à jour si la vérité attendue a changé ;
- la version de spécification est incrémentée si nécessaire ;
- les preuves et décisions sont conservées ;
- la release applicative peut référencer le changement.

---

## 7. Responsabilités des agents

### 7.1. Agent de spécification

L'agent de spécification **DOIT** :

- comprendre et reformuler la demande ;
- localiser la responsabilité dans la structure durable ;
- charger l'état courant et le Socle applicable ;
- détecter les impacts inter-lots ;
- qualifier le type de changement ;
- rendre explicites les décisions implicites ;
- écrire les critères d'acceptation ;
- définir les preuves attendues ;
- découper en tasks agentiques verticales ;
- signaler les questions bloquantes ;
- préserver les frontières des bounded contexts.

Il **NE DOIT PAS** :

- modifier le code ;
- déclarer une solution conforme sans preuve ;
- créer un nouveau sous-lot pour chaque évolution ;
- découper automatiquement les tasks en backend, frontend et base de données ;
- considérer le code existant comme vérité normative sans baseline.

### 7.2. Agent d'exécution

L'agent d'exécution **DOIT** :

- travailler uniquement sur une task approuvée ;
- respecter le périmètre et les exclusions ;
- appliquer les règles pertinentes du Socle ;
- modifier toutes les couches nécessaires au résultat ;
- préserver les contrats non modifiés ;
- fournir les tests et preuves demandés ;
- signaler tout écart entre la spécification et le code ;
- produire un résumé factuel de l'implémentation.

Il **NE DOIT PAS** :

- réinterpréter librement le besoin ;
- étendre silencieusement le périmètre ;
- modifier un autre lot sans changement approuvé pour ce lot ;
- marquer une task terminée si un critère n'est pas prouvé ;
- corriger silencieusement une spécification contradictoire.

---

## 8. Bugs et corrections

Un bug est un changement de type `CORRECTION`.

Une correction ne crée pas une nouvelle vérité métier. Elle rétablit une vérité déjà attendue.

Sa spécification minimale doit contenir :

```text
Comportement attendu
≠ Comportement observé
+ scénario de reproduction
+ périmètre affecté
+ critère de correction
+ test de non-régression
```

Exemple :

```yaml
change:
  id: CHG-ONB-003
  type: CORRECTION
  target: customer-management/customer-onboarding
  base_spec_version: 1.4

observed_behavior: >
  Les documents disparaissent lorsque le client reprend un onboarding interrompu.

expected_behavior: >
  Les documents validés restent disponibles pendant toute la durée du dossier.

reproduction:
  - commencer un onboarding
  - déposer et valider un document
  - quitter le parcours
  - reprendre le dossier

acceptance:
  - id: AC-1
    statement: Le document reste visible et exploitable après la reprise.
  - id: AC-2
    statement: Un test automatisé reproduit l'ancien défaut et réussit après correction.
```

Si le comportement attendu n'existe pas dans la spécification courante, l'agent doit d'abord demander une clarification. Il ne doit pas deviner si le comportement observé est un bug ou une nouvelle règle.

---

## 9. Création de zéro

Une application neuve utilise le même mécanisme que les évolutions futures.

La création initiale d'un lot ou d'un sous-lot est un changement `INITIALIZATION` faisant passer la cible de l'absence à sa première version :

```text
V0 : cible inexistante
CHG-001 INITIALIZATION
V1 : première spécification courante implémentée
```

Il n'existe donc pas un processus pour construire et un autre pour faire évoluer. Toutes les modifications empruntent la même chaîne :

```text
Demande → Spécification → Approbation → Tasks → Exécution → Preuves → Consolidation
```

---

## 10. Intégration d'une application existante

Une application existante ne doit pas être déclarée globalement `DONE`.

Le framework crée une baseline de ses responsabilités et capacités selon deux stratégies :

| Stratégie | Usage |
| --- | --- |
| Baseline complète | système critique ou besoin immédiat de gouvernance globale |
| Baseline progressive | grande application ; formalisation des zones lorsqu'elles sont touchées |

Statuts structurels recommandés :

| Statut | Signification |
| --- | --- |
| `DISCOVERED` | responsabilité détectée mais non documentée |
| `BASELINED` | comportement actuel documenté |
| `VERIFIED` | baseline confirmée par le code, les tests ou le métier |
| `ACTIVE` | capacité maintenue et gouvernée par le framework |
| `DEPRECATED` | capacité destinée à disparaître |
| `RETIRED` | capacité retirée |

Pour une baseline progressive :

1. identifier le Socle existant et ses intégrations ;
2. identifier le lot touché par la demande ;
3. identifier ou créer la représentation du sous-lot durable ;
4. documenter son état courant observé ;
5. faire valider cette baseline ;
6. créer le changement demandé contre cette version de référence.

Les capacités non analysées restent `DISCOVERED`. Elles ne sont pas considérées comme terminées ni conformes.

### Cas du redesign d'un onboarding existant

Le redesign ne crée pas un nouveau sous-lot.

```text
Lot : Customer Management
└── Sous-lot durable : Customer Onboarding
    ├── CHG-001 INITIALIZATION : onboarding initial
    ├── CHG-002 EVOLUTION : redesign en trois étapes
    └── CHG-003 CORRECTION : conservation des documents à la reprise
```

Un nouveau sous-lot est créé seulement si une nouvelle capacité autonome apparaît, par exemple `Identity Verification`, réutilisée en dehors de l'onboarding et dotée de règles et d'un cycle de vie propres.

---

## 11. Gestion des demandes multi-lots

Un changement reste mono-lot afin de préserver la responsabilité, le contexte et la capacité de vérification.

Lorsqu'une demande touche plusieurs bounded contexts, l'agent de spécification produit un ensemble coordonné :

```text
Demande : permettre l'ouverture d'un compte
├── Changement Account Management
├── Changement Customer & Party
├── Changement Product Catalog
└── Changement General Ledger
```

Chaque changement :

- possède sa propre spécification ;
- respecte le lot qui en est propriétaire ;
- expose ou consomme des contrats explicites ;
- déclare ses dépendances ;
- peut être exécuté par un agent différent.

La demande globale n'est terminée que lorsque les changements requis sont validés et que le parcours inter-lots est prouvé.

---

## 12. États recommandés

### 12.1. Changement

```text
DRAFT → SPECIFIED → IN_REVIEW → APPROVED → EXECUTING → VERIFYING → DONE
```

États complémentaires : `BLOCKED`, `REJECTED`, `CANCELLED`.

Transitions obligatoires :

- seul un changement `APPROVED` peut passer à `EXECUTING` ;
- un changement ne passe à `VERIFYING` que lorsque toutes ses tasks requises sont livrées ;
- un changement ne passe à `DONE` que lorsque ses critères sont prouvés et sa spécification courante consolidée.

### 12.2. Task

```text
DRAFT → READY → IN_PROGRESS → VERIFYING → DONE
```

États complémentaires : `BLOCKED`, `CANCELLED`.

Une task n'est `READY` que si :

- le changement parent est approuvé ;
- l'intention est explicite ;
- le périmètre est défini ;
- les critères d'acceptation sont testables ;
- les règles du Socle applicables sont attachées ;
- les dépendances nécessaires sont disponibles.

---

## 13. Schéma minimal d'une spécification de changement

```yaml
change:
  id: CHG-XXX-001
  title: Titre orienté résultat
  type: INITIALIZATION | EVOLUTION | CORRECTION | TECHNICAL | COMPLIANCE | RETIREMENT
  status: DRAFT
  request_id: REQ-001
  target:
    application: application-id
    lot: lot-id
    sublot: optional-sublot-id
  base_spec_version: 1
  risk: LOW | MEDIUM | HIGH | CRITICAL

motivation:
  problem: Problème ou opportunité
  value: Valeur recherchée
  actors:
    - acteur

reference_state:
  summary: État actuel, comportement observé ou V0 inexistant
  evidence:
    - référence vers code, test, règle ou baseline

expected_state:
  summary: Nouvelle vérité attendue ou réalignement attendu
  business_rules:
    - règle explicite
  scenarios:
    - scénario nominal
    - scénario alternatif

scope:
  included:
    - élément inclus
  excluded:
    - élément explicitement exclu

applicable_foundation:
  policies:
    - politique du Socle
  capabilities:
    - capacité du Socle consommée

impacts:
  contracts: []
  data: []
  security: []
  operations: []
  other_lots: []

acceptance_criteria:
  - id: AC-1
    statement: Résultat observable et testable
    required_evidence:
      - AUTOMATED_TEST

tasks:
  - id: TASK-001
    title: Résultat autonome à produire
    intent: Ce que l'agent doit rendre vrai
    allowed_scope: []
    forbidden_scope: []
    acceptance_criteria:
      - AC-1
    required_evidence:
      - AUTOMATED_TEST

dependencies:
  changes: []
  tasks: []

open_questions: []
decisions: []
```

Une question bloquante empêche le passage à `APPROVED`.

---

## 14. Schéma minimal d'une task agentique

```yaml
task:
  id: TASK-001
  change_id: CHG-XXX-001
  title: Ouvrir un compte courant pour un client éligible
  status: READY

intent:
  actor: conseiller bancaire
  wants: ouvrir un compte courant pour un client existant
  value: rendre le compte utilisable conformément au produit choisi

expected_behavior:
  - le client actif et éligible peut être sélectionné
  - le compte est créé avec le statut prévu
  - le compte apparaît dans la vue client
  - l'événement AccountOpened est publié

business_rules:
  - un titulaire principal est obligatoire
  - le produit doit être commercialisable

scope:
  allowed:
    - account-management
    - interfaces publiques explicitement autorisées
  forbidden:
    - accès direct aux données des autres lots

constraints:
  - toute mutation est auditée
  - aucune donnée sensible n'est écrite dans les logs
  - les erreurs utilisent le format du Socle

acceptance:
  - id: AC-1
    statement: Le parcours nominal fonctionne de bout en bout.
  - id: AC-2
    statement: Les refus d'éligibilité sont explicites et ne créent aucun compte.

evidence_required:
  - tests métier
  - tests d'intégration
  - test du parcours utilisateur
  - résultat du build

delivery_report:
  implementation_summary: null
  files_or_components_changed: []
  evidence: []
  deviations: []
  residual_risks: []
```

---

## 15. Exemple A — Core Banking System

```text
Application : Core Banking System
├── Lot obligatoire : Socle [FOUNDATION]
│   ├── Sous-lot : Authentication
│   ├── Sous-lot : Authorization
│   ├── Sous-lot : Audit & Traceability
│   ├── Sous-lot : Observability
│   ├── Sous-lot : Financial Idempotency
│   └── Sous-lot : Business Date & Calendar
├── Lot : Customer & Party [BUSINESS]
├── Lot : Product Catalog [BUSINESS]
├── Lot : Account Management [BUSINESS]
│   ├── Sous-lot : Account Opening
│   ├── Sous-lot : Account Lifecycle
│   ├── Sous-lot : Holders & Mandates
│   └── Sous-lot : Account Closure
├── Lot : Payments [BUSINESS]
├── Lot : Lending [BUSINESS]
├── Lot : General Ledger [BUSINESS]
├── Lot : Fees & Pricing [BUSINESS]
└── Lot : Limits & Holds [BUSINESS]
```

Exemple d'historique durable :

```text
Account Management / Account Opening
├── CHG-001 INITIALIZATION : ouverture initiale d'un compte individuel
├── CHG-014 EVOLUTION : ajout des comptes joints
├── CHG-027 COMPLIANCE : contrôle réglementaire renforcé
└── CHG-031 CORRECTION : empêcher la double création après retry
```

La correction d'idempotence peut modifier backend, données, événements et tests dans une seule task si le résultat reste autonome et vérifiable.

---

## 16. Exemple B — Application correspondant à un seul bounded context

Exemple : service de liens courts.

```text
Application : Short Link Service
├── Lot obligatoire : Socle [FOUNDATION]
│   └── Changements directement rattachés au lot
└── Lot : Short Links [BUSINESS]
    └── Changements directement rattachés au lot
```

Aucun sous-lot n'est nécessaire si le lot `Short Links` tient dans un contexte agentique cohérent.

```text
Short Links
├── CHG-001 INITIALIZATION : créer et résoudre un lien court
├── CHG-002 EVOLUTION : gérer l'expiration
└── CHG-003 CORRECTION : éviter une collision de code
```

La structure est donc compressible :

```text
Application → Lots → Changements → Tasks
```

ou, pour un lot complexe :

```text
Application → Lots → Sous-lots → Changements → Tasks
```

Le `Socle` reste obligatoire dans les deux cas.

---

## 17. Modèle de données logique minimal

L'implémentation doit au minimum représenter les entités suivantes :

| Entité | Relations essentielles |
| --- | --- |
| `Application` | possède plusieurs `Lot` |
| `Lot` | appartient à une application ; possède zéro ou plusieurs `SubLot` |
| `SubLot` | appartient à un seul lot |
| `CurrentSpec` | versionne l'état attendu d'un lot ou sous-lot |
| `Request` | demande brute ; groupe un ou plusieurs changements |
| `Change` | appartient à une demande ; cible un lot ou sous-lot |
| `Task` | appartient à un changement |
| `AcceptanceCriterion` | appartient à un changement ou une task |
| `Evidence` | prouve un ou plusieurs critères |
| `Decision` | conserve une décision de spécification ou d'architecture |
| `Dependency` | relie changements, tasks ou contrats |
| `Release` | agrège des changements terminés déployés ensemble |

Contraintes d'intégrité minimales :

- une application possède exactement un lot `FOUNDATION` ;
- un lot `BUSINESS` déclare son bounded context ;
- un changement cible exactement un lot ou un sous-lot, jamais les deux comme cibles concurrentes ;
- si un sous-lot est ciblé, son lot parent est déduit et immuable ;
- une task appartient à exactement un changement ;
- chaque critère obligatoire possède une preuve avant clôture ;
- la version de base d'un changement doit correspondre à la version courante au moment de l'approbation, sinon une re-spécification est exigée ;
- aucune task ne devient `IN_PROGRESS` si le changement parent n'est pas `APPROVED` ou `EXECUTING`.

---

## 18. Structure de stockage Markdown recommandée

Une implémentation basée sur des fichiers peut utiliser :

```text
applications/{application-id}/
├── application.md
├── architecture/
│   ├── enterprise-constraints.md
│   └── solution-decisions.md
├── lots/
│   ├── foundation/
│   │   ├── lot.md
│   │   ├── current-spec.md
│   │   ├── sublots/
│   │   └── changes/
│   └── {business-lot-id}/
│       ├── lot.md
│       ├── current-spec.md
│       ├── sublots/
│       │   └── {sublot-id}/
│       │       ├── sublot.md
│       │       ├── current-spec.md
│       │       └── changes/
│       └── changes/
├── requests/
├── releases/
└── decisions/
```

Chaque dossier de changement peut contenir :

```text
changes/{change-id}/
├── spec.md
├── tasks/
│   └── {task-id}.md
├── evidence/
└── delivery-report.md
```

Cette organisation est une projection possible du modèle, pas une obligation d'architecture technique.

---

## 19. Profondeur proportionnelle de la spécification

Toutes les interventions passent par une spécification, mais sa profondeur dépend du risque.

| Risque | Exemple | Exigence minimale |
| --- | --- | --- |
| `LOW` | correction visuelle locale | attendu, périmètre, critère, preuve |
| `MEDIUM` | bug fonctionnel local | reproduction, attendu, impacts, non-régression |
| `HIGH` | nouvelle capacité ou migration | règles, scénarios, données, contrats, rollback |
| `CRITICAL` | écriture bancaire, sécurité, réglementation | analyse complète et validations spécialisées |

Même au niveau `LOW`, quatre questions restent obligatoires :

1. Pourquoi changer ?
2. Où se situe la responsabilité ?
3. Quel résultat doit devenir vrai ?
4. Comment le prouver ?

---

## 20. Definition of Ready d'une task

Une task est prête lorsque :

- le changement parent est approuvé ;
- sa cible structurelle est connue ;
- son intention est compréhensible sans la demande orale d'origine ;
- son périmètre et ses exclusions sont explicites ;
- les règles métier nécessaires sont disponibles ;
- les politiques pertinentes du Socle sont attachées ;
- les critères d'acceptation sont observables ;
- les preuves exigées sont définies ;
- les dépendances bloquantes sont résolues ;
- aucune question bloquante ne subsiste.

## 21. Definition of Done d'une task

Une task est terminée lorsque :

- le comportement attendu est implémenté de bout en bout ;
- les couches nécessaires ont été mises à jour ;
- les critères d'acceptation sont reliés à des preuves valides ;
- les tests requis réussissent ;
- les contrats et politiques du Socle sont respectés ;
- les migrations nécessaires sont validées ;
- aucun écart non déclaré ne subsiste ;
- le rapport de livraison est produit.

## 22. Definition of Done d'un changement

Un changement est terminé lorsque :

- toutes ses tasks obligatoires sont terminées ;
- tous ses critères d'acceptation sont prouvés ;
- les validations requises selon le risque sont obtenues ;
- la spécification courante est consolidée si nécessaire ;
- la version de spécification est mise à jour ;
- les décisions et écarts sont archivés ;
- les impacts inter-lots sont vérifiés ;
- le changement est traçable depuis la demande jusqu'aux preuves.

---

## 23. Règles de décision essentielles

### Faut-il créer un nouveau sous-lot ?

Créer un sous-lot seulement pour une nouvelle capacité durable et autonome. Un redesign, une nouvelle version, un bug ou une migration ne suffit pas.

### Une capacité existante est-elle `DONE` ?

Non. Elle est `BASELINED`, `VERIFIED`, `ACTIVE`, `DEPRECATED` ou `RETIRED`. `DONE` est réservé aux changements et tasks.

### Une task peut-elle contenir backend et frontend ?

Oui. C'est même le comportement par défaut lorsque les deux participent au même résultat utilisateur vérifiable.

### Un bug est-il une évolution ?

Non. C'est un changement de type `CORRECTION`. Il suit néanmoins exactement le même passage obligatoire par la spécification.

### Le Socle est-il différent des autres lots ?

Sa portée est transverse, mais son cycle de vie est identique. Il possède des sous-lots optionnels, des changements, des tasks, des preuves et une spécification courante.

### Une application à un seul bounded context a-t-elle besoin de sous-lots ?

Non. Elle conserve son lot métier et le lot `Socle`, puis rattache directement les changements aux lots si cela suffit.

---

## 24. Critères d'acceptation de l'implémentation du framework

La première implémentation est acceptable si elle permet au minimum de :

1. créer une application avec génération automatique de son lot `Socle` ;
2. créer des lots métier associés à des bounded contexts ;
3. créer ou omettre les sous-lots ;
4. enregistrer une demande brute ;
5. faire produire par l'agent de spécification un ou plusieurs changements mono-lot ;
6. représenter les six types de changements ;
7. gérer les versions de spécification et détecter une base devenue obsolète ;
8. empêcher l'exécution avant approbation ;
9. générer des tasks verticales pouvant couvrir plusieurs couches techniques ;
10. fournir à l'agent d'exécution un contexte effectif filtré ;
11. bloquer et renvoyer à la spécification toute ambiguïté rencontrée ;
12. rattacher des preuves aux critères d'acceptation ;
13. consolider la spécification courante après livraison ;
14. intégrer progressivement une application existante sans considérer ses capacités comme `DONE` ;
15. représenter une capacité du Socle consommée depuis une plateforme d'entreprise ;
16. tracer la chaîne complète `Demande → Changement → Task → Code/Preuve → Version courante`.

---

## 25. Résumé exécutable

```text
STRUCTURE DURABLE

Application
└── Lots vivants
    ├── Socle obligatoire [FOUNDATION]
    └── Bounded contexts [BUSINESS]
        └── Sous-lots optionnels = capacités durables

FLUX DE CHANGEMENT

Demande brute
→ Agent de spécification
→ Changement mono-lot spécifié et approuvé
→ Tasks verticales vérifiables
→ Agent d'exécution
→ Preuves
→ Consolidation de la spécification courante

RÈGLE CENTRALE

Aucun code sans spécification approuvée.
Aucune clôture sans preuve.
```

