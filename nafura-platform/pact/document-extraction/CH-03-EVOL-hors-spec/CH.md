# CH-03-EVOL — builder et workflow : dedans ou dehors

**Type :** `EVOL`
**Cible :** BC `document-extraction`
**Qualification :** le code porte un builder et un workflow dont la SPEC ne parle pas.

## Pourquoi

Du code qu'aucun contrat ne couvre n'est ni maintenu ni supprimable : personne ne sait s'il est promis à quelqu'un. Soit la SPEC les prend, soit le code les rend.

## Aujourd'hui

`builder` et `workflow` vivent dans le BC sans ligne de SPEC.

## Attendu

Les deux hors du BC. **Builder** → le produit. **Workflow** (brouillon / validé / refusé) → contexte Approbation. Le code suit.

## Critères d'acceptation (gelés)

- **AC-1** La SPEC dit `not_owns` pour le builder (composer / cataloguer / versionner un type de document) et pour le workflow de décision (brouillon / validé / refusé).
- **AC-2** Le builder nomme **le produit**. Le workflow nomme le **contexte Approbation** (non spécifié).
- **AC-3** Rien d'exposé par ce BC qui compose un type ou qui fait décider un résultat (accepter / refuser).
- **AC-4** La suite e2e `lecture-*` reste verte.

## Preuves attendues

Revue de SPEC pour AC-1, AC-2.

Scénarios e2e (projet `nafura-platform/e2e/`, pas par BC) :

| Scénario | État initial | AC |
|----------|--------------|----|
| `extraction-builder-hors-contrat` | un tenant, une extraction joignable | AC-3 |
| `extraction-workflow-hors-contrat` | une extraction **réussie** (structure + doutes publiés) | AC-3 |
| `lecture-heuristique-sans-modele` | xlsx grille + schéma titres connus | AC-4 |
| `lecture-cache-deux-tenants` | même empreinte, tenant A puis B | AC-4 |
| `lecture-frontiere-produit` | compile : zéro type métier produit dans l'extraction | AC-4 |
| `lecture-carte-deux-natures` | un brouillon avec les deux natures | AC-4 |
| `lecture-sans-grille-vers-modele` | image / scan sans grille détectée | AC-4 |

Les deux scénarios `extraction-*-hors-contrat` **échouent sur la version d'avant** (builder et workflow encore exposés) et passent après l'alignement.

**POL-*** applicables (référence, pas recopie) : `POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

Canvas : inchangé — [`../ux/carte-des-doutes-wireframe.canvas.tsx`](../ux/carte-des-doutes-wireframe.canvas.tsx). Aucun écran nouveau.

## Hors périmètre

Refondre le moteur de lecture · les grilles · le cache
