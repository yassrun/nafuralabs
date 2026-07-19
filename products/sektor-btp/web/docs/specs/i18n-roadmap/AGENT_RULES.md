# 🤖 Règles pour agents — Roadmap i18n Nafura

> **Lis ce fichier en entier avant tout travail i18n.** Il est court exprès.

## 1. Source unique de vérité

`00-PROGRESS.md` (dans ce même dossier) est la **source unique de vérité** pour l'état du chantier i18n. Aucune autre doc n'a autorité.

## 2. Workflow obligatoire à chaque PR i18n

```
[1] Lire 00-PROGRESS.md (phase en cours + règles)
[2] Lire GLOSSARY.md (cohérence terminologique BTP MA)
[3] Faire le travail (1 PR = 1 module ou 1 tâche outillage)
[4] Mettre à jour 00-PROGRESS.md DANS LE MÊME COMMIT :
    - Ligne tâche : statut + colonne Évidence remplie
    - Compteur de phase (X/Y)
    - Tableau "📈 Compteur de PRs" : 1 nouvelle ligne
    - Table "Objectifs mesurables" si métrique impactée
[5] Lancer npm run i18n:check (Phase 1+)
[6] Lancer npm run lint:no-hardcoded-string sur fichiers touchés
[7] Commit message format : "i18n(<phase>.<tâche>): <résumé>"
```

## 3. Interdits absolus

- ❌ **Marquer ✅ une tâche sans évidence chiffrée** dans la colonne Évidence
- ❌ **Sauter une phase** (ex. attaquer Phase 3 avant que Phase 0 + Phase 1 soient ✅)
- ❌ **Démarrer Phase 2 (AR/RTL)** sans validation explicite utilisateur — c'est Round 2
- ❌ **Multi-modules dans une PR** — 1 PR = 1 module Phase 3, jamais 2
- ❌ **Hardcoded strings en EN** comme placeholders — toujours traduire avec dictionnaire
- ❌ **Modifier `i18n-roadmap/00-PROGRESS.md` hors PR i18n** — pas de "j'ai vu une coquille"
- ❌ **Supprimer une clé EN sans vérifier qu'elle est orpheline** via `npm run i18n:check`
- ❌ **Démarrer une tâche sans s'inscrire** dans le « Registre d'assignation » du `00-PROGRESS.md` (collision garantie sinon)
- ❌ **Toucher un fichier hors de son scope d'isolation** (cf. section 8 ci-dessous)

---

## 8. Règles de coordination pour exécution PARALLÈLE

**LIRE ABSOLUMENT** si tu attaques une tâche dans le cadre d'une **wave parallèle** (cf. section « Plan d'exécution PARALLÉLISÉE » de `00-PROGRESS.md`).

### 8.1 Inscription au registre (obligatoire)

Avant toute première édition de code :

1. Ouvrir `00-PROGRESS.md` → section « 📋 Registre d'assignation des agents »
2. Trouver une ligne avec statut 🆓 et choisir UNE seule tâche
3. Remplacer la ligne avec :
   - **Agent ID** : un identifiant court unique (ex. `cursor-2026-05-22-A1`, `agent-john`, etc.)
   - **Statut** : `🔄 en cours`
   - **Démarré** : date ISO du jour
4. Commit immédiat du `00-PROGRESS.md` (commit séparé OK si nécessaire)
5. **Si une ligne montre déjà 🔄** → choisir autre tâche, ne JAMAIS prendre une tâche en cours

### 8.2 Scope d'isolation par wave

