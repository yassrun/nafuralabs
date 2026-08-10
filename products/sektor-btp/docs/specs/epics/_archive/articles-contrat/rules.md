# Articles — règles métier (ART-R*)

> Invariants testables. Les AC des tasks PM **citent** ces IDs.  
> Enforce = backend sauf mention UI.

| ID | Règle | Enforce | Test |
|----|-------|---------|------|
| ART-R01 | Un article a **exactement une** nature ∈ enum figé (9 valeurs). Valeur inconnue → 400, pas de repli silencieux. | back | Unit create/update |
| ART-R02 | La nature **n’est pas** éditable par le tenant (pas de CRUD natures). | API | GET only natures |
| ART-R03 | Flags `stockable` / `valorise` / UoM défaut / poste budget défaut / type DPU sont **dérivés** de la nature. | back | Mapping table 9 natures |
| ART-R04 | Un article a **exactement une** famille d’appro (`item_category_id` requis). | back + UI | Create sans famille → refus |
| ART-R05 | Famille = classement d’appro uniquement — **aucun** comportement stock/DPU/budget. | back | Famille change ≠ flags |
| ART-R06 | Lots d’usage : 0..N, enum figé ; **indépendants** de la famille. | back | Multi-lots OK |
| ART-R07 | Changer la nature d’un article qui a déjà un mouvement stock → **refus**. | back | QA-ART-07 |
| ART-R08 | Code article **unique** par tenant. | back | Duplicate → 409/400 |
| ART-R09 | Nature `MAIN_DOEUVRE` saisissable UI et persistée bout-en-bout. | full | QA-ART-09 |
| ART-R10 | Poste budget affiché = dérivé nature ; dérogation seulement via action explicite. | UI + back | QA-ART-10 |
| ART-R11 | Pas d’écran / API `item_types` dans le modèle cible. | full | Nav + 404/gone |
| ART-R12 | Import IA (si présent) propose nature/famille ; **confirmation humaine** avant save — fallback manuel toujours visible. | UI | Wireframe + QA-ART-12 |

## Enum natures (réf.)

`MATIERE` · `CONSOMMABLE` · `CARBURANT` · `OUTILLAGE` · `MATERIEL` · `LOCATION` · `MAIN_DOEUVRE` · `SOUS_TRAITANCE` · `SERVICE`

Détail flags : miner `classification-article/00-PLAN.md` §3.1 — figer en S0.
