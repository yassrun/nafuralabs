# Architecture — Chiffrage assisté CPS

> Le PLAN dit *pourquoi* et *dans quel ordre* ; ce document dit *quoi*.
> Les status sont dans `00-PROGRESS.md`.

---

## 1. La frontière

```
le CPS prescrit  ·  la bibliothèque compose  ·  l'IA fait le pont
```

Trois responsabilités, trois natures de vérité :

| Brique | Produit | Vérifiable par |
|---|---|---|
| CPS | des **prescriptions** — classe, dosage, tolérance, norme | relecture de la section citée |
| Bibliothèque tenant (`ouvrages`) | des **recettes** — composants et rendements | l'expérience de l'entreprise |
| Catalogue Sektor (`catalog_ouvrages`) | des **recettes de référence**, éditées et datées | la gouvernance ≥ 3 tenants |
| Modèle | le **pont** — quelle prescription s'applique, quelle recette correspond | l'humain, sur un écran de revue |

Les deux référentiels existent en code et ne se touchent pas : `items` / `ouvrages` portent
`tenant_id`, aucune table `catalog_*` n'en porte, et le pont est `item_match` — une chaîne
`catalog_cle`, jamais une FK. Cet epic **consomme** cette frontière, il ne la modifie pas.

Ce qui n'a pas de source vérifiable est une **hypothèse**, et doit se nommer ainsi jusqu'au bout de
la chaîne.

---

## 2. Le flux cible

```
poste
  ├─ RECETTE      ouvrage tenant  →  catalog_ouvrage  →  (aucune)     ← déterministe, zéro token
  │                    │                    │                            RapprochementDeterministeService
  │                    └─── écart ──────────┘   ← résolu même quand le tenant gagne
  └─ PARAMÈTRES   recherche CPS   tsvector + trigram, top N, zéro token
       ├─ sections trouvées
       │    └─ APPEL 1  prescriptions ancrées  {classe, dosage, ferraillage, contraintes, sectionId}
       │         └─ la recette retenue est paramétrée par ces prescriptions
       │              └─ provenance = CPS (+ origine de la recette)
       ├─ rien au CPS mais une recette existe
       │    └─ recette telle quelle
       │         └─ provenance = BIBLIOTHEQUE | CATALOGUE
       └─ ni recette ni section
            └─ APPEL 2  recette devinée sur le libellé, confiance plafonnée
                 └─ provenance = LIBELLE_SEUL   → gate de validation d'étude
```

Les deux axes sont indépendants : d'où vient la **recette** et d'où viennent ses **paramètres**. Une
recette catalogue ajustée par une prescription CPS est le cas nominal, pas un cas limite.

**Le catalogue est résolu même quand il ne sert pas de recette** (D11). C'est ce qui permet
l'affichage de l'écart, et ça ne coûte rien : le rapprochement est déterministe, zéro appel modèle.
Un `catalog_ouvrage` a donc deux rôles distincts — **source de repli** quand le tenant n'a rien,
**comparateur** quand le tenant a quelque chose.

Un poste que le modèle déclare non décomposable sort en `NON_DECOMPOSABLE` — état explicite, pas une
liste vide.

---

## 3. Les contrats

### 3.1 `CpsSection` — écrit pour être remplacé

```
CpsSection
  numero        3.2.1
  titre         Bétons pour infrastructure
  chemin        CHAPITRE III › 3.2 › 3.2.1      ← nouveau (lot 1)
  contenu       texte de la section, plafonné    ← nouveau (lot 1)
  ordre         position dans le document
```

Le `chemin` sert deux fois : il est indexé en pondération `A` (une section retrouve son sujet même
quand le corps ne le répète pas), et il donne au prompt le contexte qui dit si le passage parle de
fourniture, de mise en œuvre ou de contrôle.

Ce contrat est **le point de raccord avec `document-reader` vague 3**. Le jour où la plateforme sait
sectionner un document en blocs multiples, elle rend cette structure et `CpsSectionneur` disparaît.
D'ici là il reste dans `etudes` : provisoire, pas définitif.

### 3.2 `PrescriptionCps` — sortie de l'appel 1

