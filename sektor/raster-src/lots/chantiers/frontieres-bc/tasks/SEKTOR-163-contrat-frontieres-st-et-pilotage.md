---
id: SEKTOR-163
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: me
---

# CONTRAT — frontières ST et pilotage

> Geler les AC : le contrat ST devient un objet typé côté Achats (fin du codec dans notes) ; le pilotage portefeuille part au socle, la lecture d'un chantier reste.

## Étapes

- [x] Relire les gels § Frontière ST et § Pilotage et KPI, sans les rejouer
- [x] Vérifier les deux frontières dans le code (achats, chantiers, socle, web)
- [x] Écrire `CONTRAT.md` — AC gelés, preuves statiques, scénarios e2e, état initial
- [x] Formuler la question de périmètre laissée ouverte par le gel

## Journal

```
23/08 18:23  posée
23/08 18:38  status → doing
23/08 19:10  CONTRAT.md écrit — AC-1..AC-10 (ST), AC-11..AC-17 (pilotage)
23/08 18:43  status → done-agent
23/08 18:45  toi · approuvée → done-me
23/08 18:51  status → done-agent
23/08 18:52  AC-9 précisée (nœud nav + i18n 3 locales) · piège `chantiers.pilotage` noté
23/08 18:53  le done-me de 18:45 n'a PAS été posé par l'agent et aucune réponse
             à la Question n'est arrivée dans la conversation — remis done-agent
             pour que la gate tienne et que sweep n'emporte pas la Question
23/08 19:20  levée d'ambiguïté : le done-me de 18:45 venait de l'orchestrateur,
             sur délégation explicite de l'humain ce jour-là (« je veux que tu
             sois indépendant »). Le rollback de 18:53 était le bon réflexe d'un
             agent qui ne pouvait pas le savoir — pas un incident d'outil.
             Question tranchée : option B, ChantierKpiController rejoint la coupe
             (societeId optionnel = agrégat de tout le tenant). Contrat amendé
             AC-14 bis / AC-15 / AC-16 / AC-17. Approbation reposée.
23/08 18:52  toi · approuvée → done-me
```

## Rapport de livraison

**ce qui a changé**
`sektor/raster-src/lots/chantiers/frontieres-bc/CONTRAT.md` — créé. 17 AC gelés sur les deux frontières, 7 preuves statiques, 9 scénarios e2e, état initial QA. Aucun fichier sous `sources/`.

**critères prouvés**
Aucun — cette task **produit** les AC, elle n'en prouve aucun. Les preuves sont dues par SEKTOR-164 (AC-1..AC-10), SEKTOR-165 (AC-11..AC-17) et SEKTOR-166.

**décidé seul**
- **`avancementPercent` disparaît du contrat ST** (AC-7), colonne UI retirée plutôt que figée à zéro. L'attachement ST étant vague 2, il n'existe aucune source honnête pour cette valeur ; afficher un zéro serait un mensonge lisible à l'écran.
- **`sousTraitantNom` et `ice` ne sont pas recopiés** sur le contrat (AC-3) : ils se lisent sur `Partner`, qui les porte déjà. Le gel interdit de dupliquer la relation fournisseur.
- **Les URLs ne bougent pas** (AC-15). Le gel déplace des dossiers, pas des routes. Garder `/api/v1/pilotage/*` et `/api/v1/chantiers/analytics` inchangés laisse `web/app/socle/pilotage|dashboard|analytics/` intacts et fait de `pilotage-analyses-kpis.spec.ts` une preuve de non-régression gratuite — au lieu d'une refonte web hors périmètre.
- **Le socle lit les BC par des interfaces déclarées dans `socle`** (AC-13). Ce n'est pas un choix de style : `chantiers`, `finance`, `catalogue` et `etudes` déclarent déjà `project(':sektor:socle')`. Une dépendance `socle → chantiers` serait un cycle Gradle. Même forme que `CatalogLookupApi`.
- **AC-12 comme preuve mécanique** : `achats` et `marches` ne sont importés dans `chantiers/` que par `CashFlowProjectionService` et `PilotageMargeService` (vérifié fichier par fichier). Leur départ doit donc faire tomber deux dépendances Gradle — un critère qu'on ne peut pas contourner en déplaçant à moitié.
- **Pas de canvas UX.** Aucun écran nouveau ; les écrans ST changent de dossier et perdent une colonne. Un canvas dirait moins que l'AC.

