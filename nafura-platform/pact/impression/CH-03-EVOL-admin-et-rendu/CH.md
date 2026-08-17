# CH-03-EVOL — admin modèles et rendu PDF

**Type :** `EVOL`
**Cible :** BC `impression`
**Qualification :** `EVOL` — baseline et sac opaque posés (CH-00…02) ; l'écran admin et le rendu PDF ne sont pas encore le chemin unique.

## Pourquoi

Imprimer avec un modèle est multi-produit. L'engin (remplir, chrome tenant, PDF) appartient à cette app. Le produit fournit le HTML métier, il n'imprime pas.

## Aujourd'hui

Deux surfaces existent (éditeur HTML+Thymeleaf, dialog PDF) mais un produit peut encore contourner l'engin. Les preuves devis et bordereau ne sont pas les critères de ce BC.

## Attendu

Un administrateur de tenant modifie les modèles dans cette app. Une personne visualise et sort un PDF via cette app. Le produit accroche ses types (`devis`, `dossier_etude_bordereau`) et fournit le sac — il ne rend pas la page.

## Critères d'acceptation (gelés)

- **AC-1** Un `admin-tenant` du tenant A remplace le HTML d'un modèle déjà présent chez A. Le HTML enregistré est `<p>ch03-admin</p>`. Un `utilisateur` du même tenant ne le peut pas. (`R-4`, `P-IMPRESSION-MODELE-ECRIRE`)
- **AC-2** Une demande de page à cette app produit un PDF : modèle du tenant + sac opaque + chrome du tenant. (`R-1`)
- **AC-3** Un devis Sektor demandé à cette app rend un PDF. Le jar `impression` ne connaît pas le devis. (`INV-1`, `R-1`)
- **AC-4** Un bordereau de dossier d'étude Sektor demandé à cette app rend un PDF. Le jar `impression` ne connaît pas le bordereau. (`INV-1`, `R-1`)
- **AC-5** La suite e2e `impression-*` reste verte.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `impression-admin-modele` | tenant A ; un modèle déjà présent ; une personne `admin-tenant` de A ; une personne `utilisateur` de A | AC-1 |
| `impression-rendre-pdf` | tenant A ; un modèle ; un sac opaque (aucun champ lu par cette app) | AC-2 |
| `sektor-impression-devis` | tenant `qa-local` ; personne `qa@nafuralabs.local` ; un devis déjà présent avec au moins une ligne ; un modèle du tenant dont le `type` texte est le mot produit `devis` | AC-3 |
| `sektor-impression-bordereau` | tenant `qa-local` ; personne `qa@nafuralabs.local` ; un dossier d'étude déjà présent dont le bordereau a au moins un poste ; un modèle du tenant dont le `type` texte est le mot produit `dossier_etude_bordereau` | AC-4 |
| suite `impression-*` (`impression-rendre-pdf`, `impression-deux-tenants`, `impression-frontiere-produit`, `impression-plier-arbre`, `impression-type-opaque`, `impression-admin-modele`) | inchangée + le scénario admin | AC-5 |

`impression-admin-modele` vit sous `nafura-platform/e2e/`. Il observe que l'admin persiste `<p>ch03-admin</p>` et que l'`utilisateur` ne le peut pas. Discrimination : rouge tant que l'écriture n'existe pas, ou qu'un `utilisateur` y arrive.

`impression-rendre-pdf` vit sous `nafura-platform/e2e/` (déjà là). Il observe un PDF et le chrome du tenant A. Discrimination : rouge si la demande ne passe plus par cette app ou si le chrome manque.

`sektor-impression-devis` et `sektor-impression-bordereau` vivent sous `sektor/e2e/` : c'est le produit qui accroche. Ils observent un PDF reçu de cette app, et l'absence de type nommé `devis`, `bordereau` ou `dossier_etude_bordereau` dans le jar `impression`. Discrimination : rouge tant que Sektor rend la page lui-même, ou que le jar porte un de ces types.

`devis` et `dossier_etude_bordereau` sont des mots du produit dans ces preuves. Ils n'entrent pas au catalogue de ce BC (`type` reste opaque).

Canvas : [`../ux/admin-modeles-wireframe.canvas.tsx`](../ux/admin-modeles-wireframe.canvas.tsx) (écran admin) · [`../ux/page-rendue-wireframe.canvas.tsx`](../ux/page-rendue-wireframe.canvas.tsx) (rendu — autre flux)

## Politiques

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`

Actions : `P-IMPRESSION-RENDRE` · `P-IMPRESSION-MODELE-LIRE` · `P-IMPRESSION-MODELE-ECRIRE` (nouvelle ; allow `admin-tenant`, deny `utilisateur`). Indexée dans la matrice socle par ce Change — pas un EVOL socle séparé.

## Hors périmètre

Éditeur visuel / CodeMirror · `window.print` interne (planning, étiquettes, HSE) · qualité fiscale des HTML Sektor · facture (CH-02) · créer ou retirer un modèle
