# CH-02-EVOL — imprimer dans le CADRE ?

**Type :** `EVOL`
**Cible :** app `nafura-platform` (CADRE)
**Qualification :** le CADRE n'owns pas « produire une page / un PDF ». Le code (modèles, Gotenberg) est dans le jar documents, hors contrat.

## Pourquoi

Sans cette ligne au CADRE, on ne pacte pas un contexte print. Avec, on peut. C'est une frontière — pas un détail documents.

## Aujourd'hui

CADRE owns : conserver un fichier, extraire. Pas imprimer. Templates métier (`facture_client`) dans `doc-manager`.

## Décision

**A** (16/08, toi).

## Attendu (tranché)

Soit :

**A.** Le CADRE **owns** « Produire une page ou un PDF à partir d'un modèle et de données ». Contexte à pacter ensuite : engin + chrome (page, logo). Templates métier = le produit. Un devis dans deux produits = un métier partagé, pas un Drive de modèles.

Soit :

**B.** Imprimer reste **au produit**. Le jar se videra plus tard (dette). Pas de BC platform.

## Critères d'acceptation (gelés)

- **AC-1** Le CADRE dit A ou B, pas les deux.
- **AC-2** Si A : `owns` a une ligne « produire une page / un PDF » ; les templates métier restent `not_owns` (le produit).
- **AC-3** Si B : aucune ligne print dans `owns` ; documents `not_owns` impression inchangé.

## Preuves attendues

**Revue humaine.** Pas d'e2e. Gate `me`.

## Hors périmètre

Coder Gotenberg · bouger les templates · pacter le BC print (après A seulement)