Typée, bornée, **chaque valeur porte sa section source**. Une valeur sans `sectionId` n'est pas une
prescription : c'est une hypothèse, et elle est rejetée à ce niveau.

### 3.3 `DecompositionPropose` — enrichi

| Champ | Ajout | Pourquoi |
|---|---|---|
| `origineRecette` | `BIBLIOTHEQUE` \| `CATALOGUE` \| `MODELE` \| `AUCUNE` | d'où vient la composition |
| `originePrescription` | `CPS` \| `AUCUNE` | d'où viennent ses paramètres — indépendant de la ligne au-dessus |
| `editionCatalogue` | `2026.1`, dès qu'un `catalog_ouvrage` a été rapproché | une étude doit pouvoir dire sur quelle édition elle s'est comparée |
| `ecartCatalogue` | `{ deboursTenant, deboursCatalogue, ecartPercent, catalogCle }` — nullable | D11 : le tenant calcule, le catalogue se voit |
| `sectionsUtilisees[]` | id + référence | rend la proposition auditable et la section cliquable |
| `confiance` | **calculée**, plus auto-déclarée | rang tsvector × score catalogue × origine du rendement |
| `missing[].raison` | `item_absent` \| `item_non_tarifé` | deux gestes utilisateur différents |

`suggereParIa` doit survivre à l'enregistrement : aujourd'hui il n'est pas dans le DTO d'écriture, et
la traçabilité meurt au rechargement de la page.

---

## 4. Le pont vers les articles

Le modèle ne produit plus une désignation libre que l'on tente ensuite de rapprocher. Il **choisit
dans une liste fermée** : on pré-filtre N candidats, on les lui donne, il renvoie un identifiant ou
rien. Le problème de rapprochement disparaît — il n'y a plus de texte à rapprocher — et l'invention
de désignation devient impossible. Même principe que D2 de `document-reader` : borner ce que le modèle
peut dire.

**Le pré-filtre n'est pas à écrire.** [`RapprochementDeterministeService`](../../../../backend/modules/catalogue/src/main/java/ma/nafura/catalogue/service/RapprochementDeterministeService.java)
existe : trigram (`TRIGRAM_MIN = 0.35`), règles de synonymes (`REGLE_MIN = 0.55`),
`LlmRapprochementPort` en dernier recours, et un cycle `SUGGERE` → `VALIDE` / `REJETE` avec
traçabilité. Le `LIKE %terme%` d'`ItemCatalogResolver` en est un doublon dégradé, écrit parce que
`etudes` ne dépend pas de `catalogue`.

Ce qui manque n'est donc pas un algorithme mais **une dépendance de module et un port** : `etudes`
déclare ce qu'il cherche, `catalogue` rend des candidats classés. Sens unique, comme la frontière
de `document-reader`.

---

## 5. La boucle de retour

Une décomposition validée par le chiffreur est la seule donnée de qualité que le système produit.
Aujourd'hui elle est jetée.

```
poste décomposé et enregistré
  └─ proposition de versement en ouvrage bibliothèque
       └─ la bibliothèque grossit
            └─ le niveau 2 de l'escalier absorbe les cas suivants
                 └─ l'IA n'est plus sollicitée que pour du neuf
```

C'est ce qui fait décroître le coût et croître la qualité avec l'usage, au lieu de repayer le même
appel pour la même erreur. Le wireframe `etude-versement-biblio` existe déjà dans l'epic archivé
`referentiel-catalogue-sektor` — à recenser avant de redessiner.

---

## 6. Placement

| Brique | Où |
|---|---|
| sectionneur, recherche, prescriptions | `products/sektor-btp/backend/modules/etudes/…/service/cps/` |
| escalier des sources, résolution catalogue | `…/service/DecompositionProposeService.java` |
| recherche de recettes et d'articles de référence | `modules/catalogue/` — **existant**, à brancher (`etudes/build.gradle`) |
| adaptateurs modèle | `products/sektor-btp/backend/app/…/erp/etudes/` |
| badges de provenance, écran hypothèses | `…/web/app/pages/etudes/dossiers/components/` |
| gate de validation | `…/service/gate/GatesEtude.java` |

