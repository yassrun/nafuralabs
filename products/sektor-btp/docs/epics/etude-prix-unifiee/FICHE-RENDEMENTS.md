# Fiche de rendements — à remplir par l'expert métier

**Objet** : constituer le premier jeu de rendements réels, qui servira de référence aux tests
de calcul et de première entrée dans la bibliothèque d'ouvrages.

**Comment remplir** : ne remplissez que ce que vous connaissez. Une ligne vide vaut mieux
qu'une estimation — les valeurs actuellement dans le code sont inventées, et c'est précisément
ce qu'on veut arrêter. Ajoutez des lignes ou des ouvrages si le découpage ne colle pas.

---

## Deux façons de donner un rendement

**Matériaux et matériel** — quantité **par unité d'ouvrage** :

> Pour 1 m³ de béton, il faut ___ kg de ciment.

**Main d'œuvre** — c'est différent. Vous raisonnez en **rendement journalier d'équipe** :

> Une équipe de ___ personnes réalise ___ m² par jour.

C'est bien cette forme-là qu'il nous faut, pas des heures par m². L'outil fera la conversion :

```
heures par unité = (effectif × heures par jour) ÷ production journalière
```

Exemple : équipe de 4, 8 h/jour, 40 m²/jour → (4 × 8) ÷ 40 = **0,80 h/m²**.

Dites-nous aussi votre **base horaire journalière** (8 h ? 9 h ?) : ______

---

## A — Béton armé

### A1. Béton armé en infrastructure (semelles, longrines) — unité : m³

| Composant | Type | Unité | Rendement / m³ | PU (DH) |
|---|---|---|---|---|
| Ciment CPJ 45 | Matière | kg | | |
| Sable | Matière | m³ | | |
| Gravier | Matière | m³ | | |
| Eau | Matière | l | | |
| Adjuvant | Matière | l | | |
| Bétonnière / centrale | Matériel | h | | |
| Vibreur | Matériel | h | | |
| Pompe à béton *(si utilisée)* | Matériel | h | | |

**Main d'œuvre** — effectif : ____ · production : ____ m³/jour

### A2. Béton armé en élévation (poteaux, poutres, dalles) — unité : m³

Mêmes composants qu'en A1. Le rendement change-t-il ? Si oui, précisez lesquels :

| Composant | Rendement / m³ | PU (DH) |
|---|---|---|
| | | |

**Main d'œuvre** — effectif : ____ · production : ____ m³/jour

---

## B — Aciers

### B1. Aciers pour béton armé — unité : kg

| Composant | Type | Unité | Rendement / kg | PU (DH) |
|---|---|---|---|---|
| Acier HA (fers à béton) | Matière | kg | | |
| Fil de ligature | Matière | kg | | |
| Chutes / pertes | — | % | | — |

**Main d'œuvre (façonnage + pose)** — effectif : ____ · production : ____ kg/jour

> **Question de structure** : l'acier est-il un article distinct au bordereau, ou compris dans
> le prix du béton ? Vous avez indiqué que le descriptif technique le précise — donc
> probablement les deux cas existent. Confirmez-vous qu'on doit gérer les deux ?

---

## C — Coffrage

### C1. Coffrage ordinaire — unité : m²

| Composant | Type | Unité | Rendement / m² | PU (DH) |
|---|---|---|---|---|
| Bois de coffrage | Matière | m³ ou m² | | |
| Contreplaqué | Matière | m² | | |
| Huile de décoffrage | Matière | l | | |
| Clous, accessoires | Matière | kg | | |
| Étais | Matériel | u·jour | | |

**Nombre de réemplois** du coffrage : ______
*(détermine la part amortie par m² — un coffrage réutilisé 6 fois ne coûte pas 6 fois son prix)*

**Main d'œuvre (pose + décoffrage)** — effectif : ____ · production : ____ m²/jour

### C2. Coffrage soigné / parement — unité : m²

Écart par rapport à C1 : ______________________

---

## D — Maçonnerie

### D1. Maçonnerie en agglos — unité : m²

