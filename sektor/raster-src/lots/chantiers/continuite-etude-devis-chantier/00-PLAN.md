# Plan — continuité Étude–Devis–Chantier

## But livrable

Faire de la conversion une frontière fiable : un devis accepté et figé, un chantier traçable, et un seul dictionnaire financier sur tous les écrans.

## Ordre

1. **SEKTOR-191** — unifier la commande de gain et le verrouillage du devis. Première gate humaine : elle engage le cycle commercial.
2. **SEKTOR-192** — transmettre au chantier le snapshot et la provenance, sans couplage inverse des BC.
3. **SEKTOR-193** — corriger les read models et formules qui exposent aujourd'hui des chiffres contradictoires.
4. **SEKTOR-194** — aligner les interactions et libellés des trois modules.
5. **SEKTOR-195** — produire le verdict Mode B sur un graphe créé par la preuve.

## Frontières d'implémentation

- Études orchestre le gain et la conversion ; Devis protège le document accepté ; Chantiers possède l'instantané d'exécution.
- Aucun import du domaine Études dans le domaine Chantiers. Le port de conversion transporte un DTO/versionné explicite.
- Les marges et totaux sont calculés depuis vente et nœuds ; pas de nouveau champ « total pratique » divergent.
- Les migrations sont des changelogs propres et un re-seed lab, sans stratégie de reprise historique.
- Le contrat voisin `arbre-et-conversion` reste autoritaire sur la copie et l'idempotence ; `budget-et-marge` reste autoritaire sur le déboursé par nœud.

## Preuve de sortie

- Tests unitaires/domaines des transitions, invariants monétaires, concurrence et permissions.
- Tests d'intégration des frontières Études → Devis → Chantiers et des read models.
- Parcours navigateur Mode B des scénarios nommés dans `CONTRAT.md` avec captures et valeurs exactes.
- `node raster/t.mjs check` sans erreur.

## Risques à surveiller

- Réutiliser `montantHt` pour vente, attribution et coût sous des sens différents.
- Geler uniquement l'écran du devis sans verrou backend.
- Recalculer le chantier en interrogeant l'étude après conversion.
- Traiter une absence comme zéro, notamment pourcentage de marge et dates.
- Corriger seulement la fiche en laissant la liste ou le budget sur un ancien agrégat.

