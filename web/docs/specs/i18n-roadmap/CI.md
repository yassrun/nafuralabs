# 🔒 CI/CD permanente i18n — Round 1, Wave E

> Cette doc décrit les gates CI qui empêchent toute régression i18n dans Nafura ERP.
> Elle est la **référence opérationnelle** pour les devs : workflows déclenchés, scripts locaux, manière de ratcheter.
> Pour la philosophie du chantier, les règles d'écriture des clés et les interdits, lire d'abord :
> - [`AGENT_RULES.md`](./AGENT_RULES.md)
> - [`GLOSSARY.md`](./GLOSSARY.md)
> - [`00-PROGRESS.md`](./00-PROGRESS.md) (source unique de vérité)

---

## 1. Vue d'ensemble — 3 workflows bloquants

Tous les workflows tournent sur Ubuntu 20.x, Node 20, et limitent leurs triggers
au sous-arbre `web/**` pour ne pas spammer les PRs backend.

| Workflow (fichier) | Quand il tourne | Quoi il vérifie | Comportement |
|---|---|---|---|
| **`web-i18n-parity.yml`** | push/PR sur `web/**` | `npm run i18n:check` — parité stricte FR↔EN sur tous les packs JSON | Échoue si une clé FR est absente en EN (et vice-versa), ou si un JSON est malformé. |
| **`web-i18n-no-hardcoded.yml`** | push/PR sur `web/**` | `npm run i18n:hardcoded:ratchet` — compare le scan ESLint courant à `web/eslint-rules/baseline.json` | Échoue si total findings > baseline + tolerance (5). |
| **`web-i18n-extractor-tests.yml`** | push/PR sur `web/scripts/extract-i18n*` | `npm run i18n:extract:test` — Node test runner sur 14 specs | Échoue si le scanner AST casse (détection texte, attributs, toasts, `*_LABELS`, heuristique FR, …). |

Les 3 workflows sont **indépendants** et **parallélisables** : aucun ne dépend de l'autre.

---

## 2. Pattern ratchet — comment ça marche

### Principe

La règle `no-hardcoded-string` retourne aujourd'hui **~3 916 warnings**, dont la
majorité (~85 %) sont des faux positifs Angular control-flow (`@if`/`@for`/`@else`),
des noms d'icônes Material (`<mat-icon>delete</mat-icon>`), des codes courts
(`"Code"`, `"Total"`, `"Lot"`), etc. Migrer les ~600 derniers vrais hardcoded
strings restants demanderait un effort disproportionné par rapport au gain.

**Solution** : un compteur sérialisé dans `web/eslint-rules/baseline.json` qui
fait office de **plafond** pour la CI. À chaque PR :

1. Le scanner standalone (`web/eslint-rules/scan-baseline.js`) est ré-exécuté.
2. Le total de findings est comparé à `baseline.totalFindings + tolerance`.
3. Si la PR ajoute des hardcoded strings → CI rouge.
4. Si la PR en supprime → CI verte + invitation à ratcheter à la baisse.

### Tolerance (`= 5`)

Une bande de **+5 findings** est tolérée pour absorber des cas d'ajustement
mineur (ajout d'un `@if` Angular qui crée 1 faux positif, copier-coller d'un
component existant, etc.). **Ne JAMAIS** augmenter cette tolérance pour cacher
une régression : si une PR ajoute 10 vrais hardcoded strings, migrez-les vers
`| translate`.

### Ratcheter à la baisse — workflow recommandé

Après avoir migré du code et **réduit** le nombre de findings :

```bash
cd web
npm run lint:no-hardcoded-string             # voir le compteur courant
npm run i18n:hardcoded:snapshot              # met à jour baseline.json
git add web/eslint-rules/baseline.json
git commit -m "i18n(<phase>.<tâche>): ratchet baseline X → Y findings"
```

Le script `i18n-hardcoded-snapshot.mjs` est **idempotent** : si rien n'a changé,
le fichier est réécrit à l'identique.

### Comment lire l'output ratchet

```
═══════════════════════════════════════════════════════════════
  i18n no-hardcoded-string RATCHET
═══════════════════════════════════════════════════════════════
  Baseline      : 3916 findings (updated 2026-05-27)
  Current scan  : 3916 findings
  Delta         : ±0 (tolerance = 5)
  Threshold     : ≤ 3921 to pass

  By category:
    inline_template_text     1661  →   1661   (±0)
    ts_literal_label         1286  →   1286   (±0)
    html_attribute_text       969  →    969   (±0)

✅ OK — baseline unchanged.
```