**écarts / dette**
- **L'attachement ST reste hors périmètre** (vague 2), donc la symétrie « situation client / situation ST » du gel n'est pas outillée ici. Le BPU est posé (AC-4) mais rien ne le consomme encore.
- **`ChantierKpiController` (`/api/v1/chantiers/kpis`) est laissé en place** alors qu'il agrège lui aussi tous les chantiers du tenant (`nbActifs`, `totalCA`, `totalMarges`). Il n'est pas nommé par le gel — voir `## Question`.
- **Cinq contrôleurs `/api/v1/<domaine>/analytics` frères** (`achats`, `finance`, `hse`, `rh`, `ventes`) restent dans leur BC alors que `chantiers` part au socle (AC-14). La symétrie est cassée le temps d'une vague — voir `## Question`.
- **Le seed ST** (`ContratFournisseurSousTraitanceSeedService`) doit être refait sur la table typée ; AC-10 le permet mais ne dit pas s'il survit. Laissé à l'exec.
- Les libellés exacts des colonnes de la table typée et le nommage des routes `/api/v1/achats/…` ne sont pas gelés : l'AC fixe la ligne, pas la nomenclature.
- **Anomalie de statut.** Un `done-me` a été posé sur cette task à 18:45, après le `done-agent` de l'agent. Il ne vient pas de l'agent, et **aucune réponse à la `## Question` n'est arrivée**. La task portant `gate: me`, `done-me` la rendait éligible au `sweep` — qui l'aurait **supprimée du dépôt**, question ouverte comprise. Statut remis à `done-agent`. À vérifier côté outil : qui pose `done-me`, et pourquoi une task `gate: me` a pu y passer sans approbation.

## Question

Le gel nomme deux contrôleurs à couper — `PilotageController` et `ChantiersAnalyticsController`. Mais le code montre que la consolidation multi-chantiers est un **motif uniforme** : six BC servent `/api/v1/<domaine>/analytics` et huit servent `/api/v1/<domaine>/kpis`, tous consommés par `web/app/socle/`. Couper le seul chantier casse la symétrie. Jusqu'où va SEKTOR-165 ?

- **A** — S'en tenir au gel : seuls `PilotageController` et `ChantiersAnalyticsController` partent au socle. `ChantierKpiController` et les cinq analytics frères restent chez eux, nommés en dette. *Conséquence : un sous-lot court et sûr, mais `chantiers/` devient l'exception et la règle « analytics au socle » reste invisible dans le code pour les cinq autres BC.*
- **B** — Étendre à `ChantierKpiController` seul : tout ce qui, dans `chantiers/`, consolide plusieurs chantiers part au socle. *Conséquence : la frontière **chantiers** est propre et entière — c'est le lot dont on parle — au prix d'un troisième contrôleur à déplacer et d'un port de lecture de plus (AC-13).*
- **C** — Aligner les six BC dans la foulée : tous les analytics et tous les KPI au socle, par ports. *Conséquence : la règle de `DECISIONS.md` devient vraie partout, mais le sous-lot double de taille, touche six BC qui n'ont rien demandé, et sort de la frontière « chantiers » que ce lot porte.*

Recommandé : **B** — le lot s'appelle « frontières BC » du **chantier** ; laisser dans `chantiers/` un agrégat portefeuille que le gel n'a simplement pas nommé rendrait AC-17 faux dès sa livraison, alors que C ouvre un chantier qui mérite son propre lot.
