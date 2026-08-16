# CH-01-EVOL — nom extraction

**Type :** `EVOL`
**Cible :** app `nafura-platform` (CADRE)
**Qualification :** le vocabulaire disait `Lecture` ; trop générique à côté de Documents (stockage) et de n'importe quelle autre « lecture ».

## Pourquoi

Un contexte vendable à part ne s'appelle pas par un verbe flou. Le besoin reste le même : tirer une structure d'un document.

## Aujourd'hui

Vocabulaire **Lecture**. Carte **lecture**.

## Attendu

Vocabulaire **Extraction**. Carte **document-extraction**. L'`owns` « Lire un document et en tirer une structure » ne change pas.

## Critères d'acceptation (gelés)

- **AC-1** Le vocabulaire n'a plus le terme `Lecture` comme nom de contexte.
- **AC-2** La carte liste `document-extraction`, pas `lecture`.
- **AC-3** L'`owns` du besoin n'est pas réécrit (même frontière).

## Preuves attendues

**Revue humaine.** Pas d'e2e sur une frontière.
