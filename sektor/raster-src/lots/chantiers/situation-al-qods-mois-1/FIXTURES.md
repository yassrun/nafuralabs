# Fixtures — Al Qods mois 1

Réutilise le pack parent :

[`sektor/e2e/fixtures/al-qods/`](../../../../e2e/fixtures/al-qods/)

## Attendus mois 1 (gold)

À créer par l’exec / QA sous `sektor/e2e/fixtures/al-qods/situation-mois1/` :

| Fichier | Contenu |
|---|---|
| `expected/attachement-sept.json` | période 2026-09-01 → 2026-09-30 ; lignes `[{noeud: "2.1", qte: 40, unite: "m³"}, {noeud: "2.3", qte: 120, unite: "m²"}]` |
| `expected/situation-1.json` | consomme attachement sept ; `cumulPrecedentHt: 0` ; lignes mêmes nœuds ; RG/avance > 0 si taux chantier |
| `expected/absents.json` | nœuds exclus : `installation`, `3-etancheite` |

## Données graphe

- Quantités prévues nœuds 2.1 / 2.3 : alignées DPU Al Qods (≥ quantités septembre).
- Nœud interne *Installation* : nature `INTERNE`, quantité prévue > 0 pour test budget-only.
- Poste 3 : contrat ST sans avancement septembre.

Ne pas dupliquer les PDF BL / devis ici — voir [`../vie-de-chantier/FIXTURES.md`](../vie-de-chantier/FIXTURES.md).
