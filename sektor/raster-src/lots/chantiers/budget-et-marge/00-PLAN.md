# Budget et marge

> Le budget vit sur l'arbre, décomposé du DPU. La marge devient lisible par lot.
> **Raster autonome.** Contrat `CONTRAT.md` (SEKTOR-161) · journal [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) § budget sur l'arbre.

## Verdict

Sans budget par nœud, la marge n'existe qu'au chantier — donc trop tard. Le DPU décompose déjà tout à la source : c'est une copie, pas un calcul à inventer.

## Constat

- Le DPU décompose chaque poste en `MATIERE` / `MAIN_DOEUVRE` / `MATERIEL` / `SOUS_TRAITANCE` (`ComposantDpu`).
- `BudgetChantier` / `BudgetLigne` tiennent le budget **par rubrique, au chantier** : `previsionnel`, `revise`, `engage`, `realise`, `nonFiable`, `sourceOrigine`.
- `PosteBudgetaire` existe sous le lot mais **ne porte pas** de déboursé décomposé.
- Le lien budget ↔ arbre n'existe pas.

## Approche technique

Copier le déboursé du DPU sur chaque nœud vendu à la conversion — instantané daté, l'étude ne rétro-alimente plus. Nœud interne : budget saisi. L'agrégat par rubrique au chantier cesse d'être stocké, il se dérive. Imputation palier 1 sur le nœud, valeur acquise = avancement × déboursé prévu.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-161 CONTRAT — budget par nœud (`gate: me`) | SEKTOR-147 | — |
| 2 | SEKTOR-162 Copier le déboursé du DPU à la conversion | 161 | — |
| 3 | SEKTOR-159 Marge et valeur acquise par nœud | 162 | non |
| 4 | SEKTOR-160 Preuves | 159 | non |

*(Ids non séquentiels : 159 et 160 ont été alloués avant 161 / 162, deux créations ayant échoué sur un verrou transitoire du fichier `NEXT`. Ids immuables — on ne renumérote pas.)*

## Couverture

Gel § **Le budget vit sur l'arbre** + § **Le réel s'impute à l'activité**, partie palier 1.

## Décisions ouvertes

Une, ouverte par le contrat : où tombe un coût réel qui arrive **sans nœud** ? Le gel interdit le coût sans imputation et prévoit un repli sur un nœud interne, sans dire qui le crée ni quand. Options et recommandation : [`tasks/SEKTOR-161-…`](tasks/SEKTOR-161-contrat-budget-par-n-ud-decompose-du-dpu.md) § Question. **SEKTOR-159 attend cette réponse** (AC-11) — SEKTOR-162 non.
