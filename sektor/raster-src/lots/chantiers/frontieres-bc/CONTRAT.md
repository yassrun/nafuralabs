# Contrat — Frontières BC : sous-traitance et pilotage

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Journal produit : [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) § **Frontière ST** · § **Les cinq derniers points / Pilotage et KPI**.
> Loi des dossiers : [`DECISIONS.md`](../../../DECISIONS.md) — « Socle = tableau de bord + pilotage / analytics », « Web suit le backend ».
> Plan : [`00-PLAN.md`](00-PLAN.md). Pas de canvas — aucun écran nouveau.

**Qualification : TECH.** Deux frontières mal placées. Le comportement visible ne change pas ; ce qui change, c'est **qui possède quoi**.

Gelé le **23/08/2026**. Les tasks exec (SEKTOR-164, SEKTOR-165) **référencent** `AC-n` ; elles ne les recopient pas.

---

> **Amendé à l'approbation (23/08/2026)** — question tranchée par l'approbateur, option **B**.
> Le gel ne nommait que `PilotageController` et `ChantiersAnalyticsController`. Le code montre que `ChantierKpiController` agrège lui aussi **tout le tenant** (`societeId` optionnel) : le laisser dans `chantiers/` rendrait **AC-17 faux le jour de sa livraison**. Il rejoint la coupe — **AC-14 bis**.
> Option **C** écartée : aligner les six BC qui servent `/analytics` et les huit qui servent `/kpis` est un chantier réel, mais il mérite son propre lot. Il n'a pas à être payé par ce sous-lot.

## Intention

Deux coupes, rien d'autre.

**A — Sous-traitance.** Achats possède le **contrat** ST, comme un objet typé. Aujourd'hui c'est un `ContratFournisseur` avec `type = SOUS_TRAITANCE` dont les champs métier sont empaquetés en JSON dans la colonne `notes` par `ContratSousTraitanceNotes`. Le contrat porte fournisseur, montant, BPU, cautions, retenue de garantie, factures. Chantiers garde l'**exécution** — mais **l'attachement ST est vague 2** : ici, seul le contrat bouge.

**B — Pilotage.** Le **portefeuille** — consolidation multi-chantiers, cash-flow global, analytics — part au **socle**. La lecture **d'un** chantier reste dans `chantiers/`.

---

## Constat vérifié dans le code (pas une spec)

| Fait | Où |
|------|-----|
| Le contrat ST n'est pas un objet | `achats/domain/contrat/ContratFournisseur` + `TYPE_SOUS_TRAITANCE` + `ContratSousTraitanceNotes` (codec JSON dans `notes`) |
| `contrats_fournisseur` porte déjà des colonnes qui n'ont de sens que pour une ST | `art187_declare`, `art187_valide_moa`, `paiement_direct_moa` |
| Le web du contrat est du mauvais côté | `web/app/chantiers/sous-traitance/`, route `/chantiers/sous-traitance`, nav sous Chantiers |
| Le pilotage est **cross-BC** | `CashFlowProjectionService` lit `marches`, `achats`, `rh`, `chantiers` · `PilotageMargeService` lit `chantiers` + `marches` |
| Ces deux services sont les **seuls** à sortir de `chantiers/` | `achats` et `marches` ne sont importés que par eux ; `rh` l'est aussi par `ApproverResolutionService`, `ChantierAffectationService`, `ChantierScopeService` |
| Le web est **déjà** au socle | `web/app/socle/pilotage/`, `web/app/socle/dashboard/`, `web/app/socle/analytics/` |
| Le socle ne peut pas dépendre d'un BC | `chantiers`, `finance`, `catalogue`, `etudes` déclarent déjà `project(':sektor:socle')` — l'inverse est un cycle |
| Le fournisseur a déjà nom et ICE | `achats/domain/fournisseur/Partner` (`raisonSociale`, `ice`) |
| Aucun garde front sur les permissions | `erp-nav.generated.ts` est un arbre nu — pas de champ `permission`, pas de `can(…)` |

**Piège de nommage.** Le nœud de navigation `chantiers.pilotage` (« Pilotage chantier ») **n'a rien à voir avec la frontière B** : c'est un groupe de menu qui contient situations, budget et sous-traitance — de la lecture d'**un** chantier. Il **reste** côté Chantiers. Ce qui part au socle, c'est `/api/v1/pilotage`, servi par `PilotageController`.

---

## A. Critères gelés — frontière ST

**AC-1 — Le contrat ST est un objet typé.** Une entité dédiée dans `achats/`, sa table, sa clé. Le contrat ST cesse d'être un `ContratFournisseur` discriminé. Après la bascule, `ContratFournisseur.TYPE_SOUS_TRAITANCE` n'existe plus et la contrainte `chk_contrats_fournisseur_type` n'admet plus que `'FOURNISSEUR'`.

**AC-2 — Fin du codec.** `ContratSousTraitanceNotes` est **supprimée**. Un `grep -r ContratSousTraitanceNotes sektor/sources` ne renvoie rien. Aucun champ métier n'est encodé dans un champ texte : plus de JSON dans `notes`, ni sur le contrat ST, ni ailleurs dans le périmètre.

