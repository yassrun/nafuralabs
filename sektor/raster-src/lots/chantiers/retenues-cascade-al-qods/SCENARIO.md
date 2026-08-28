# Scénario — Retenues cascade Al Qods

Réutilise le montage **septembre** Al Qods (postes 2.1 + 2.3, lot interne absent, étanchéité absente) — cf. [`../situation-al-qods-mois-1/SCENARIO.md`](../situation-al-qods-mois-1/SCENARIO.md).

## Données gold

`sektor/e2e/fixtures/al-qods/situation-mois1/expected/situation-1.json` — travaux période **75 735,60 HT**, RG 7 %, avance 10 %, sans pénalités ni RAS.

## Cas 1 — AC-12 baseline

Chantier converti sans `tauxRas`. Attachement signé septembre. Génération situation n°1 sans paramètre pénalités → identique au gold mois 1.

## Cas 2 — AC-8 + AC-9 + AC-10

Même montage, `PUT /chantiers/{id}` avec `tauxRas: 5`. Génération `?numero=1&penalitesRetardHt=1000`.

Attendu (arrondi 2 déc.) :

| Ligne | Montant |
|-------|---------|
| Travaux période HT | 75 735,60 |
| Pénalités | 1 000,00 |
| Assiette RG/avance | 74 735,60 |
| RG 7 % | 5 231,49 |
| Avance 10 % | 7 473,56 |
| Net à payer HT | 62 030,55 |
| Net à payer TTC (20 %) | 74 436,66 |
| RAS 5 % (informative) | 3 721,83 |

Le net TTC **ne change pas** si on retire `tauxRas` du chantier (même pénalités) — AC-11 par comparaison.

## Cas 3 — AC-12 zéro explicite

Chantier sans `tauxRas`, génération avec `penalitesRetardHt=0` → RAS et pénalités à zéro, cascade RG/avance identique au gold.