Rien ne monte en `platform/` dans cet epic. Interpréter une prescription BTP est du métier ;
`docs/AGENTS.md` règle 5.

---

## 7. Décisions actées

| # | Décision | Justification |
|---|---|---|
| **D1** | Le CPS prescrit, il ne compose pas — deux étapes séparées | Mélangées, on ne peut plus dire d'où vient une valeur, et le résultat devient inauditable |
| **D2** | Toute valeur issue du modèle porte sa section source, ou elle est marquée hypothèse | C'est la seule ligne qui sépare une lecture d'une invention |
| **D3** | Une hypothèse ne bloque pas la saisie ; elle bloque la validation de l'étude tant qu'un humain ne l'a pas vue | Le coût d'une hypothèse fausse se matérialise à la soumission, pas à la saisie |
| **D4** | Ordre des recettes : ouvrage tenant → `catalog_ouvrage` → modèle | Un ouvrage validé par le chiffreur bat une recette éditée, qui bat une proposition. Les deux premiers coûtent zéro appel |
| **D5** | Le modèle choisit un identifiant dans une liste fermée ; il n'invente pas de désignation | Supprime le rapprochement texte, qui échoue aujourd'hui sur la moindre variante d'écriture |
| **D5b** | Le pré-filtre réutilise `RapprochementDeterministeService` ; `etudes` gagne une dépendance vers `catalogue` et un port | Le trigram, les règles et la gouvernance sont déjà écrits. Le `LIKE` d'`ItemCatalogResolver` est un doublon né de l'absence de dépendance |
| **D6** | La confiance est calculée, jamais auto-déclarée | Une confiance de modèle n'est pas calibrée : elle ne peut pas servir de seuil |
| **D7** | Ici l'IA lit les données — exception assumée à D2 de `document-reader` | Une prescription en prose n'a pas de grille contre laquelle compiler un plan. Contrepartie : sortie typée, bornée, ancrée, jamais persistée sans revue |
| **D8** | Aucun moteur d'extraction nouveau ; `CpsSectionneur` est provisoire et son contrat écrit pour être remplacé | Ce dépôt a déjà payé deux fois la construction en spéculation. Le CPS est vague 3 de `document-reader` |
| **D9** | Rien n'est persisté sans revue humaine | Aligné sur D12 de `document-reader` |
| **D10** | Aucun réglage de prompt sans étalon | Sans mesure, une amélioration de prompt est une opinion |
| **D11** | **La recette tenant calcule ; l'écart avec le catalogue s'affiche.** Le catalogue est donc résolu même quand il ne fournit pas la recette | *(tranchée le 11/08)* Aligner par défaut sur le catalogue imposerait à une entreprise des rendements qui ne sont pas les siens ; ne rien afficher ne lui dirait jamais qu'elle est hors marché. Le chiffreur décide, informé. Coût nul : le rapprochement est déterministe |
| **D12** | **Un seul écart, au niveau du déboursé de l'ouvrage**, au-delà d'un seuil ; le détail par composant à la demande | *(tranchée le 11/08)* Douze badges de rendement sur un poste ne se lisent pas. Une alerte qui crie au loup en discrédite mille — même raisonnement que D9 de `document-reader`. Le détail existe, il n'est pas imposé |

---

## 8. Ce que l'architecture ne prévoit pas

- **Un chiffrage automatique de bout en bout.** La promesse tenable est différente et mesurable :
  chaque poste arrive au chiffreur avec sa provenance et ses manques correctement localisés.
- **L'enrichissement du catalogue Sektor.** Il a son module, sa gouvernance (≥ 3 tenants) et ses
  éditions. Cet epic le **lit** ; il n'y verse rien et ne touche pas à sa file de candidats.
- **L'OCR des CPS scannés.** `STATUT_NON_SUPPORTE` reste, la saisie manuelle reste ouverte.
- **La réparation d'un CPS incomplet.** On signale ce qui manque, on ne le comble pas.
- **Un modèle qui apprend tout seul des corrections.** La boucle passe par la bibliothèque, donc par
  une validation humaine explicite.
