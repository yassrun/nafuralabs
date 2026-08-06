# Raffinement du module RH et pointage

**Statut** : Lot 1 implémenté (ERP-28) — décisions §7 tranchées ([`01-ADR`](./01-ADR-decisions-ouvertes.md)) · next Lot 2
**Périmètre** : `products/sektor-btp/backend/modules/rh/`,
`products/sektor-btp/web/app/pages/rh/`, `products/sektor-btp/web/app/rh/`
**Objectif** : faire du pointage une pièce fiable — non dupliquée, non écrasable, tracée — puis
brancher la chaîne qu'il alimente : heures supplémentaires, paie, et coût de main d'œuvre au
chantier.

---

## 1. Verdict

Le module RH a plus de surface que les deux précédents : employés, contrats, habilitations,
formations, congés avec soldes, frais de déplacement, heures supplémentaires, fiches de paie,
pointage par lot avec GPS et signature, planning d'équipes. Le découpage est bon et le pointage par
lot signé par le chef de chantier est le bon geste métier.

Mais les pièces ne se parlent pas. **La chaîne pointage → heures supplémentaires → fiche de paie →
coût chantier est rompue à chacun de ses trois maillons** : rien ne relie ces tables entre elles au
runtime. Le pointage est donc aujourd'hui un registre de présence isolé, qui n'alimente ni la paie
ni le budget du chantier — c'est-à-dire qu'il ne sert pas encore à ce pour quoi on le saisit.

Deux défauts plus graves se cachent dessous : un pointage peut en écraser un autre en silence, et le
calcul de paie comporte trois erreurs de méthode. Ce sont eux qui commandent l'ordre des lots.

Enfin, le module compte **deux classes de test** (`EmployeServiceTest`, `FichePaieCalculatorTest`).
Le pointage, qui est le chemin critique, n'en a aucune.

---

## 2. Constat

### 2.1 Bloquants — perte de données et paie fausse

**A — Un pointage peut en écraser un autre, en silence.**
L'identifiant est déterministe et ne contient pas le chantier :

```java
// PointageBatchService.java:186-188
private static String defaultPointageId(LocalDate date, String employeId) {
    return "pt-" + date + "-" + employeId;
}
```

`pointageRepository.save()` sur une clé primaire déjà présente fait un merge. Donc un employé pointé
le matin sur le chantier A puis l'après-midi sur le chantier B, le même jour, voit son premier
pointage **remplacé** — heures comprises. Le chantier A perd ses heures sans qu'aucune erreur ne soit
levée. C'est le défaut le plus grave du module : il détruit de la donnée déjà saisie.

**B — Aucune contrainte d'unicité ne protège le pointage.**
`002_create_pointages.sql` ne pose aucune unicité sur `pointages (tenant_id, employe_id, date)` ni
sur `pointage_batches (tenant_id, chantier_id, date_pointage)`. La seule contrainte est
`UNIQUE (tenant_id, client_id)` — et `client_id` est nullable, donc inopérante en Postgres pour les
lignes qui ne le renseignent pas. Deux chefs peuvent pointer le même chantier le même jour, et le
même employé peut être compté deux fois. La base ne rattrape pas ce que le code A détruit.

**C — La chaîne est rompue en trois endroits.**

| Maillon | État | Preuve |
|---|---|---|
| Pointage → heures sup | rompu | `heures_supplementaires.pointage_id` n'est renseigné que par le seed ou la saisie manuelle ; `PointageBatchService.valider()` ne crée aucune HS |
| Heures sup → paie | rompu | `FichePaieService` reçoit `montantHeuresSup` en paramètre d'entrée, il ne lit jamais la table `heures_supplementaires` |
| Pointage → coût chantier | rompu | `pointages.poste_budgetaire_id` existe, mais aucun code du module `chantiers` ne lit `PointageRepository` |

Conséquence : les heures sont ressaisies trois fois, et le déboursé main d'œuvre d'un chantier ne
peut pas être constaté. C'est précisément ce que la nature `MAIN_DOEUVRE` du plan classification
article attend en face d'elle.