- `inline_template_text` : strings dans les templates Angular inline (`@Component({ template: \`...\` })`).
- `ts_literal_label` : props TS (`label:`, `title:`, …) + `toast.*` + `confirm/alert` + `throw new Error` + `*_LABELS`.
- `html_attribute_text` : strings dans les fichiers `.html` externes (text + attributs + bindings).

---

## 3. Workflow recommandé pour les devs — avant de pusher

```bash
cd web

# 1. Parité FR/EN (gate 1)
npm run i18n:check

# 2. Scanner local (gate 2 — le ratchet le ré-exécute en CI)
npm run i18n:hardcoded:ratchet

# 3. Si tu as ajouté un fichier `web/scripts/extract-i18n*` (gate 3)
npm run i18n:extract:test

# 4. (optionnel mais recommandé) compile TS pour catch les erreurs typage
npx tsc --noEmit
```

Si l'étape 1 échoue : ouvrir la sortie pour voir quelle clé est manquante.
Pour ajouter une clé dans un nouveau pack : créer le pair `fr/<module>.json` +
`en/<module>.json` dans `web/public/assets/i18n/applications/erp/<module>/`,
brancher dans `web/app/applications/i18n.generated.ts`, puis re-runner la
validation. Le check est automatique sur **tous** les packs détectés.

Si l'étape 2 échoue : voir [§ 2 ci-dessus](#2-pattern-ratchet--comment-ça-marche).

---

## 4. Ajouter un nouveau pack JSON dans la parité

Le check parité (`scripts/check-i18n-parity.mjs`) scanne **automatiquement**
toute paire `fr.json` / `en.json` placée sous `web/public/assets/i18n/**`. Pas
de configuration manuelle requise.

