# Gap-test extraction bordereau

Comparaison **extracteur** (`bordereau-grid-prototype` v3) vs **référence LLM** (lecture indépendante des dumps).

## Synthèse

| Fichier | Lots E/L | Arts E/L | Match | Manquants (ext) | En trop (ext) | Qty≠ | Path≠ |
|---|---:|---:|---:|---:|---:|---:|---:|
| `BDP-2-17` | 9/9 | 186/186 | 88 | 0 | 95 | 2 | 8 |
| `bdp` | 2/2 | 107/107 | 91 | 1 | 2 | 1 | 1 |
| `villa-kenitra-xlsx` | 10/10 | 205/205 | 205 | 0 | 0 | 0 | 0 |
| `villa-kenitra-pdf` | 10/10 | 205/205 | 205 | 0 | 0 | 0 | 0 |

## Gaps majeurs par fichier

### `BDP-2-17` — BDP-2-17.pdf

**Lots absents de l'extracteur :**
- 6 - (section 6.1)

**Lots en trop / mal découpés côté extracteur :**
- 6 - REVETEMENTS

**Articles en trop / mal découpés (extrait, 95 total) :**
- `1-1-5` SCELLEMENTS DES ARMATURE EN ACIER
- `1-1-6` SCELLEMENTS CHIMIQUES
- `a` DE 40 x 40 CM
- `b` DE 50 x 50 CM
- `c` DE 60 x 60 CM
- `1-2-4` BOITE DE BRANCHEMENT SIMPLE
- `2.2.2` BRAS ROTATIF EN INOX Y COMPRIS MASSIF
- `3.1.1.` TABLEAU SERVICES GENERAUX TEVO/FR
- `3.1.2.` TABLEAU SERVICES GENERAUX TEVIA
- `3.1.3.` TABLEAU DE PROTECTION MAGASIN TEMAG
- `3.2.1.` BOITE DE COUPURE
- `3.2.2.` BOITE DE DISTRIBUTION

**Mauvais rattachement lot (extrait) :**
- L'UNITÉ — ext=`LOT:6 - REVETEMENTS` vs llm=`LOT:7-MENUISERIE`
- L'ENSEMBLE — ext=`LOT:3- ELECTRICITE` vs llm=`LOT:9 - CHAMBRES FROIDES / EQUIPEMENTS FRIGORIFIQUES`
- REVETEMENT DE SOL EN CARREAUX TECHNIQUE GRES CERAM — ext=`LOT:6 - REVETEMENTS` vs llm=`LOT:6 - (section 6.1)`
- REVETEMENT DE SOL EN CARREAUX GRES CERAME D’IMPORT — ext=`LOT:6 - REVETEMENTS` vs llm=`LOT:6 - (section 6.1)`
- REVETEMENT DE SOL EN CARREAUX GRES CERAME ANTIDERA — ext=`LOT:6 - REVETEMENTS` vs llm=`LOT:6 - (section 6.1)`
- REVETEMENT MURAL EN CARREAUX GRES CERAME D'IMPORTA — ext=`LOT:6 - REVETEMENTS` vs llm=`LOT:6 - (section 6.1)`
- REVETEMENT ESPACE ABLUTION EN GRANITE NOIR ABSOLU  — ext=`LOT:6 - REVETEMENTS` vs llm=`LOT:6 - (section 6.1)`
- REVETEMENT TABLETTE EN GRANIT Y COMPRIS RETOURS ET — ext=`LOT:6 - REVETEMENTS` vs llm=`LOT:6 - (section 6.1)`

### `bdp` — bdp.xlsx

**Articles manquants (extrait, 1 total) :**
- `c` Poteaux

**Articles en trop / mal découpés (extrait, 2 total) :**
- `—` Le mètre cube :
- `g/1` Béton armé en élévation

**Mauvais rattachement lot (extrait) :**
- Poteaux — ext=`LOT:I/ - AMÉNAGEMENT  EXTÉRIEUR` vs llm=`LOT:II/ - BÂTIMENT`

### `villa-kenitra-xlsx` — BPDE Villa Kenitra.xlsx

### `villa-kenitra-pdf` — BPDE Villa Kenitra.pdf

## Lectures clés

1. **BDP-2-17** — 9 lots / 186 articles : lots 6 et 7 ouverts à la 1ʳᵉ section `6.1` / `SOUS LOT : 7-`.
2. **Villa Kenitra** — xlsx et PDF à 10 lots ; articles montant-only inclus ; PDF ne promeut plus les sections via signature vide.
3. **bdp.xlsx** — préambule `a/`/`b/` rattaché à `I/` ; folios `IV/n` et TVA écartés.
4. **Reste** — matching article strict code+libellé (faux écarts BDP) ; 1–2 ambigus sur `bdp.xlsx`.
