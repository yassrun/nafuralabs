# Plan — Al Qods mois 1 : attachement + situation MOA

## But livrable

Sur le graphe Al Qods déjà converti (`vie-de-chantier` done-me), la STE clôt **septembre** : avancement terrain → attachement signé MOE → situation n°1 (RG / avance) → cockpit qui pointe le vrai trou — **sans marché notifié**, **sans planning**, **sans finance**.

## Intention

`vie-de-chantier` a prouvé DA, BL, ST, documents et les discriminants acte 3. L’acte **2.d** du scénario (attachement + situation) est **nommé mais non prouvé** bout en bout. Les contrats voisins [`avancement-et-attachement`](../avancement-et-attachement/CONTRAT.md) et [`situation-et-retenues`](../situation-et-retenues/CONTRAT.md) décrivent le modèle cible complet ; ce sous-lot en livre une **tranche scénarisée** sur Al Qods, pas une relecture de tout le BC.

Prérequis assumés : chantier `EN_COURS`, vente active = devis (SEKTOR-186 / 228), nœuds 2.1 et 2.3 vendus, nœud interne *Installation* présent.

## Périmètre

Inclus : [`CONTRAT.md`](CONTRAT.md) AC-M1 à AC-M10, [`SCENARIO.md`](SCENARIO.md), fixtures mois 1.

Exclus : palier 2 (planning, activités, engins datés), pénalités / RAS (AC-8..12 du contrat voisin — dette `situation-et-retenues`), attachement ST fournisseur, facture Ventes / encaissement, acte 3 octobre (BL partiel acier — déjà prouvé en 226).

## Approche

1. **SEKTOR-231** — geler scénario + contrat mois 1. Gate humaine : périmètre RG/avance seulement (pas RAS/pénalités ce cycle).
2. **SEKTOR-232** — attachement période 01/09–30/09 **lu** depuis les déclarations (slice AC-10..16 voisin avancement).
3. **SEKTOR-233** — situation n°1 **montée** depuis l’attachement `SIGNE_MOE` (slice AC-1..7 voisin situation).
4. **SEKTOR-234** — cockpit + fiche chantier : accès attachement / situation avec `chantierId`, sans marché notifié (s’appuie sur 186 si merge).
5. **SEKTOR-235** — preuve API Al Qods mois 1, faits pas écrans.

231 et 234 peuvent **paralléliser** après approbation 231 (fichiers disjoints : service attachement vs routes cockpit).

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-231 Scénario + contrat mois 1 | spec | — |
| 2 | SEKTOR-232 Attachement septembre lu | exec | 231 |
| 3 | SEKTOR-233 Situation n°1 depuis attachement | exec | 232 |
| 4 | SEKTOR-234 Cockpit fin de mois | exec | 231 |
| 5 | SEKTOR-235 Preuve Al Qods mois 1 | qa | 232, 233, 234 |

## Preuves attendues

Script `sektor/e2e/scripts/verify-alqods-situation-mois1-235.mjs` :

- Graphe Al Qods fabriqué par API (pas DE-0103).
- Avancement 40 m³ / 120 m² → attachement auto → signature MOE simulée.
- Situation n°1 : lignes nœud 2.1 + 2.3, pas interne, pas étanchéité 0 m².
- Cumul première période ; RG / avance non nulles si taux chantier renseignés.
- Sans attachement signé : génération situation refusée.
- Rôles échantillon conducteur / chef / daf.

Un vert « listing 200 » **ne compte pas**.

## Décision tranchée

**Mois 1 = RG + avance seulement** (pas pénalités ni RAS dans cette tranche). Le contrat voisin `situation-et-retenues` AC-8..12 reste pour un exec ultérieur.