| Wave | Fichiers EXCLUSIFS de ta tâche | Fichiers INTERDITS à édition |
|---|---|---|
| **A** (Phase 0) | Le seul fichier de ta tâche (scripts/, eslint-rules/, GLOSSARY.md) | Tout fichier `.ts`/`.html` d'application |
| **A.4 (split JSON)** | `web/public/assets/i18n/**` + `i18n.generated.ts` | Code applicatif (sauf imports vers les nouveaux packs) |
| **B** (Phase 1) | Ta tâche précise (LOCALE_ID, STATUS_LABELS, pipes) | Les fichiers d'un autre agent B |
| **C** (Phase 3) | (a) ton pack JSON dédié `fr/<module>.json` + EN, (b) `pages/<module>/**`, (c) `models/*.ts` du module | `fr/shared.json`, `en/shared.json`, JSON d'un autre module, pages d'un autre module |
| **D** (Phase 4) | Scope spécifique à la tâche | Code de prod modifié récemment par un agent C |

### 8.3 Coordination sur fichiers partagés

Si tu DOIS modifier un fichier partagé (ex. ajouter une clé dans `fr/shared.json` depuis un module C) :

1. **STOP**. Ne pas le faire dans cette PR.
2. Créer une clé LOCALE à ton module (ex. `ventes.actions.cancel` au lieu de `shared.actions.cancel`)
3. Noter dans le commit message : `[REFACTOR] ventes.actions.cancel à promouvoir vers shared.actions.cancel en PR de coordination ultérieure`
4. Continuer ta PR. Une PR de coordination (séquentielle, après ta wave) consolidera.

### 8.4 Gates entre waves (NE PAS SAUTER)

- **Wave A → Wave B** : la tâche A.4 (split JSON) DOIT être ✅ mergée avant qu'aucun agent B ne démarre, sinon refactor des STATUS_LABELS écrira dans des fichiers obsolètes.
- **Wave B → Wave C** : toutes les tâches B (1.1, 1.2, 1.3) DOIVENT être ✅ mergées avant qu'aucun agent C ne démarre, sinon les modules Phase 3 réécriront des STATUS_LABELS au format pré-refactor.
- **Wave C → Wave D** : ≥ 8/10 modules doivent être ✅ avant Wave D (pluriels ICU = audit global).
- **Wave D → Wave E** : toutes les tâches D ✅, sinon la CI bloquera des PRs futures non encore alignées.

### 8.5 En cas de conflit Git

Si deux agents découvrent qu'ils se chevauchent (malgré le registre) :

