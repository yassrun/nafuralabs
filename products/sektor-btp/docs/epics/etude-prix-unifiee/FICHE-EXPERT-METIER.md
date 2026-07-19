# Fiche expert métier — étude de prix

**Comment l'utiliser** : les parties sont classées par utilité. **La partie 1 prend 5 minutes et
débloque l'essentiel.** Si tu n'as que ça, c'est déjà énorme. Le reste peut venir plus tard.

Réponds directement dans le fichier, ou par message en citant les numéros.

---

# PARTIE 1 — Cinq minutes, le plus utile

## 1.1 Le calcul est-il le bon ?

C'est la question la plus importante du document : selon la réponse, l'écart est d'environ
**160 000 DH sur une étude à 10 MDH**.

Tu as dit : FG 10-13 %, marge 15-20 %, « la marge est rajoutée indépendamment pour constituer le
prix de vente ». On l'a implémenté comme ceci :

| Étape | Calcul | Résultat |
|---|---|---|
| Déboursé sec | | 1 000,00 |
| + FG 11,5 % | 1 000 × 1,115 | 1 115,00 |
| + Marge 17,5 % | 1 115 × **1,175** | **1 310,13** |

☐ **Oui, c'est mon calcul**

☐ Non — c'est plutôt 1 000 × (1 + 0,115 + 0,175) = **1 290,00**
   *(les deux taux sur le déboursé, sans cumul)*

☐ Autre : _______________________________

## 1.2 Ta base horaire journalière

Combien d'heures compte une journée d'équipe dans tes calculs ?

**______ heures** (8 ? 9 ? 10 ?)

## 1.3 Un seul rendement de main d'œuvre, pour commencer

Le béton armé en infrastructure. C'est celui qui nous sert de référence à tout le module.

> **Une équipe de ______ personnes coule ______ m³ par jour.**