**D — Le calcul de paie comporte trois erreurs de méthode.**
`FichePaieCalculator.java` :

1. **Les deux cotisations n'ont pas la même assiette.** La CNSS est calculée sur `salaireBase`
   (ligne 38), l'AMO sur `salaireBrut` (ligne 39). Les deux devraient partir du même brut imposable.
2. **Aucun abattement pour frais professionnels avant l'IR.** Le net imposable est calculé comme
   `brut − CNSS − AMO` (ligne 41), sans la déduction pour frais professionnels que prévoit le droit
   marocain. **L'IGR est donc systématiquement surévalué**, et le net à payer sous-évalué.
3. **Le barème IGR est périmé.** Les tranches codées (30 000 / 50 000 / 60 000 / 80 000 / 180 000,
   abattements 3 000 à 24 400) correspondent au barème antérieur à la loi de finances 2025, qui a
   relevé la tranche exonérée et abaissé les taux intermédiaires. Voir §4.5 : les chiffres cibles
   sont à faire confirmer, mais le barème en place n'est en tout cas plus celui en vigueur.

S'ajoutent trois absences : pas de déduction pour charges de famille, pas de CIMR, et **aucune
cotisation patronale** — donc aucun coût employeur calculable, alors que c'est lui, et non le salaire
brut, qui doit alimenter un déboursé sec.

**E — Un employé en congé approuvé peut être pointé présent.**
`AbsenceService.isEmployeAvailable()` fait exactement ce contrôle, correctement. Mais il n'est appelé
que par `chantiers/ApproverResolutionService` — jamais par le pointage. Rien ne vérifie non plus que
l'employé existe : `toPointageDto()` fait `orElse(null)` et retombe sur l'identifiant brut
(ligne 155).

**F — La validation d'un lot ne vérifie rien et ne trace rien.**
`valider()` (ligne 115) passe le lot et ses lignes en `VALIDE` sans contrôler le statut de départ :
un lot déjà validé peut être revalidé, un lot rejeté aussi. Aucun `validated_by`, aucun
`validated_at`. La table `pointages` n'a même pas de colonne `updated_at`. Une pièce qui engage la
paie doit dire qui l'a validée et quand.

### 2.2 Défauts de modèle

**G — Les clés primaires sont des `VARCHAR(100)`.**
Tout le module RH utilise des chaînes comme identifiants (`employes.id`, `pointages.id`,
`conges.id`, `fiches_paie.id`…), là où le reste de la plateforme utilise `UUID`. Les identifiants
sont construits par concaténation (`pb-2026-08-05-ch-001`, `pt-2026-08-05-emp-012`), ce qui est
précisément la cause du défaut A.

**H — Aucune clé étrangère vers `employes`.**
`pointages`, `conges`, `fiches_paie`, `contrats`, `habilitations`, `formations`,
`frais_deplacement`, `heures_supplementaires` portent tous un `employe_id VARCHAR(100)` sans
`REFERENCES`. Seul `pointages.batch_id` a une contrainte. Un employé supprimé laisse des orphelins
partout.

**I — Les heures d'arrivée et de départ sont du texte.**
`heure_arrivee VARCHAR(5)`, `heure_depart VARCHAR(5)`. Pas de type `TIME`, donc aucune arithmétique
possible en base, et rien n'empêche `"25:99"`. Corollaire : `heures_normales` et `heures_sup` sont
saisies à la main sans être recoupées avec les horaires.

**J — Le chantier est une chaîne.**
`chantier_id VARCHAR(100)` sur `pointages` et `pointage_batches`. Même défaut que dans le module
stock, où la référence chantier prend quatre formes différentes. À unifier au même moment.

**K — Le nom de l'employé est recopié dans quatre tables.**
`employe_nom` est dénormalisé dans `conges`, `fiches_paie`, `frais_deplacement`, et
`materiel_affectations` côté stock. Un changement d'état civil fait diverger l'historique.

