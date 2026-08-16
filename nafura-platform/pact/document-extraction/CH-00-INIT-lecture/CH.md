# CH-00-INIT — lecture

**Type :** `EVOL` (forme `INIT` — baseline du BC `lecture`)
**Cible :** BC `lecture`
**Qualification :** aucun contrat Pact ; le lot Raster `document-reader` a déjà livré la grille, le plan, les deux natures de doutes. On photographie ce qu'on **garde**.

## Pourquoi

Sans SPEC, le prochain changement légitime le jar ou un roman. Le CADRE owns « lire un document et en tirer une structure » : c'est ce contexte.

## Aujourd'hui

Code dans `doc-extractor` / `smart-import`. Contrat lot `document-reader` (`LOT.md`) — pas un Pact.

## Attendu

Une `SPEC.md` de baseline (grille, plan, cascade, cache par tenant, deux doutes) + canvas carte des doutes + e2e qui assertent les règles **sans changer le comportement**.

## Critères d'acceptation (gelés)

- **AC-1** Une grille dont les en-têtes matchent le schéma par nom ou titre produit un plan au palier heuristique, sans appel modèle. (`R-1`, `R-2`)
- **AC-2** Le même fichier, deux tenants : le plan cache de l'un n'est pas servi à l'autre. (`INV-4`, `POL-TENANT-ISOLATION`)
- **AC-3** Aucune classe de cette app n'expose un objet métier produit ; le produit ne reçoit pas l'empreinte. (`INV-1`)
- **AC-4** L'écran de relecture montre deux compteurs (extraction / manque-source) et refuse un pourcentage fusionné. (`INV-3`)
- **AC-5** Pas de grille → pas de palier heuristique. Le chemin modèle / vision reste disponible. (`R-3`)
- **AC-6** L'IA, quand elle compile, ne reçoit pas les cellules de données — en-têtes et schéma seulement. (`INV-2`)

## Preuves attendues

Scénarios e2e (projet `nafura-platform/e2e/`, pas par BC) :

| Scénario | État initial | AC |
|----------|--------------|----|
| `lecture-heuristique-sans-modele` | xlsx grille + schéma titres connus | AC-1 |
| `lecture-cache-deux-tenants` | même empreinte, tenant A puis B | AC-2 |
| `lecture-frontiere-produit` | compile : zéro type métier produit dans lecture ; zéro empreinte côté produit | AC-3 |
| `lecture-carte-deux-natures` | un brouillon avec les deux natures | AC-4 |
| `lecture-sans-grille-vers-modele` | image / scan sans grille détectée | AC-5, AC-6 |

Les tests déjà verts du lot `document-reader` (cascade, étalon grille) **peuvent** servir d'implémentation de ces scénarios s'ils assertent bien les AC — l'exec le déclare dans le rapport. Un test écrit directement vert sans avoir été vu rouge est refusé.

**La règle de discrimination ne s'applique pas** (baseline, pas de comportement changé). Substitut : le test a été vu rouge avant d'être vert.

## Hors périmètre

Ancres · matrice / dépivot · rapprochement · stockage fichier · INIT des autres contextes.

Canvas : [`../ux/carte-des-doutes-wireframe.canvas.tsx`](../ux/carte-des-doutes-wireframe.canvas.tsx)
