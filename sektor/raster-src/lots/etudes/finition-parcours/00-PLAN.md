# Plan — finition du parcours Étude → Chantier

## But livrable

Rendre le parcours raffiné jusqu'à la conversion : un gain contrôlé, une conversion sans marché, une chaîne Étude–Devis–Chantier–Catalogue navigable, et une IA qui parle du dossier ouvert.

## Intention

La revue humaine du 27/08 confirme que les montants et le lien Étude → Chantier tiennent. Elle refuse de clôturer : on peut encore gagner une étude à 100 % de coûts non établis, le bouton promet un marché que la fenêtre nie, le devis n'est pas une fiche depuis sa liste, et les composants `LIBRE` n'ont pas de décision Catalogue.

Une cartographie Mode B du même jour sur `DE-0103` / `DV-2026-0060` / `CH-2026-101` montre en plus que DA, BL et clôture métier ne partent pas du cockpit. Ce n'est pas un trou de ce sous-lot : c'est la vague 2 (`matiere-et-magasin`) et un chapitre réception. Ce plan les nomme pour ne pas les avaler.

## Périmètre

Inclus : AC-1 à AC-17 du [`CONTRAT.md`](CONTRAT.md).

Exclus : DA / BL / magasin, réception PV, clôture conditionnée à l'avancement, planning, SEKTOR-210, approbation SEKTOR-209.

## Approche

1. Recoller un moteur de contrôles **consommé par le gain et la conversion**. SEKTOR-202 est `done-me` mais `CompletudeEtudeService` est absent de l'arbre intégré : ne pas supposer qu'il existe. Réintroduire le minimum nécessaire aux AC-1 à AC-4, sans rejouer tout `raffinement-etude`.
2. Aligner CTA, dialog et API de conversion (AC-5, AC-6) — contrat `arbre-et-conversion` AC-10 déjà gelé.
3. Brancher les navigations déjà prévues (AC-7, AC-8, AC-9) : routes détail devis, `openDevis` / `openEtude` sur le chantier.
4. Persister la décision Catalogue (AC-10) : table ou journal d'audit sur le composant, pas un libellé UI.
5. Correctifs portefeuille / checklist (AC-11 à AC-15) sans refonte visuelle.
6. IA : trois gestes bornés + journal, pas un chatbot (AC-16).
7. Preuve Mode B (AC-17).

Risque : retoucher le cockpit (AC-15) pendant que SEKTOR-209 attend une gate humaine. Ne modifier que le ratio prérequis / recommandé, pas la matrice OS déjà corrigée.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-212 Clarifier le contrat de finition | spec | — |
| 2 | SEKTOR-211 Garde-fous avant gain (capture inbox) | exec | 212* |
| 3 | SEKTOR-213 Vocabulaire et formulaire de conversion | exec | 211 |
| 4 | SEKTOR-214 Chaîne Étude–Devis–Chantier navigable | exec | 213 |
| 5 | SEKTOR-215 Décision Catalogue des LIBRE | exec | 214 |
| 6 | SEKTOR-216 Pagination, `/etudes`, chargement, % | exec | 215 |
| 7 | SEKTOR-217 Checklist prérequis vs recommandé | exec | 216 |
| 8 | SEKTOR-218 IA contextuelle du dossier | exec | 217 |
| 9 | SEKTOR-219 Preuve Mode B | qa | 218 |

\* SEKTOR-211 vient de `promote` : pas de `blocked_by` mécanique. **Ne pas lancer l'exec avant d'approuver SEKTOR-212.**

## Preuves attendues

Voir les scénarios du contrat. État initial : graphe créé par API sur `qa-local`, pas un seed favorable. Résultat : gain refusé à 100 % de coûts non établis ; conversion sans le mot marché ; devis et étude cliquables depuis le chantier ; décision Catalogue visible après conversion.

**Preuves (28/08)** — agrégat SEKTOR-219 : 6 scripts e2e · 59 PASS · `node raster/t.mjs check` OK. Mobile 390 : non automatisé.

## Décisions ouvertes

Une seule, portée par SEKTOR-212 :

Les coûts **partiellement** non établis restent un WARNING à accepter (AC-2). Le cas **100 %** est gelé `BLOCKING` (AC-3). Si tu veux pouvoir gagner quand même avec motif DG/owner, il faut amender AC-3 avant l'exec.