**AC-3 — Ce que porte le contrat.** Colonnes typées : fournisseur (**référence**, pas un nom recopié), chantier, objet, dates début / fin, statut, montant HT, taux de retenue de garantie, déclaration art. 187 et paiement direct MOA. `sousTraitantNom` et `ice` ne sont **pas stockés** sur le contrat : ils se lisent sur le `Partner` fournisseur. Les colonnes ST quittent `contrats_fournisseur` — `art187_declare`, `art187_valide_moa`, `paiement_direct_moa` au minimum ; toute colonne qui y reste doit être justifiée par un usage `FOURNISSEUR`.

**AC-4 — BPU.** Le contrat ST porte son **bordereau de prix unitaires** : lignes typées (code, désignation, unité, prix unitaire). Pas de quantité exécutée sur le BPU — c'est le rôle de l'attachement ST (vague 2).

**AC-5 — Cautions et retenue de garantie.** Elles vivent sur le contrat ST, côté `achats/`. Les champs caution de l'entité `Chantier` (côté maître d'ouvrage / client) ne sont **pas** réutilisés : ce n'est pas la même caution, ni le même sens.

**AC-6 — Factures.** La facture ST est une `FactureFournisseur` d'`achats/`, rattachée au contrat ST par une référence explicite. Depuis le contrat on lit ses factures. **Aucun** objet facture, attestation ou relation fournisseur n'apparaît dans `chantiers/` : après la bascule, `grep -rn "import ma.nafura.achats" sektor/sources/backend/chantiers/src/main/java` ne renvoie rien.

**AC-7 — L'avancement quitte le contrat.** `avancementPercent` disparaît du contrat ST, de son DTO et de l'écran. C'est de l'exécution ; elle reviendra par l'attachement ST en vague 2. **Aucune valeur d'avancement n'est affichée ni calculée** à partir du contrat — pas de zéro de complaisance, pas de colonne vide : la colonne est retirée.

**AC-8 — Les routes API passent sous achats.** `/api/v1/chantiers/{chantierId}/sous-traitances`, `/api/v1/chantiers/{chantierId}/sous-traitances/synthese` et `/api/v1/chantiers/sous-traitances` disparaissent. Le contrat ST se sert sous `/api/v1/achats/…` ; **le filtre par chantier est un paramètre de requête, pas un segment de chemin**. `@SecuredResource(domain = "chantiers", …)` devient `domain = "achats"` sur ces contrôleurs.

**AC-9 — Le web suit le backend.** `web/app/chantiers/sous-traitance/` part sous `web/app/achats/`. La route `/chantiers/sous-traitance` devient une route `/achats/…`. Dans `web/app/socle/shell/erp-nav.generated.ts`, le nœud `chantiers.sousTraitance` quitte le groupe **Chantiers** pour **Achats** ; ses clés i18n `nav.chantiers.sousTraitance` suivent dans les **trois** locales (`web/public/assets/i18n/applications/erp/{fr,en,ar}.json`) — aucune clé orpheline, aucun libellé manquant en arabe. Plus aucun dossier ni route ST ne subsiste sous `web/app/chantiers/`.

**AC-10 — Pas de migration de données.** Lab métier : schéma clean + re-seed (`.cursor/rules/lab-mode-no-prod-data.mdc`). Le changelog Liquibase crée la table typée ; **aucun script ne reprend les `notes` JSON existantes**. Le seed ST alimente la table typée ou disparaît.

---

## B. Critères gelés — frontière pilotage

**AC-11 — Le cross-BC part au socle.** `PilotageController` (`/api/v1/pilotage`), `CashFlowProjectionService` et `PilotageMargeService` quittent `chantiers/` pour `socle/`. Ce sont les porteurs de la consolidation multi-chantiers et du cash-flow global.

**AC-12 — Preuve mécanique de la coupe.** Après la bascule, `chantiers/build.gradle` ne déclare plus `project(':sektor:achats')` ni `project(':sektor:marches')`, et le module compile. La dépendance `project(':sektor:rh')` **reste** — affectation, approbateur et scope s'en servent, et le calendrier RH est une lecture assumée (§ Frontière RH).

**AC-13 — Aucun cycle.** `socle/build.gradle` ne gagne **aucune** dépendance vers un BC. Aucun `import ma.nafura.<bc>.domain` ni `.repository` dans `socle/`. Les données des BC arrivent au socle par des **interfaces déclarées dans `socle`** et implémentées dans chaque BC, câblées par `app/` — même forme que `CatalogLookupApi`.

**AC-14 — Les analytics chantier suivent la même ligne.** `ChantiersAnalyticsController` et `ChantiersAnalyticsBucketService` quittent `chantiers/` pour `socle/` : `/api/v1/chantiers/analytics` agrège **tous** les chantiers du tenant par société / BU — c'est du portefeuille, pas la lecture d'un chantier.

