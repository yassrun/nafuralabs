# CH-00-INIT — impression

**Type :** `EVOL` (forme `INIT` — baseline du BC `impression`)
**Cible :** BC `impression`
**Qualification :** le CADRE owns « produire une page / un PDF ». Pas de contrat. Le rendu vit dans le jar `doc-manager`.

## Pourquoi

Sans SPEC, le prochain Change légitime le jar entier (modèles `facture_client`, Gotenberg, chrome). Le CADRE owns l'engin, pas le métier d'une facture.

## Aujourd'hui

`TemplateRenderService` + REST `/api/v1/platform/templates` : un modèle HTML par tenant, un `type` texte, des données fournies par le produit → PDF (Gotenberg). Pas de Pact.

## Attendu

Une `SPEC.md` de baseline (modèle + données → page/PDF, isolation tenant, `type` opaque) + canvas + e2e **sans changer le comportement**.

## Critères d'acceptation (gelés)

- **AC-1** Tenant A, un modèle et des données : le rendu produit un PDF. (`R-1`)
- **AC-2** Tenant B ne liste pas / ne rend pas le modèle de A. (`R-2`, `POL-TENANT-ISOLATION`)
- **AC-3** Aucune classe de ce contexte n'expose un type métier produit (`FACTURE`, `CHANTIER`, `DpgfNoeud`). (`INV-1`)

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `impression-rendre-pdf` | tenant A, un modèle, des données | AC-1 |
| `impression-deux-tenants` | modèle chez A ; B ensuite | AC-2 |
| `impression-frontiere-produit` | compile : zéro type métier produit dans impression | AC-3 |

**La règle de discrimination ne s'applique pas** (baseline). Substitut : le test a été vu rouge avant d'être vert.

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

## Hors périmètre

Sortir du jar `doc-manager` · Gotenberg ops · modèles métier Sektor · `PrintDocument` (forme facture dans le jar — pas ce contrat) · écran d'édition

Canvas : [`../ux/page-rendue-wireframe.canvas.tsx`](../ux/page-rendue-wireframe.canvas.tsx)
