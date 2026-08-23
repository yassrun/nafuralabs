---
id: SEKTOR-150
status: doing
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
---

# Preuves — arbre vendu / interne et conversion

> e2e sektor : une étude GAGNE convertie donne un chantier EN_PREPARATION, arbre copié, aucun marché, nœud interne ajoutable.

## Étapes

- [ ] …

## Journal

```
23/08 18:21  posée
23/08 20:52  status → doing
24/08 --:--  QA repris. Rapports 147/148/149 lus (dont les 15 « decide seul »).
             AC-1/2/4 : schema 003_create_chantier_lots.sql — nature NOT NULL + 3 CHECK
             par table (nature connue, origine ssi vendu, interne sans prix de vente).
             AC-3/4 : ChantierLotService + PosteBudgetaireService — create() force INTERNE,
             refuse un vendu demande et refuse tout prix de vente ; copier*Vendu() exige
             l origine. update() ne touche ni nature ni dpgfNoeudId.
             AC-5 : SituationGenerationService L70-74 filtre NatureLigne.VENDU sur les LOTS.
             AC-16 : les 5 cles i18n (natureColumn/Vendu/Interne, origineAction/Introuvable)
             sont presentes dans fr, en ET ar. Vocabulaire : Vendu / Interne, Sold / Internal,
             mabaa / dakhili. Aucun jargon ERP.
             JUnit rejoues a la main (recette nb-test.sh, jamais Gradle) :
               chantiers                  31/31 verts   TEST_EXIT=0
               ChainageAvalAdapterTest     5/5  verts   TEST_EXIT=0
               DossierEtudeChainageAvalTest 9/9 verts   TEST_EXIT=0
             nb-compile.sh chantiers etudes -> EXIT=0 sur les deux.
             Reste : ecrire les 11 scenarios e2e du contrat.
24/08 --:--  e2e ecrits : sektor/e2e/chantiers-arbre-et-conversion.spec.ts, 11 tests
             portant EXACTEMENT les noms de scenario du contrat.
             `playwright test --list` les decouvre tous les 11 ; tsc strict 0 erreur.
             NON EXECUTES : aucun backend ne tourne, rien n est deploye.
             Deux trous nommes (ni l un ni l autre ne casse un AC ecrit) :
              - un SOUS_LOT orphelin est remonte a la racine en silence
                (ChainageAvalAdapter L88) — AC-12 amende ne parle que des POSTES.
              - le DPGF refuse un ARTICLE sans parent : l etude piege d AC-12 se
                fabrique par un ARTICLE sous un ARTICLE.
```

## Rapport de livraison
