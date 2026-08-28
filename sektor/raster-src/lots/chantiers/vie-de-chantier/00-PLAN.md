# Plan — Vie de chantier palier 1

## But livrable

Une STE peut mener Al Qods de l'étude (déjà convertie) à la réception provisoire : DA, BL, avancement, documents, ST, marché, cockpit — **sans planning**, **sans finance**.

## Intention

Les tours QA récents ont validé des montants et des KPI. Ils n'ont pas vécu un mois de chantier. Les objets (DA, réception BL, documents, ST, marché) existent en silo ; le conducteur ne les enchaîne pas depuis le cockpit, et la ST est encore pensée « après le Gantt ».

Ce sous-lot **n'améliore pas Études**. `finition-parcours` est en pause. L'étude n'est que la fabrique du graphe Al Qods.

## Périmètre

Inclus : [`CONTRAT.md`](CONTRAT.md) AC-1 à AC-15, scénario [`SCENARIO.md`](SCENARIO.md).

Exclus : finance, planning, magasin comme chemin principal, attachement ST, réception définitive, HSE, finition études.

## Approche

1. **SEKTOR-220** — geler scénario + attentes STE. Gate humaine : surtout l'amendement ST-sur-nœud (AC-8).
2. **SEKTOR-221** — cockpit = porte des ops du jour (routes qui portent le chantier).
3. **SEKTOR-222** — chaîne nœud → DA → BC → BL direct (y compris BL partiel).
4. **SEKTOR-223** — documents actionnables (peut paralléliser 222 une fois 221 posé ; `blocked_by` 221).
5. **SEKTOR-224** — contrat ST sur un poste, **si** AC-8 est approuvé.
6. **SEKTOR-225** — notification marché depuis le chantier.
7. **SEKTOR-226** — preuve Al Qods, faits pas écrans. Rôles `ingenieur` / `conducteur` / `chef-chantier` / `magasinier` / `daf`.

Risque : retoucher le cockpit pendant SEKTOR-209 `gate: me`. 221 n'ajoute que des **actions/routes**, il ne rouvre pas la matrice OS.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-220 Scénario + contrat | spec | — |
| 2 | SEKTOR-221 Cockpit ops quotidiennes | exec | 220 |
| 3 | SEKTOR-222 DA → BC → BL | exec | 221 |
| 4 | SEKTOR-223 Documents | exec | 221 |
| 5 | SEKTOR-224 ST sur poste | exec | 220 |
| 6 | SEKTOR-225 Marché notification | exec | 220 |
| 7 | SEKTOR-226 Preuve Al Qods | qa | 222, 223, 224, 225 |

## Preuves attendues

Les 10 id du contrat, graphe créé par API, captures desktop + 390 sur avancement, DA, BL, documents. Un vert « listing 200 » sans BL partiel ni rôle chef **ne compte pas**.

## Décision tranchée

**ST sans activité (AC-8) — A**, 27/08. Contrat sur le nœud. SEKTOR-224 s'exécute.
