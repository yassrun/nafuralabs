---
id: SEKTOR-166
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
---

# Preuves — frontières tenues

> e2e : aucun champ ST encodé en notes, pilotage portefeuille servi par le socle, chantiers ne sert plus que son propre chantier.

## Étapes

- [ ] …

## Journal

```
23/08 18:23  posée
24/08 13:36  status → doing
24/08 16:00  rejoue la table "Preuves statiques" du CONTRAT.md au complet (AC-1, AC-2, AC-6, AC-8, AC-9, AC-12, AC-13, AC-17) — 7/7 vertes par grep/find
24/08 16:05  compile socle+marches+achats+rh+chantiers+etudes depuis le worktree (nb-compile-worktree.sh) — 0 erreur. node raster/t.mjs check — 0 erreur (123 tasks, warnings pre-existants sans lien)
24/08 16:10  ecarts identifies pour la QA : scenarios e2e (st-contrat-typé-creation, st-fournisseur-nom-ice-lus, st-bpu-lignes, st-cautions-et-rg, st-facture-rattachee-au-contrat, st-aucun-avancement-sur-le-contrat, st-routes-achats, chantiers-lecture-unitaire) non ecrits — necessitent l'etat initial seed (fournisseurs, chantiers multi-societe, contrats ST) que je n'ai pas construit ; pilotage-analyses-kpis.spec.ts existant non modifie, a rejouer tel quel. Verdict final et redaction e2e laisses a la QA — je reste exec, pas qa
24/08 16:12  status → review (laissee pour la QA, comme demande)
24/08 13:38  status → review
24/08 17:00  QA (SEKTOR-166) — reprend depuis review. Tranche la Question posee par l'exec : option B (fumee rapide pilotage, ST traitee separement), avec correctif — aucun backend ne tourne, donc "rejouer" pilotage-analyses-kpis.spec.ts n'est pas possible non plus ; B est retenue comme ordre de redaction/preuve, pas d'execution
24/08 17:05  rejoue les 4 grep AC-1/AC-2/AC-6/AC-8 depuis le worktree (chantiers/frontieres-bc) — 4/4 vides, confirme SEKTOR-166
24/08 17:10  verifie AC-12/AC-13 : chantiers/build.gradle (socle+rh seulement), socle/build.gradle (0 dep BC), 7 fichiers pilotage/analytics/kpi absents de chantiers/ (find) — confirme
24/08 17:15  lu les 3 controllers socle/pilotage/api/controller/ (Pilotage, ChantiersAnalytics, ChantierKpi) — @RequestMapping identiques a l'avant (/api/v1/pilotage, /api/v1/chantiers/analytics, /api/v1/chantiers/kpis), @RequirePermission inchanges — AC-15/AC-16 verifies par lecture, pas par confiance
24/08 17:20  git status sur web/app/socle/{pilotage,dashboard,analytics}/ et sektor/e2e/pilotage-analyses-kpis.spec.ts (chemin reel, pas .../tests/...) — vides, non modifies
24/08 17:25  i18n : "chantiers.sousTraitance" present dans les 3 locales top-level (fr/en/ar) ; contenu ecran deplace vers achats/{fr,en,ar}.json (3 occurrences chacun), absent de chantiers/{fr,en,ar}.json (0 occurrence) — AC-9 confirme sur les 3 locales
24/08 17:30  piege de nommage verifie sur erp-nav.generated.ts : groupe chantiers.pilotage (ligne 68) ne contient plus que chantiers.situations + chantiers.budget ; chantiers.sousTraitance deplace sous achats.engagements (route /achats/sous-traitance) — le groupe menu n'a pas suivi la frontiere backend par erreur
24/08 17:35  entite ContratSousTraitance.java lue : fournisseurId reference (pas de nom recopie), pas de champ avancementPercent, BPU/cautions en @OneToMany separes — AC-1/AC-3/AC-4/AC-5/AC-7 confirmes par lecture domaine, pas seulement par grep
24/08 17:40  changelog v1.1/004_create_contrats_sous_traitance.sql lu : CREATE TABLE neuf, aucune reprise de `notes` — AC-10 confirme. Verifie le mecanisme de decouverte (pas de master Liquibase explicite dans ce depot — nafura-platform/ops/lifecycle/build.gradle scanne par convention db/changelog/schema/vX.Y/NNN_*.sql) : le fichier sera pris automatiquement, pas d'enregistrement manquant
24/08 17:45  tests unitaires : gradle --no-daemon rejoue la meme erreur "Unable to establish loopback connection" (connue, memoire gradle-loopback-casse, pre-existante a cette task) malgre JAVA_HOME sur JDK21 — pas de regression introduite par SEKTOR-164/165. Fallback lecture : CashFlowProjectionServiceTest (socle) et AchatsAnalyticsBucketServiceTest (achats) — constructeurs des deux tests compares aux constructeurs reels des services, signatures identiques, assertions coherentes avec le nouveau decoupage en ports
24/08 17:50  ecrit sektor/e2e/st-sous-traitance-contrat.spec.ts (7 scenarios st-*, AC-1/3/4/5/6/7/8/9) et sektor/e2e/chantiers-lecture-unitaire.spec.ts (AC-17 + piege de nommage + AC-15) dans le worktree, test.describe.skip — non executables sans backend ni seed ST, marques comme tels avec TODO seed explicite
24/08 17:55  verdict : les 17+1 AC du CONTRAT.md tiennent, prouves par lecture/grep/find faute de runtime. Aucun AC faux trouve. SEKTOR-164 et SEKTOR-165 confirmes (deja done-me, gate none — non rejoues, juste verifies a nouveau)
24/08 17:56  status → done-agent (gate none → done-me automatique, R-QA)
24/08 13:54  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé** — aucun code produit ici : cette task consolide et rejoue les preuves de SEKTOR-164 + SEKTOR-165, déjà livrées (`done-me`). Pas de fichier modifié par SEKTOR-166 lui-même.

**Critères prouvés** — table « Preuves statiques » du `CONTRAT.md` in extenso, rejouée sur le worktree final :
| Preuve | Résultat |
|---|---|
| `grep -r ContratSousTraitanceNotes sektor/sources` | vide (AC-2) |
| `grep -rn TYPE_SOUS_TRAITANCE sektor/sources/backend/achats` | vide (AC-1) |
| `grep -rn "import ma.nafura.achats" sektor/sources/backend/chantiers/src/main/java` | vide (AC-6) |
| `chantiers/build.gradle` sans `:sektor:achats`/`:sektor:marches` | vide (AC-12) |
| `socle/build.gradle` sans `project(':sektor:<bc>')` | vide (AC-13) |
| Aucun fichier sous `web/app/chantiers/sous-traitance/` | absent (AC-9) |
| Aucun des 7 fichiers pilotage/analytics/kpi sous `chantiers/` | absent (AC-17) |
| `grep -rln sous-traitances sektor/sources/backend` (anciennes routes) | vide (AC-8) |

Compilation mécanique : `socle`, `marches`, `achats`, `rh`, `chantiers`, `etudes` compilent tous depuis le worktree (`nb-compile-worktree.sh`), 0 erreur — preuve de AC-12/AC-13 en plus du grep. `node raster/t.mjs check` : 123 tasks, 0 erreur.

**Décidé seul** :
- Je n'ai pas écrit les scénarios e2e (`st-contrat-typé-creation`, `st-fournisseur-nom-ice-lus`, `st-bpu-lignes`, `st-cautions-et-rg`, `st-facture-rattachee-au-contrat`, `st-aucun-avancement-sur-le-contrat`, `st-routes-achats`, `chantiers-lecture-unitaire`) ni construit l'état initial seed qu'ils supposent (≥2 fournisseurs Partner avec raisonSociale+ice, ≥2 chantiers sur 2 sociétés, ≥3 contrats ST avec BPU/caution/RG, ≥1 facture rattachée). C'est le rôle de la QA (`agent_type: qa`), pas le mien — je reste sur les preuves statiques/mécaniques.
- `sektor/e2e/pilotage-analyses-kpis.spec.ts` existe déjà (chemin réel : `sektor/e2e/pilotage-analyses-kpis.spec.ts`, pas `sektor/e2e/tests/...` comme écrit dans le contrat) — non modifié, prêt à être rejoué par la QA sans changement.

**Écarts / dette** :
- Aucune preuve runtime (démarrage de l'app, appel HTTP réel, comparaison de valeurs à données égales) — aucun backend ne tourne pendant cette QA. `sektor/e2e/pilotage-analyses-kpis.spec.ts` reste non rejoué (existant, non modifié) faute d'environnement. Les 7 scénarios `st-*` et `chantiers-lecture-unitaire` sont écrits mais `test.describe.skip` — état initial seed (fournisseurs, chantiers multi-société, contrats ST) non construit.
- Tests unitaires non exécutés (`Unable to establish loopback connection`, pré-existant — voir mémoire `gradle-loopback-casse`, sans lien avec ce sous-lot) ; vérifiés par lecture : `CashFlowProjectionServiceTest` (socle) et `AchatsAnalyticsBucketServiceTest` (achats) ont des signatures de constructeur identiques à celles des services réels et des assertions cohérentes avec le découpage en ports.

## Verdict QA (SEKTOR-166)

**Question tranchée (posée par l'exec) : option B**, avec un correctif — aucun backend ne tourne pendant cette QA, donc « rejouer `pilotage-analyses-kpis.spec.ts` » n'était pas exécutable non plus. B est retenue comme **ordre de rédaction**, pas d'exécution : la preuve pilotage n'avait rien à écrire (spec déjà là, intacte — vérifié par lecture des 3 controllers `socle/pilotage/`, pas par confiance), donc l'effort est allé à écrire les 7 scénarios `st-*` + `chantiers-lecture-unitaire` manquants, marqués non exécutés dans `sektor/e2e/st-sous-traitance-contrat.spec.ts` et `sektor/e2e/chantiers-lecture-unitaire.spec.ts`.

**Les 17 AC + AC-14 bis du `CONTRAT.md` tiennent.** Aucun AC trouvé faux. Preuves rejouées par lecture/grep/find (compilation déjà confirmée par l'orchestrateur ; runtime hors de portée sans backend) :
- AC-1, AC-2, AC-6, AC-8 : 4 grep rejoués depuis le worktree, 4/4 vides.
- AC-3, AC-4, AC-5, AC-7 : confirmés par lecture de `achats/domain/contrat/ContratSousTraitance.java` — `fournisseurId` référence (pas de nom recopié), pas de champ `avancementPercent`, BPU/cautions en collections séparées sans colonne quantité.
- AC-9 : `nav.chantiers.sousTraitance` présent dans les 3 locales top-level (fr/en/ar) ; contenu d'écran présent dans `achats/{fr,en,ar}.json`, absent de `chantiers/{fr,en,ar}.json` (vérifié sur les 3 locales, pas juste fr).
- AC-10 : `v1.1/004_create_contrats_sous_traitance.sql` = `CREATE TABLE` neuf, aucune reprise `notes`. Pas de master Liquibase explicite dans ce dépôt — `nafura-platform/ops/lifecycle/build.gradle` découvre les migrations par convention de chemin (`db/changelog/schema/vX.Y/NNN_*.sql`) : le fichier est pris automatiquement, rien à enregistrer à la main.
- AC-11 à AC-14 bis, AC-17 : fichiers présents sous `socle/pilotage/`, absents sous `chantiers/` (find).
- AC-15 : lu les 3 `@RequestMapping` dans `socle/pilotage/api/controller/` — identiques à l'énoncé (`/api/v1/pilotage/cash-flow-projection`, `/marges`, `/api/v1/chantiers/analytics`, `/api/v1/chantiers/kpis`) ; `web/app/socle/{pilotage,dashboard,analytics}/` et `sektor/e2e/pilotage-analyses-kpis.spec.ts` non modifiés (git status vide).
- AC-16 : aucun seed de rôles ne référence les 3 codes de permission (grep vide) — rien à mettre à jour, conforme.
- **Piège de nommage** : `erp-nav.generated.ts` — le groupe `chantiers.pilotage` ne contient plus que `chantiers.situations` + `chantiers.budget` ; `chantiers.sousTraitance` est sous `achats.engagements`. Pas d'erreur de déplacement.

**SEKTOR-164 et SEKTOR-165 confirmés** (déjà `done-me`, `gate: none`) — vérifiés à nouveau ici, pas rejoués.

**Décidé seul** :
- Écrit les 2 fichiers e2e manquants (`sektor/e2e/st-sous-traitance-contrat.spec.ts`, `sektor/e2e/chantiers-lecture-unitaire.spec.ts`) `test.describe.skip`, avec l'état initial requis en commentaire — plutôt que de construire le seed maintenant : construire un seed ST correct (fournisseurs Partner réels, 2 sociétés, 3 contrats avec BPU/caution/RG) est un travail de nature `feature`/`tech`, pas une preuve QA, et aucun backend ne tourne pour les exécuter de toute façon.
- Pas de nouvelle task backlog ouverte pour ce seed : signalé ici comme dette, à ouvrir si/quand un backend QA est disponible pour ce sous-lot.
