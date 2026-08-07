# Articles — cases QA (flux V1)

Prérequis : seed tenant avec familles arbre + UoM. Base UI : `/inventory/catalogue/articles`.  
Légende : `[ ]` à jouer · lié rule ID + ticket PM.

## Socle

Hérite du socle liste/détail (`web/docs/qa/README.md`).

## Cases métier

### QA-ART-01 — Création matière
- [ ] Nouveau → nature `MATIERE`, famille Liants/Ciment, UoM `T`, code `QA-CIM-01`
- [ ] Poste budget affiché `MATERIAUX` (readonly)
- [ ] Stockable = oui (readonly)
- [ ] Enregistrer → visible liste · **ART-R01, R03, R04, R10**

### QA-ART-09 — Création main d’œuvre
- [ ] Nouveau → nature `MAIN_DOEUVRE`, famille MO/Qualifiée, UoM `H`
- [ ] Stockable = non
- [ ] Persist + rechargement fiche OK · **ART-R09**

### QA-ART-04 — Famille obligatoire
- [ ] Création sans famille → blocage validation · **ART-R04**

### QA-ART-08 — Code unique
- [ ] Recréer même code tenant → erreur claire · **ART-R08**

### QA-ART-06 — Lots d’usage
- [ ] Sur matière : cocher Gros œuvre + VRD → save → relecture OK · **ART-R06**

### QA-ART-07 — Nature verrouillée si mouvements
- [ ] Article avec entrée stock → tenter nature `SERVICE` → refus · **ART-R07**

### QA-ART-11 — Plus de types d’articles
- [ ] Nav configuration : pas d’entrée Types · **ART-R11**

### QA-ART-12 — Fallback manuel
- [ ] Depuis fiche : actions Import IA **et** Saisie manuelle visibles · **ART-R12**

### QA-ART-L — Liste
- [ ] Colonnes Nature, Famille, Stock (dérivé)
- [ ] Filtres nature / famille / stockable

## Jeux de données suggérés

| Code | Nature | Famille | Usage |
|------|--------|---------|-------|
| `QA-CIM-01` | MATIERE | Liants / Ciment | Gros œuvre |
| `QA-MO-OQ` | MAIN_DOEUVRE | MO / Qualifiée | — |
| `QA-LOC-PEL` | LOCATION | Engins / Terrassement | — |