Pour qu'un nouveau pack soit également **chargé runtime** par l'application,
il faut le brancher dans `web/app/applications/i18n.generated.ts` (cf.
PR #5, Phase 0.4). Sinon le pack reste « inerte » : la parité sera vérifiée,
mais aucune clé ne sera disponible via `| translate`.

### 4.bis Cognates FR/EN auto-whitelistés (Phase 5.3 / Wave E2)

Le validateur reconnaît automatiquement comme légitimes :

1. **Les acronymes BTP-MA** (`ICE`, `RIB`, `CNSS`, `TVA`, `MAD`, `DGD`,
   `OS`, etc.) — set `ACRONYM_WHITELIST` dans
   `scripts/check-i18n-parity.mjs`.
2. **Les codes alphanumériques majuscules** (`BC-2024-001`, `ABC_42`) —
   regex `ACRONYM_LIKE_RE`.
3. **Les cognates FR/EN** dont l'orthographe est strictement identique
   (`Code`, `Type`, `Notes`, `Date`, `Email`, `Description`,
   `Configuration`, `Total`, etc.) — set `COGNATE_WHITELIST` (~150 entrées,
   case-insensitive). Documentés dans
   [`GLOSSARY.md` § 21.1](./GLOSSARY.md#211-cognates-standalone--cognate_whitelist-extrait-représentatif).
4. **Les libellés multi-mots PascalCase** générés depuis des entités Java
   (`Item Id`, `Stock Balances`, `Effective Date`, `Cost Center Id`,
   `Inventory Tx Lines`, `Approved By`, `Fiscal Years`…) — chaque token
   doit appartenir à `COGNATE_WHITELIST` ∪ `MULTIWORD_TECH_TOKENS`
   (~400 entrées). Documentés dans
   [`GLOSSARY.md` § 21.3](./GLOSSARY.md#213-vocabulaire-multi-mots-pascalcase--multiword_tech_tokens).
5. **Les caractères de typographie pure** (em-dash `—`, ellipsis `…`,
   ponctuation ASCII, flèches `↻ ↺`) — regex `PUNCTUATION_LIKE_RE`.
6. **Les placeholders i18n** (`{count}`, `{n}`, `{{value}}`, `{ICE}`) —
   regex `PLACEHOLDER_RE`.

**Sont volontairement EXCLUS** de la whitelist (= restent signalés et
doivent être traduits) : `Cities` / `Villes`, `Companies` / `Sociétés`,
`Currencies` / `Devises`, `Country` / `Pays`, `Society` / `Société`,
`Market` / `Marché`, `Beneficiary` / `Bénéficiaire`, tout mot FR avec
accent (`Référence`, `Société`, `Bénéficiaire`, `Catégorie`, …).

#### Quand contribuer un nouveau cognate

Si `npm run i18n:check` flagge des libellés que tu juges légitimes :

1. **Vérifier l'orthographe FR/EN** : strictement identique (mêmes lettres,
   mêmes accents) ? Si oui → cognate candidat. Si l'EN a un autre mot que
   le FR correct (ex : `Currency` vs `Devise`), c'est un **vrai cas à
   traduire**, pas un cognate.
2. **Standalone vs multi-mots** : si le mot apparaît seul (`Foo`),
   l'ajouter à `COGNATE_WHITELIST`. S'il n'apparaît que comme token d'un
   libellé composé (`Foo Number`), l'ajouter à `MULTIWORD_TECH_TOKENS`.
3. **Tester** : `node --test scripts/check-i18n-parity.spec.mjs` + `npm
   run i18n:check`. Le total `Identical FR/EN suspect` doit baisser, jamais
   monter.
4. **Documenter** dans [`GLOSSARY.md` § 21](./GLOSSARY.md#21-cognates-fren-whitelistés-validateur-de-parité--phase-53--wave-e2)
   (ajouter une ligne dans 21.1 ou 21.3) **dans la même PR**.

---

## 5. Triggers détaillés des workflows

| Workflow | `push` paths | `pull_request` paths |
|---|---|---|
| `web-i18n-parity.yml` | `web/**`, lui-même | idem |
| `web-i18n-no-hardcoded.yml` | `web/**`, lui-même | idem |
| `web-i18n-extractor-tests.yml` | `web/scripts/extract-i18n*`, lui-même | idem |

Les deux premiers se déclenchent sur **toute** modification du web (large
maille, le coût CI est très faible : `npm ci` + scan en < 2 min). Le troisième
est étroit pour ne pas tourner inutilement sur chaque PR de migration de
module.

---

## 6. Que faire si la CI casse

| Erreur | Cause probable | Fix |
|---|---|---|
| `i18n:check` reports **X ERRORS — missing keys** | Clé FR ajoutée sans EN correspondante | Ajouter la clé dans le pack `en/*.json` correspondant (utiliser le glossaire BTP MA). |
| `i18n:check` reports **JSON parse error** | Virgule manquante, accolade mal fermée | Ouvrir le fichier dans VSCode, JSON Lint, fixer. |
| `i18n:hardcoded:ratchet` reports **REGRESSION DETECTED** | Ta PR a ajouté ≥ 6 findings | Lancer `npm run lint:no-hardcoded-string` localement, repérer les nouveaux findings (top files / top kinds), les migrer vers `\| translate` ou `translate.instant()`. Si vraie exception → `// @i18n-exempt: <raison>`. |
| `i18n:extract:test` reports **N tests failed** | Tu as modifié `scripts/extract-i18n.mjs` et cassé l'AST detection | Lire les specs `scripts/extract-i18n.spec.mjs` pour comprendre quel pattern est cassé, fixer. |

**Ne JAMAIS** :
- ❌ commenter le job CI pour faire passer la PR ;
- ❌ bumper `baseline.json` à la main pour cacher une régression ;
- ❌ taguer ton fichier en `// @i18n-exempt` sans raison documentée ;
- ❌ supprimer une clé EN sans vérifier qu'elle est orpheline (cf. AGENT_RULES.md § 3).

---

## 7. Évolutions futures (Round 2+)

- Ajouter un gate **`ng lint --rulesdir eslint-rules`** quand la pipeline Angular sera
  prête (aujourd'hui on utilise le scanner standalone `scan-baseline.js`).
- Étendre la parité au pack AR quand Round 2 démarre (Phase 6).
- Coverage badge i18n par module dans le README (Phase 5.2 — backlog si pas livré
  initialement par Wave E).

---

> Maintenu par les agents Cursor. Modifs uniquement dans le cadre d'une PR i18n.