| Composant | Type | Unité | Rendement / m² | PU (DH) |
|---|---|---|---|---|
| Agglos (préciser dimension : ____) | Matière | u | | |
| Mortier de pose | Matière | m³ | | |
| Ciment *(si mortier dosé sur place)* | Matière | kg | | |
| Sable | Matière | m³ | | |

**Main d'œuvre** — effectif : ____ · production : ____ m²/jour

---

## E — Terrassement

### E1. Déblai en pleine masse — unité : m³

| Composant | Type | Unité | Rendement / m³ | PU (DH) |
|---|---|---|---|---|
| Pelle hydraulique | Matériel | h | | |
| Camion évacuation | Matériel | h ou rotation | | |
| Distance de mise en décharge | — | km | | — |

**Main d'œuvre d'accompagnement** — effectif : ____ · production : ____ m³/jour

### E2. Remblai compacté — unité : m³

| Composant | Type | Unité | Rendement / m³ | PU (DH) |
|---|---|---|---|---|
| Matériau d'apport | Matière | m³ | | |
| Compacteur | Matériel | h | | |
| Arrosage | Matière | m³ | | |

**Foisonnement / tassement** appliqué : ______ %

---

## F — Un ouvrage de votre choix

Le plus représentatif de votre activité, ou celui qui vous pose le plus de difficulté à chiffrer :

**Ouvrage** : ______________________ **Unité** : ______

| Composant | Type | Unité | Rendement | PU (DH) |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

**Main d'œuvre** — effectif : ____ · production : ____ /jour

---

## G — Questions de structure

Vos réponses précédentes en ont ouvert trois.

### G1. L'unité de facturation varie

Vous indiquez que la facturation se fait « des fois en m², en m³, ou même en **ensemble** ».

Le cas « ensemble » (forfait) est particulier : il n'y a pas de rendement par unité, tout
l'ouvrage est un bloc.

- Cela représente quelle part de vos articles, à peu près ? ______
- Dans ce cas, décomposez-vous quand même en interne pour connaître votre déboursé, ou
  chiffrez-vous globalement ? ______________________

### G2. Le descriptif technique définit le contenu

Vous dites que le descriptif précise ce qui entre dans l'article, comment il est exécuté et
facturé. C'est donc lui qui détermine la composition, pas une règle générale.

- Le même libellé d'article peut-il avoir des compositions différentes d'un marché à l'autre ?
  ______
- Si oui : quand on réutilise un ouvrage de la bibliothèque, faut-il **systématiquement** le
  reconfronter au descriptif du marché en cours ? ______

### G3. Les rendements s'affinent avec l'expérience

Vous dites que les rendements journaliers deviennent plus justes avec l'expérience des équipes.

C'est exactement ce que la bibliothèque d'ouvrages doit capitaliser. Deux questions :

- Souhaitez-vous **un rendement de référence** par ouvrage, ou **plusieurs selon le contexte**
  (équipe, type de chantier, saison) ? ______
- Faut-il pouvoir **comparer le rendement prévu au rendement réalisé** en fin de chantier, pour
  ajuster la bibliothèque ? ______________________

---

## H — Confirmation sur les taux

Vous indiquez **10 à 13 % de frais généraux** et **15 à 20 % de marge**, « la marge étant
rajoutée indépendamment pour constituer le prix de vente ».

Nous l'avons interprété ainsi — merci de confirmer sur un exemple simple :

| Étape | Calcul | Résultat |
|---|---|---|
| Déboursé sec | | 1 000,00 |
| + FG 11,5 % | 1 000 × 1,115 | 1 115,00 |
| + Marge 17,5 % | 1 115 × 1,175 | **1 310,13** |

**Est-ce bien votre calcul ?**  ☐ oui ☐ non

Si non, l'autre lecture possible donnerait 1 000 × (1 + 0,115 + 0,175) = **1 290,00**
(les deux taux appliqués au déboursé, sans cumul). Écart : 20 DH sur 1 000, soit **1,6 %** —
sur une étude à 10 MDH, environ **160 000 DH**.

Laquelle est la bonne ?  ☐ 1 310,13 ☐ 1 290,00 ☐ autre : ____________