**AC-14 bis — Les KPI chantiers aussi.** `ChantierKpiController` (`/api/v1/chantiers/kpis`) et `ChantierKpiService` quittent `chantiers/` pour `socle/`. La route accepte un `societeId` **optionnel** et calcule sur **tout le tenant** : c'est un agrégat de portefeuille, au même titre que les analytics. Le code de permission `chantiers.kpis.read` suit le module (AC-16).

**AC-15 — Les URLs ne bougent pas.** La frontière déplacée est un dossier backend, **pas un contrat HTTP**. `/api/v1/pilotage/cash-flow-projection`, `/api/v1/pilotage/marges`, `/api/v1/chantiers/analytics` et `/api/v1/chantiers/kpis` répondent à l'identique — mêmes paramètres, mêmes dimensions, mêmes métriques, mêmes valeurs à données égales. `web/app/socle/pilotage/`, `web/app/socle/dashboard/` et `web/app/socle/analytics/` ne sont **pas modifiés**, et `sektor/e2e/tests/pilotage-analyses-kpis.spec.ts` passe **sans être touché**.

**AC-16 — Permissions.** Les codes de permission suivent le module qui sert la route : `chantiers.pilotage.read`, `chantiers.analytics.read` et `chantiers.kpis.read` deviennent des codes socle. Le seed de rôles est mis à jour dans le même geste. Aucun garde front ne référence ces codes (vérifié) — la seule preuve attendue est AC-15.

**AC-17 — Ce qui reste dans `chantiers/`.** La lecture **d'un** chantier, entière : fiche, budget, avancement, situations, attachements, marge et courbe de ce chantier. Ni `PilotageController`, ni `CashFlowProjectionService`, ni `PilotageMargeService`, ni `ChantiersAnalyticsBucketService`, ni `ChantierKpiController` / `ChantierKpiService` ne subsistent sous `chantiers/`, même en doublon mort.

---

## Hors périmètre (dette nommée, pas AC)

- **L'attachement ST** — vague 2 : il suppose les activités (§ capacité vs engagement).
- **La frontière RH** (pointage imputé à l'activité) — vague 2.
- Les cinq autres `/api/v1/<domaine>/analytics` (`achats`, `finance`, `hse`, `rh`, `ventes`) et les huit `/api/v1/<domaine>/kpis` — **voir la question ouverte de SEKTOR-163**.
- `ChantierKpiController` (`/api/v1/chantiers/kpis`) : agrégat multi-chantiers lui aussi, laissé en place par ce contrat — même question.
- La valorisation d'un attachement ST au BPU (la symétrie « situation client / situation ST ») — elle n'existe qu'une fois l'attachement livré.

---

## Scénarios de preuve

L'exec implémente ; le QA joue. Les preuves statiques sont des commandes, pas des specs.

### Preuves statiques

| Preuve | Couvre |
|--------|--------|
| `grep -r ContratSousTraitanceNotes sektor/sources` → vide | AC-2 |
| `grep -rn "TYPE_SOUS_TRAITANCE" sektor/sources/backend/achats` → vide | AC-1 |
| `grep -rn "import ma.nafura.achats" sektor/sources/backend/chantiers/src/main/java` → vide | AC-6 |
| `chantiers/build.gradle` sans `:sektor:achats` / `:sektor:marches`, build vert | AC-12 |
| `socle/build.gradle` sans `project(':sektor:<bc>')` · aucun `import ma.nafura.<bc>.domain` dans `socle/` | AC-13 |
| Aucun fichier sous `sektor/sources/web/app/chantiers/sous-traitance/` | AC-9 |
| Aucun des quatre services / contrôleurs sous `chantiers/` | AC-17 |

### Scénarios e2e

| Scénario | Couvre |
|----------|--------|
| `st-contrat-typé-creation` | AC-1, AC-3 |
| `st-fournisseur-nom-ice-lus` | AC-3 |
| `st-bpu-lignes` | AC-4 |
| `st-cautions-et-rg` | AC-5 |
| `st-facture-rattachee-au-contrat` | AC-6 |
| `st-aucun-avancement-sur-le-contrat` | AC-7 |
| `st-routes-achats` | AC-8, AC-9 |
| `pilotage-analyses-kpis.spec.ts` (existant, **non modifié**) | AC-11, AC-14, AC-15, AC-16 |
| `chantiers-lecture-unitaire` | AC-17 |

**État initial requis :** tenant `qa-local` ; **≥ 2 fournisseurs** `Partner` avec `raisonSociale` **et** `ice` renseignés ; **≥ 2 chantiers** rattachés à **deux sociétés / BU distinctes** (sans quoi les buckets analytics de AC-15 ne prouvent rien) ; **≥ 3 contrats ST**, dont **deux sur le même chantier** et **un sur un autre**, avec BPU non vide, une caution et un taux de RG non nul ; **≥ 1 facture fournisseur** rattachée à un contrat ST ; des situations de travaux et des factures marché sur la fenêtre du cash-flow, **avec des valeurs différentes d'un mois à l'autre**.