**L — Deux sources pour les heures supplémentaires.**
`pointages.heures_sup` et la table `heures_supplementaires` portent la même information, sans
synchronisation. Laquelle fait foi n'est écrit nulle part.

**M — Les paramètres de paie sont des constantes Java non datées.**
`CNSS_RATE`, `AMO_RATE`, `CNSS_PLAFOND`, et tout le barème IGR sont figés dans le code. Trois
conséquences : il faut redéployer à chaque loi de finances, les taux ne peuvent pas différer d'un
tenant à l'autre, et **recalculer une fiche de paie de l'an dernier lui applique le barème
d'aujourd'hui**.

### 2.3 Défauts de plomberie

**N — Un mapping de démonstration fuit dans l'API.**
```java
// PointageBatchService.java:30-33
private static final Map<String, String> CHANTIER_CODES = Map.of(
        "ch-001", "CH-2025-001", "ch-002", "CH-2025-002", "ch-003", "CH-2025-003");
```
Le `chantierCode` renvoyé au front est correct pour trois chantiers fictifs et vaut l'identifiant
brut pour tous les autres.

**O — Des dates sont codées en dur comme bornes par défaut.**
`PointageService.java:56-57` et `:120` utilisent `LocalDate.of(2026, 1, 1)` et
`LocalDate.of(2099, 12, 31)`. La borne basse masquera les pointages antérieurs à 2026 ; la borne
haute est un aveu de pagination absente : la liste sans filtre charge tout.

**P — `seedIfEmpty()` est appelé dans les chemins de lecture des services de production.**
`PointageService.list()`, `listByEmploye()`, `update()`, `syntheseChantier()`, `RhKpiService.compute()`
appellent tous le seed de démonstration. C'est neutralisé aujourd'hui par
`DemoSeedRuntimeGuardAspect`, adossé à `nafura.demo.runtime-seed-enabled` qui vaut `false` par
défaut — donc pas de risque en production tant que ce garde tient. Reste que la protection est un
aspect AOP posé sur une convention de nommage : la sécurité repose sur le fait que personne ne
renomme la méthode. À déplacer hors des services de lecture.

**Q — La masse salariale du tableau de bord est une approximation.**
`RhKpiService.java:50-54` calcule `somme des salaires de base × numéro du mois courant`. Cela ignore
les entrées et sorties en cours d'année, les indemnités, les heures supplémentaires et les charges —
et n'utilise pas `fiches_paie`, qui contient pourtant le brut réel.

**R — GPS, signature et photo sont capturés mais jamais exploités.**
`pointage_batches` stocke `gps_lat`, `gps_lng`, `signature_url`, `photo_url`. Aucun contrôle de
distance au chantier, aucune obligation de signature avant validation. La preuve est collectée mais
ne prouve rien.

**S — Deux écrans sont inaccessibles.**
`web/app/pages/rh/heures-sup/` et `web/app/pages/rh/frais-deplacement/` ont leurs services d'API et
leurs pages, mais aucune route dans `rh.routes.ts`. Le backend correspondant existe et fonctionne :
c'est du travail fait qu'on ne peut pas atteindre. À l'inverse, `contrats`, `habilitations` et
`formations` ont un backend complet et **aucun** écran.

**T — `/api/sync/**` est déclaré public sans contrôleur derrière.**
`application.yml:88` place ce préfixe dans `security.public-endpoints`. Aucun contrôleur ne le sert
aujourd'hui. Une route publique sans usage est une surface à retirer, ou à documenter si elle est
réservée à la synchronisation mobile à venir.

---

## 3. Modèle cible

**3.1 — Le pointage devient une pièce.**
Clé technique en `UUID`, comme partout ailleurs. L'unicité métier passe par une contrainte, pas par
la construction de l'identifiant :
`UNIQUE (tenant_id, employe_id, date, chantier_id)`, plus
`UNIQUE (tenant_id, chantier_id, date_pointage)` sur le lot.
Ajout de `updated_at`, `validated_by`, `validated_at`. Une seconde saisie sur la même clé est
refusée avec un message qui nomme le conflit — jamais un écrasement.

