# CH-00-INIT — documents

**Type :** `EVOL` (forme `INIT` — baseline du BC `documents`)
**Cible :** BC `documents`
**Qualification :** aucun contrat Pact ; le jar `doc-manager` conserve déjà des fichiers (pièces + originaux). On photographie ce qu'on **garde**.

## Pourquoi

Sans SPEC, le prochain Change légitime le jar entier (templates, PDF, deux modèles). Le CADRE owns « conserver un fichier » : c'est ce contexte.

## Aujourd'hui

Code dans `doc-manager` (pièces REST + originaux internes). Pas de Pact. Templates / PDF dans le même jar — hors ce contrat.

## Attendu

Une `SPEC.md` de baseline (fichier, pièce opaque, original, isolation list/delete, download-par-clé tel quel) + canvas widget + e2e qui assertent les règles **sans changer le comportement**.

## Critères d'acceptation (gelés)

- **AC-1** Tenant A joint un fichier à une entité opaque : la liste le montre ; le téléchargement rend les mêmes octets. (`INV-2`)
- **AC-2** Même `entité` + `id`, tenant B : liste vide. Retirer l'id de A depuis B échoue. (`R-1`, `POL-TENANT-ISOLATION`)
- **AC-3** Aucune classe de ce contexte n'expose un type métier produit (`FACTURE`, `CHANTIER`, `DpgfNoeud`, …). (`INV-1`)
- **AC-4** Après retrait d'une pièce, la liste est vide et le téléchargement de cette pièce échoue. (`R-4`)
- **AC-5** Un original déposé a une clé de rangement préfixée par le tenant. (`INV-2`)

## Preuves attendues

Scénarios e2e (projet `nafura-platform/e2e/`, pas par BC) :

| Scénario | État initial | AC |
|----------|--------------|----|
| `documents-joindre-et-rendre` | tenant A, un petit fichier, entité opaque | AC-1 |
| `documents-deux-tenants` | même entité+id, A puis B | AC-2 |
| `documents-frontiere-produit` | compile : zéro type métier produit dans documents | AC-3 |
| `documents-retirer-piece` | une pièce présente chez A | AC-4 |
| `documents-original-cle-tenant` | un original déposé | AC-5 |

Les tests déjà verts du module `doc-manager` **peuvent** servir s'ils assertent bien les AC — l'exec le déclare. Un test écrit directement vert sans avoir été vu rouge est refusé.

**La règle de discrimination ne s'applique pas** (baseline). Substitut : le test a été vu rouge avant d'être vert.

## Hors périmètre

Templates · PDF · fragments · settings d'impression · extraction · commentaires · unifier pièce et original · **R-2** → `CH-02-EVOL-download-tenant` · **octets uniques** → `CH-01-EVOL-octets-uniques` · un seau / un modèle — plus tard.

Canvas : [`../ux/piece-jointe-wireframe.canvas.tsx`](../ux/piece-jointe-wireframe.canvas.tsx)