1. Le **second à avoir commité** rebase sur le premier (pas l'inverse)
2. Si le rebase est impossible → annulation de la PR du second, redémarrage propre
3. Documenter dans `00-PROGRESS.md` section « 🔧 Décisions actées » : pourquoi le conflit + leçon apprise

### 8.6 Que faire si une tâche fait ⚠️ bloqué

1. Mettre statut `⚠️ bloqué` dans le registre + raison courte dans la colonne « Évidence »
2. Ouvrir une issue GitHub OU notifier l'utilisateur
3. **Libérer le verrou** (`⚠️ bloqué` ≠ `🔄 en cours`) pour qu'un autre agent puisse reprendre si tu abandonnes

### 8.7 Communication inter-agents

- **Pas de mémoire partagée hors `00-PROGRESS.md`**. Tout l'état doit être sérialisé là.
- **Commit messages** = canal officiel : `i18n(<wave>.<tâche>): <résumé> [agent: <id>]`
- **Pas de Slack/Discord/etc.** : l'agent suivant qui ouvre la conversation doit pouvoir tout reconstituer à partir du repo

## 4. Format des clés de traduction

```
<module>.<feature>.<element>.<variant?>

Exemples :
  ventes.facture.actions.emit
  ventes.facture.status.brouillon
  ventes.facture.toast.created
  finance.journaux.empty
  shared.actions.save
  shared.actions.cancel
  enum.<entity>.status.<value>      ← STATUS_LABELS centralisés Phase 1.2
```

## 5. Cohérence terminologique BTP MA

À chaque doute, **consulter `GLOSSARY.md`** d'abord. Si terme absent, **l'ajouter** dans la même PR (= dépendance bloquante).

Quelques exemples NON négociables :
- « Maître d'Ouvrage » = `Project Owner` (jamais "Master Builder", "Client", "Owner" seul)
- « Décompte général définitif (DGD) » = `Final settlement statement (DGD)` (DGD conservé en acronyme)
- « Retenue à la source (RAS) » = `Withholding tax (RAS)`
- « Caution bancaire » = `Bank guarantee`
- « ICE / RIB / IF / CNSS / Patente » = **conservés tels quels** (codes administratifs MA)
- « Société » = `Company` (jamais "Society")
- « Marché public » = `Public contract` (jamais "Public market")

## 6. Mise à jour de 00-PROGRESS.md — exemples

### Marquer une tâche ✅

```diff
- | 0.1 | **Extracteur AST de hardcoded strings** | ❌ | `web/scripts/extract-i18n.mjs` | Doit parcourir [...] |
+ | 0.1 | **Extracteur AST de hardcoded strings** | ✅ | `web/scripts/extract-i18n.mjs` | Livré PR #42. Détecte 5 247 strings, sortie CSV `extracted.csv`. Tests : 18 cas pour parser + heuristique « ressemble FR ». |
```

### Ajouter une ligne au compteur PRs

```diff
- | — | — | — | (aucune PR i18n livrée à date) | — | — | — |
+ | 1 | 2026-05-22 | 0.1 | Extracteur AST | — | — | agent-cursor |
```

### Mettre à jour le compteur de phase

```diff
- **Avancement Phase 0 : 0/5 (0%)**
+ **Avancement Phase 0 : 1/5 (20%)**
```

### Mettre à jour les objectifs mesurables (si impacté)

```diff
- | Strings hardcodées détectées | **~5 000-6 000** | ≤ 50 [...] | ❌ |
+ | Strings hardcodées détectées | **5 247** (mesure exacte 2026-05-22) | ≤ 50 [...] | ❌ |
```

## 7. Si tu es bloqué

- **Question terminologique** : ajouter au `GLOSSARY.md` avec note `[À VALIDER]` et continuer
- **Question scope** : s'arrêter, demander à l'utilisateur, ne pas extrapoler
- **Test parité fail** : ne pas merger, fixer la PR
- **Phase 3 sur module dépendant d'un autre module non traduit** : marquer la tâche 🟡 avec note explicite, ne pas casser la cohérence

---

## 9. CI/CD gates (Round 1 final — Wave E)

Trois workflows GitHub Actions bloquent toute régression i18n :

- **`web-i18n-parity`** — `.github/workflows/web-i18n-parity.yml` : FR/EN strict parity check (`npm run i18n:check`). Échoue si une clé manque ou si JSON malformé.
- **`web-i18n-no-hardcoded`** — `.github/workflows/web-i18n-no-hardcoded.yml` : ratchet `no-hardcoded-string` (`npm run i18n:hardcoded:ratchet`). La baseline (~3 916 findings, verrouillée dans `web/eslint-rules/baseline.json`) ne peut que diminuer.
- **`web-i18n-extractor-tests`** — `.github/workflows/web-i18n-extractor-tests.yml` : self-tests du scanner AST (`npm run i18n:extract:test`). Garantit que l'extracteur détecte toujours les patterns connus (14 specs).

**Tolerance ratchet** : `+5` findings (absorbe les faux positifs Angular control-flow `@if`/`@for`/`@else` ajoutés involontairement). Au-delà = CI rouge.

**Pour ratcheter la baseline à la baisse** après une migration légitime :

```bash
cd web
npm run lint:no-hardcoded-string             # voir le nouveau compteur
npm run i18n:hardcoded:snapshot              # met à jour baseline.json
git add web/eslint-rules/baseline.json
git commit -m "i18n(<phase>.<tâche>): ratchet baseline X → Y findings"
```

Documentation détaillée (workflow recommandé dev, troubleshooting, ajout d'un pack JSON) : **[`CI.md`](./CI.md)**.

---

> Ces règles sont **non négociables**. Toute exception doit être tracée dans la section "🔧 Décisions actées" de `00-PROGRESS.md`.