**3.2 — La validation devient un point de passage qui produit.**
`valider()` contrôle le statut de départ, vérifie que chaque employé existe, est actif et n'est pas
en congé ce jour-là (`AbsenceService`, qui est déjà écrit), recoupe les heures saisies avec les
horaires, puis **génère les heures supplémentaires** correspondantes selon la matrice §4.3. Le
pointage validé devient la seule source des HS ; `pointages.heures_sup` reste la saisie,
`heures_supplementaires` devient le calculé.

**3.3 — La paie lit ce qui a été validé.**
`FichePaieService` construit la fiche à partir des `heures_supplementaires` validées du mois et des
absences non rémunérées, au lieu de recevoir un montant en paramètre. Les paramètres de calcul
sortent du code Java pour une table `parametres_paie` **datée** : une fiche recalculée applique les
paramètres en vigueur à son mois, pas ceux d'aujourd'hui.

**3.4 — Le coût de main d'œuvre remonte au chantier.**
À la validation du lot, chaque pointage produit un coût = heures × coût horaire chargé de l'employé,
imputé sur `poste_budgetaire_id`. C'est ce qui ferme la boucle avec la nature `MAIN_DOEUVRE` du
catalogue article : le déboursé prévu au chiffrage devient comparable au déboursé constaté.

Le coût horaire chargé se calcule à partir du brut **et des cotisations patronales** — sans elles,
le coût chantier est sous-estimé d'environ un cinquième.

---

## 4. Valeurs de référence

### 4.1 Modes de pointage — enum, 9 valeurs

Les six modes actuels (`PRESENT`, `ABSENT`, `CONGE`, `MALADIE`, `FORMATION`, `AUTRE`) manquent trois
cas spécifiques au chantier.

| Code | Libellé | Rémunéré | Compte en présence |
|---|---|---|---|
| `PRESENT` | Présent | oui | oui |
| `ABSENT` | Absent injustifié | non | non |
| `CONGE` | Congé | oui | non |
| `MALADIE` | Maladie | selon justificatif | non |
| `ACCIDENT_TRAVAIL` | Accident du travail | oui | non |
| `FORMATION` | Formation | oui | non |
| `INTEMPERIES` | Arrêt intempéries | oui | non |
| `REPOS` | Repos hebdomadaire ou férié | — | non |
| `AUTRE` | Autre | à préciser | non |

`INTEMPERIES` et `ACCIDENT_TRAVAIL` ne sont pas des variantes d'absence : le premier est un aléa
chantier qui doit pouvoir être compté au budget, le second relève d'un régime CNSS distinct de la
maladie.

### 4.2 Statuts — enums, pas de table

| Enum | Valeurs |
|---|---|
| Statut de lot | `BROUILLON`, `SOUMIS`, `VALIDE`, `REJETE` |
| Statut de pointage | `BROUILLON`, `VALIDE`, `CONTESTE` |
| Statut d'employé | `ACTIF`, `SUSPENDU`, `SOLDE` |
| Statut de congé | `BROUILLON`, `SOUMIS`, `APPROUVE`, `REFUSE`, `EN_COURS`, `SOLDE` |

### 4.3 Heures supplémentaires — la matrice légale

Le `CHECK` actuel n'accepte que `HS25`, `HS50`, `HS100`, ce qui écrase deux cas distincts sur
`HS50`. La majoration dépend de deux axes, pas d'un.

| | Jour ouvrable | Jour de repos ou férié |
|---|---|---|
| **6 h – 21 h** | `HS25` — +25 % | `HS50_REPOS` — +50 % |
| **21 h – 6 h** | `HS50_NUIT` — +50 % | `HS100` — +100 % |

Quatre codes au lieu de trois, et la majoration se déduit du couple (période, type de jour) plutôt
que d'être saisie ligne à ligne dans `taux_majoration`.

### 4.4 Catégories et contrats

Catégories alignées sur les sous-familles `MAIN_DOEUVRE_FAM` du plan classification article, pour que
le coût constaté et le coût chiffré parlent le même langage.

