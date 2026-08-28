# Fixtures Al Qods

Documents **réels** du scénario STE Al Binaa / groupe scolaire Al Qods.
Régénérer : `node sektor/e2e/fixtures/al-qods/generate.mjs`

SSOT Raster : [`SCENARIO.md`](../../../raster-src/lots/chantiers/vie-de-chantier/SCENARIO.md) · cas : [`CAS.md`](CAS.md)

Les PDF sont du texte Helvetica (couche extractible). Extraire / import magique les lisent. Les JSON `expected/` sont le gold de **confirmation** (ce qu’on POST après extraction, pas un dump IA).

`articleId` / `chantierId` / `noeudId` / `bonCommandeLigneId` se **résolvent au runtime**. Ici : codes, quantités, PU.

Ne pas réutiliser `DE-0103`. Le graphe se fabrique dans la preuve.
