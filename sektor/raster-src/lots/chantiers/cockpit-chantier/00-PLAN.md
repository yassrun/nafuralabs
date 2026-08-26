# Plan — cockpit chantier

## But livrable

Transformer la fiche et la liste chantiers en surfaces de décision : état fiable, écarts hiérarchisés et prochaine action contextualisée, du desktop au terrain mobile.

## Dépendance externe

Le lot démarre après **SEKTOR-195** : le contrat Étude–Devis–Chantier doit avoir prouvé les montants et la provenance que le cockpit affiche. Le cockpit ne compense pas une incohérence amont.

## Ordre

1. **SEKTOR-196** — créer le read model, les règles de préparation, d'alertes et de priorisation. Gate humaine sur le contrat d'API et les seuils.
2. **SEKTOR-197** — construire l'écran Pilotage à partir du read model et supprimer les duplications de fiche.
3. **SEKTOR-198** — rendre la checklist actionnable et le démarrage par OS atomique.
4. **SEKTOR-199** — projeter les mêmes faits dans le portefeuille filtrable.
5. **SEKTOR-200** — fermer RBAC, responsive et accessibilité sur la surface finale.
6. **SEKTOR-201** — verdict Mode B par stade, rôle et largeur.

## Architecture attendue

- Un endpoint de composition appartenant à Chantiers ; DTO explicite et stable, calculs testés côté serveur.
- Les composants UI consomment les états `AVAILABLE / NOT_AVAILABLE / FORBIDDEN`, sans recalcul métier.
- Les routes et formulaires des modules spécialisés restent propriétaires de leurs commandes.
- États de chargement, erreur partielle et concurrence traités comme des états normaux.
- Pas de cache persistant créant une nouvelle vérité ; si cache de lecture, invalidation documentée par événements/faits source.

## UX et accessibilité

- Wireframe obligatoire : `ux/cockpit-wireframe.md`.
- Hiérarchie visuelle constante entre stades ; le contenu, pas la géométrie entière, change avec le statut.
- Couleur jamais seule porteuse de sévérité ; libellé et icône textuelle associés.
- Navigation clavier, focus visible, intitulés de boutons explicites et cibles tactiles de 44 px.

## Preuves de sortie

- Tests domaine/API des règles de checklist, priorité, dates, marge et permissions.
- Tests composants des états vide/interdit/erreur et des variantes de statut.
- Parcours Mode B du contrat sur graphe créé par API, captures desktop et 390 px.
- Contrôle qu'un chantier sans planning reste démarrable et facturable.
- `node raster/t.mjs check` sans erreur.