| Code | Libellé | Famille article correspondante |
|---|---|---|
| `MANOEUVRE` | Manœuvre | `MO_MANOEUVRE` |
| `OUVRIER_SPECIALISE` | Ouvrier spécialisé | `MO_SPECIALISEE` |
| `OUVRIER_QUALIFIE` | Ouvrier qualifié | `MO_QUALIFIEE` |
| `CHEF_EQUIPE` | Chef d'équipe | `MO_ENCADREMENT` |
| `CHEF_CHANTIER` | Chef de chantier | `MO_ENCADREMENT` |
| `CONDUCTEUR_TRAVAUX` | Conducteur de travaux | `MO_ENCADREMENT` |
| `TECHNICIEN` | Technicien | `MO_ENCADREMENT` |
| `ETAM` | Employé, technicien, agent de maîtrise | `MO_ENCADREMENT` |
| `CADRE` | Cadre | `MO_ENCADREMENT` |

Types de contrat : `CDI`, `CDD`, `CONTRAT_CHANTIER`, `ANAPEC`, `INTERIM`, `STAGE`, `ESSAI`.
`CONTRAT_CHANTIER` manque aujourd'hui alors que c'est la forme dominante sur les chantiers.

### 4.4 bis — Mode d'imputation

Axe **distinct de la catégorie**, porté par l'employé. Il ne se déduit pas du niveau hiérarchique :
un chef d'équipe est direct parce qu'il est sur l'ouvrage, un conducteur de travaux de rang
équivalent ne l'est pas.

| Code | Qui | Pointage | Imputation du coût |
|---|---|---|---|
| `DIRECT` | Manœuvre, OS, OQ, chef d'équipe | par chantier, obligatoire | déboursé sec du chantier |
| `INDIRECT_CHANTIER` | Chef de chantier, conducteur de travaux | par chantier, plusieurs lignes par jour | frais de chantier |
| `FRAIS_GENERAUX` | Directeur de travaux, siège, administratif | présence seule, sans chantier | réparti mensuellement par une clé |

Raison d'être : demander à un directeur de travaux de déclarer chaque jour « 3 h sur A, 2 h sur B,
3 h sur C » produit une fiction précise, pas une donnée. Les ressources transverses se répartissent
en fin de mois par une clé, elles ne se pointent pas au chantier.

Types de congé : `ANNUEL`, `MALADIE`, `ACCIDENT_TRAVAIL`, `MATERNITE`, `PATERNITE`, `EXCEPTIONNEL`
(mariage, naissance, décès), `SANS_SOLDE`.

### 4.5 Paramètres de paie — table datée, pas de constantes

> **À faire valider par votre expert-comptable avant implémentation.** Les valeurs ci-dessous sont
> celles que je retiens comme cibles, mais elles engagent juridiquement l'entreprise et elles
> changent à chaque loi de finances. C'est justement pourquoi elles doivent vivre dans une table
> datée : la structure ci-dessous compte plus que les chiffres.

Table `parametres_paie` avec `code`, `valeur`, `date_debut`, `date_fin`, `tenant_id` nullable pour
un défaut commun surchargeable.

| Code | Valeur cible | Assiette |
|---|---|---|
| `CNSS_SALARIAL` | 4,48 % | brut plafonné |
| `CNSS_PLAFOND` | 6 000 MAD / mois | — |
| `AMO_SALARIAL` | 2,26 % | brut, non plafonné |
| `CNSS_PATRONAL` | à confirmer | brut plafonné |
| `AMO_PATRONAL` | à confirmer | brut |
| `ALLOCATIONS_FAMILIALES` | à confirmer | brut |
| `TAXE_FORMATION_PRO` | à confirmer | brut |
| `FRAIS_PROFESSIONNELS_TAUX` | 35 % sous seuil, 25 % au-dessus | brut imposable |
| `FRAIS_PROFESSIONNELS_PLAFOND` | annuel, à confirmer | — |
| `DEDUCTION_CHARGE_FAMILLE` | par personne, max 6 | montant annuel |