*(notre hypothèse actuelle : 6 personnes pour 12 m³/jour — corrige si c'est loin de la réalité)*

## 1.4 Y a-t-il un plancher de marge ?

En dessous de quel pourcentage une ligne doit-elle t'alerter, parce qu'on brade ?

**______ %**   ou   ☐ pas de plancher, c'est au cas par cas

## 1.5 Comment décides-tu de la marge d'un article ?

Tu as dit qu'elle varie par article. Qu'est-ce qui te fait monter ou descendre ?
**Classe de 1 (le plus important) à 5**, ou barre ce qui ne s'applique pas.

| | Motif |
|---|---|
| ___ | Le client va comparer ce prix avec la concurrence |
| ___ | La quantité au bordereau me paraît incertaine |
| ___ | C'est une grosse ligne, je peux serrer |
| ___ | Je pense que la quantité va augmenter à l'exécution |
| ___ | Risque technique sur cet ouvrage |
| ___ | Autre : _______________________________ |

---

# PARTIE 2 — Quinze minutes, les prix

Prix unitaires que tu paies aujourd'hui. Laisse vide si tu n'es pas sûr.

| Composant | Unité | PU (DH) |
|---|---|---|
| Ciment CPJ 45 | kg | |
| Sable 0/4 | m³ | |
| Gravier 4/20 | m³ | |
| Acier HA (fers à béton) | kg | |
| Agglos *(dimension : ______)* | u | |
| Bois de coffrage | m² ou m³ | |
| Contreplaqué | m² | |
| Heure de maçon | h | |
| Heure de coffreur | h | |
| Heure de ferrailleur | h | |
| Heure de manœuvre | h | |
| Location pelle hydraulique | h | |
| Location camion | h | |
| Bétonnière | h | |

---

# PARTIE 3 — Trente minutes, les rendements par ouvrage

## Rappel : deux façons de donner un rendement

**Matériaux et matériel** → quantité **par unité d'ouvrage**
> Pour 1 m³ de béton, il faut ___ kg de ciment.

**Main d'œuvre** → **rendement journalier d'équipe**
> Une équipe de ___ personnes réalise ___ m² par jour.

C'est cette forme-là qu'il nous faut, pas des heures par m². L'outil convertit tout seul :
`(effectif × heures/jour) ÷ production journalière`.

---

## A — Béton armé en infrastructure (semelles, longrines) · m³

| Composant | Unité | Rendement / m³ |
|---|---|---|
| Ciment CPJ 45 | kg | *400* |
| Sable 0/4 | m³ | *0,42* |
| Gravier 4/20 | m³ | *0,82* |
| Eau | l | *180* |
| Adjuvant | l | |
| Bétonnière + vibreur | h | *0,35* |
| Pompe à béton *(si utilisée)* | h | |

*Les valeurs en italique sont le dosage normalisé du B35 — corrige seulement si ta formulation
diffère.*

**Main d'œuvre** — effectif : ____ · production : ____ m³/jour  *(cf. 1.3)*

## B — Béton armé en élévation (poteaux, poutres, dalles) · m³

Même dosage qu'en A ? ☐ oui ☐ non, différences : _______________

**Main d'œuvre** — effectif : ____ · production : ____ m³/jour

## C — Aciers pour béton armé · kg

| Composant | Unité | Rendement / kg |
|---|---|---|
| Acier HA | kg | |
| Fil de ligature | kg | |
| Chutes / pertes | % | |

**Main d'œuvre (façonnage + pose)** — effectif : ____ · production : ____ kg/jour

## D — Coffrage ordinaire · m²

| Composant | Unité | Rendement / m² |
|---|---|---|
| Bois de coffrage | m² ou m³ | |
| Contreplaqué | m² | |
| Huile de décoffrage | l | |
| Clous, accessoires | kg | |
| Étais | u·jour | |

**Nombre de réemplois du coffrage : ______**
*(important : un coffrage réutilisé 6 fois ne coûte pas 6 fois son prix par m²)*

**Main d'œuvre (pose + décoffrage)** — effectif : ____ · production : ____ m²/jour

**Coffrage soigné / parement** — écart par rapport à l'ordinaire : _______________

## E — Maçonnerie en agglos · m²

| Composant | Unité | Rendement / m² |
|---|---|---|
| Agglos | u | |
| Mortier de pose | m³ | |
| Ciment *(si dosé sur place)* | kg | |
| Sable | m³ | |

**Main d'œuvre** — effectif : ____ · production : ____ m²/jour

## F — Terrassement · m³

**Déblai en pleine masse**

| Composant | Unité | Rendement / m³ |
|---|---|---|
| Pelle hydraulique | h | |
| Camion évacuation | h ou rotation | |
| Distance moyenne de décharge | km | |

**Remblai compacté**

| Composant | Unité | Rendement / m³ |
|---|---|---|
| Matériau d'apport | m³ | |
| Compacteur | h | |
| Arrosage | m³ | |

**Foisonnement / tassement appliqué : ______ %**

## G — Un ouvrage de ton choix

Le plus représentatif de votre activité, ou celui qui te pose le plus de difficulté.

**Ouvrage** : ______________________ **Unité** : ______

| Composant | Unité | Rendement |
|---|---|---|
| | | |
| | | |
| | | |
| | | |

**Main d'œuvre** — effectif : ____ · production : ____ /jour

---

# PARTIE 4 — Questions de structure

Courtes, mais elles décident de la façon dont l'outil est construit.

## 4.1 L'acier et le coffrage

Sont-ils des articles distincts au bordereau, ou compris dans le prix du béton ?

☐ Toujours distincts ☐ Toujours compris ☐ **Ça dépend du marché** — c'est le descriptif qui tranche

## 4.2 La facturation « en ensemble » (forfait)

Tu as dit que certains articles se facturent au forfait plutôt qu'au m² ou m³.

- Quelle part de tes articles, à peu près ? **______ %**
- Dans ce cas, décomposes-tu quand même en interne pour connaître ton déboursé ?
  ☐ oui ☐ non ☐ parfois

## 4.3 Le descriptif technique

Un même libellé d'article peut-il avoir des compositions différentes d'un marché à l'autre ?

☐ oui ☐ non

Si oui : quand on réutilise un ouvrage type déjà enregistré, faut-il **systématiquement** le
reconfronter au descriptif du marché en cours ?

☐ oui, toujours ☐ non, on fait confiance ☐ seulement alerter s'il y a un écart

## 4.4 Les rendements s'affinent avec l'expérience

Tu l'as dit toi-même. Deux façons de le gérer :

- Un **seul rendement de référence** par ouvrage, qu'on ajuste au fil du temps
  ☐
- **Plusieurs** selon le contexte (équipe, type de chantier, saison)
  ☐

Faut-il pouvoir **comparer le rendement prévu au rendement réalisé** en fin de chantier ?

☐ oui, c'est important ☐ pas prioritaire

## 4.5 Le budget de chantier

Quand une affaire est gagnée et qu'on ouvre le chantier, son budget doit contenir :

☐ Le **déboursé sec seul** (matériaux, MO, matériel, sous-traitance)
☐ Le déboursé **+ les frais généraux**

*(notre hypothèse : déboursé sec seul — le conducteur ne décide pas des frais de siège)*

---

# Ce dont on n'a PAS besoin

Pour t'éviter du travail inutile :

- **Les dosages normalisés** — on les a (béton, mortier). Corrige seulement si tu fais autrement.
- **Les taux de FG et de marge** — tu as donné les fourchettes, ça suffit.
- **Les formules de calcul** — c'est notre travail.

Ce que toi seul peux donner : **les rendements de tes équipes** et **tes prix**. Le reste, on se
débrouille.