Barème IR à la charge de la même table, en lignes datées (tranche basse, tranche haute, taux,
somme à déduire). Le barème actuellement codé est antérieur à la loi de finances 2025 et doit être
remplacé par celui en vigueur — à récupérer auprès de votre comptable, pas depuis ce document.

**Le point structurant, indépendant des chiffres** : tant que ces valeurs sont des constantes Java,
recalculer une fiche de paie ancienne lui appliquera les taux d'aujourd'hui. C'est ça qu'il faut
corriger d'abord.

---

## 5. Lots d'exécution

### Lot 1 — Rendre le pointage infalsifiable

- Migration : `pointages.id` et `pointage_batches.id` en `UUID` ; identifiants générés, plus
  concaténés. Supprimer `defaultPointageId()` (ligne 186).
- Ajouter `UNIQUE (tenant_id, employe_id, date, chantier_id)` sur `pointages` et
  `UNIQUE (tenant_id, chantier_id, date_pointage)` sur `pointage_batches` — dédoublonner d'abord.
- Remplacer `UNIQUE (tenant_id, client_id)` par un index partiel `WHERE client_id IS NOT NULL`.
- Ajouter `updated_at`, `validated_by`, `validated_at` sur les deux tables.
- Sur conflit, lever une erreur métier qui nomme le pointage existant — jamais de merge silencieux.
- Retirer `CHANTIER_CODES` (ligne 30) et résoudre le code chantier par lookup.
- Retirer les bornes de date en dur (`PointageService.java:56-57`, `:120`), paginer la liste.

**Fin de lot** : un test vérifie que pointer deux fois le même employé le même jour sur le même
chantier échoue, et que sur deux chantiers différents les deux pointages coexistent.

### Lot 2 — La validation contrôle et produit

- `valider()` refuse un lot qui n'est pas en `BROUILLON` ou `SOUMIS`.
- Contrôles à la validation : l'employé existe, il est `ACTIF`, il n'est pas en congé
  (`AbsenceService.isEmployeAvailable()`, déjà écrit), les heures saisies sont cohérentes avec les
  horaires.
- **Plafond journalier contrôlé au-dessus du lot.** Deux chefs de chantier valident chacun leur lot
  en ignorant l'autre : le total des heures d'un employé sur sa journée ne peut être vérifié qu'en
  croisant tous les lots de cette date. Le contrôle interroge `pointages` par
  `(tenant_id, employe_id, date)`, pas le lot courant.
- Un employé en mode `FRAIS_GENERAUX` (§4.4 bis) est refusé dans un lot rattaché à un chantier.
- Migrer `heure_arrivee` / `heure_depart` en `TIME`.
- Génération automatique des `heures_supplementaires` selon la matrice §4.3, avec `pointage_id`
  renseigné ; ces lignes deviennent en lecture seule côté écran.
- Élargir le `CHECK` de `heures_supplementaires.type` aux quatre codes.
- Tracer `validated_by` et `validated_at`.

**Fin de lot** : valider un lot de 10 pointages dont 2 en heures de nuit produit les HS attendues,
et pointer un employé en congé approuvé est refusé.

### Lot 3 — Paie juste et paramétrée

- Nouvelle table `parametres_paie` (§4.5) + seed des valeurs validées par le comptable.
- Réécrire `FichePaieCalculator` : assiette unique pour CNSS et AMO, abattement pour frais
  professionnels avant l'IR, barème lu depuis la table à la date du mois de paie, déduction pour
  charges de famille, cotisations patronales et coût employeur.
- `FichePaieService` lit les `heures_supplementaires` validées du mois au lieu de recevoir
  `montantHeuresSup` en paramètre.
- Une fiche de paie validée fige ses paramètres — recalcul ultérieur interdit ou explicitement
  versionné.
- Étendre `FichePaieCalculatorTest` : un cas par tranche du barème, un cas plafond CNSS, un cas avec
  charges de famille.

**Fin de lot** : une fiche de paie de référence fournie par le comptable est reproduite au centime.

### Lot 4 — Le coût remonte au chantier

- À la validation d'un lot, produire une écriture de coût main d'œuvre par pointage :
  heures × coût horaire chargé, imputée selon le mode d'imputation de l'employé (§4.4 bis) —
  déboursé sec pour `DIRECT`, frais de chantier pour `INDIRECT_CHANTIER`.
- Coût horaire chargé dérivé du contrat en cours et des paramètres patronaux (§4.5).
- Répartition mensuelle des `FRAIS_GENERAUX` sur les chantiers actifs selon une clé paramétrable,
  en une écriture distincte des coûts pointés — pour que le réalisé direct reste lisible seul.
- Exposer le réalisé main d'œuvre par chantier et par poste, comparable au chiffré.
- Unifier la référence chantier en `UUID` — à faire au même moment que le constat J du plan stock,
  pas séparément.

**Fin de lot** : le déboursé main d'œuvre constaté d'un chantier est consultable et se rapproche du
DPU.

### Lot 5 — Intégrité et nettoyage

- Clés étrangères vers `employes` sur les huit tables concernées (constat H).
- Supprimer les colonnes `employe_nom` dénormalisées, joindre à la lecture (constat K).
- Router les écrans `rh/heures-sup` et `rh/frais-deplacement` (constat S), ou les supprimer si la
  décision est de ne pas les livrer.
- Sortir les appels `seedIfEmpty()` des services de lecture (constat P).
- `RhKpiService` : calculer la masse salariale depuis `fiches_paie` (constat Q).
- Retirer `/api/sync/**` de `security.public-endpoints` tant qu'aucun contrôleur ne le sert
  (constat T).
- Exploiter GPS et signature : contrôle de distance au chantier paramétrable, signature obligatoire
  avant soumission (constat R).

---

## 6. Hors périmètre

- Les écrans contrats, habilitations et formations, dont le backend existe sans interface — c'est un
  chantier de livraison, pas de raffinement.
- Les adaptateurs `cnss-damancom` et `cnss-dat` présents côté front : leur place dans l'architecture
  est une question distincte, à traiter avec le sujet intégrations.
- La synchronisation hors-ligne du pointage mobile.
- Le planning d'équipes (`PlanningReadService`), qui ne présente pas de défaut d'intégrité.

---

## 7. Questions ouvertes

> ADR : [`01-ADR-decisions-ouvertes.md`](./01-ADR-decisions-ouvertes.md) (ERP-27).

**7.1 — Un employé peut-il être pointé sur deux chantiers le même jour ? — TRANCHÉE**
Oui. L'entreprise a des ressources transverses, à commencer par le directeur de travaux. La clé
d'unicité inclut donc le chantier (Lot 1), le plafond journalier se contrôle en croisant les lots
(Lot 2), et un axe `mode_imputation` distingue les ressources directes des transverses
(§4.4 bis, Lot 4).

**7.1 bis — Quelle clé de répartition pour les frais généraux ? — TRANCHÉE**
**A** (prorata déboursé direct MO) + override manuel **C** optionnel par période. Pratique
analyse de coût chantier marocaine ; CA (B) écarté. Voir ADR.

**7.2 — Les paramètres de paie sont-ils communs ou par tenant ? — TRANCHÉE**
Légal CNSS/AMO/IR commun (`tenant_id` null) ; overlays tenant (CIMR, mutuelle, CC).
Chiffres §4.5 à valider par le comptable avant seed Lot 3.

**7.3 — Que fait-on des pointages déjà saisis ? — TRANCHÉE**
Inventaire staging (SQL dans l’ADR) avant migrate Lot 1 ; dédupliquer (garder le plus récent)
puis poser les `UNIQUE`.

**7.4 — Comment les fichiers SQL sont-ils appliqués ? — TRANCHÉE**
Liquibase out-of-process via Job K8s `sektor-btp-lifecycle` (même décision que classification
ADR §7.3). Déposer sous `modules/rh/.../db/changelog/schema/v1.1/`. `make migrate APP=sektor-btp`.
