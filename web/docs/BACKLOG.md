# Nafura Sektor — Backlog d'exécution (prêt pour agent / Cursor)

> **Roadmap produit complète (ERP BTP agentique) :** [`ROADMAP-AGENTIC-BTP-ERP.md`](./ROADMAP-AGENTIC-BTP-ERP.md).
>
> Backlog consolidé issu de l'audit + du parcours bout-en-bout (2026-06-17).
> Format pensé pour exécution par un agent : chaque ticket est autonome (fichiers, problème, fix attendu, critères d'acceptation).
> Détails/contexte : voir `UX-FEATURE-AUDIT.md` et `WALKTHROUGH-CHANTIER.md`.
>
> **Règles transverses :** composants `nf-` (anatomy) avant HTML brut ; tokens `--nf-*` avant couleurs en dur ; un seul système d'icônes (lucide via `iconLibrary="lucide"`) ; zéro chaîne en dur (i18n fr/en/ar) ; pas de `window.prompt/confirm/alert`.
> **Gates par PR :** `npm run lint`, `npm run i18n:check`, `npm run build:prod`, `npm run e2e:a11y`.
> **Note PWA :** service worker (ngsw) — recharger 2× après build pour voir les changements d'assets.

---

## ✅ Déjà fait (ne pas refaire — contexte)

- Rebrand **Nafura Sektor** : cobalt `#1B3FAE` + jaune `#F2D544` → `app/applications/erp/styles/brand-sektor.scss` (+ index.html, theme.service, manifest, i18n title, favicon SVG, glyphe sidebar).
- Bloqueur **gel du rendu** : `withViewTransitions()` retiré de `app/app.config.ts`.
- **i18n interpolation** : 363 params `{{x}}` → `{x}` (MessageFormat) ; 12 pluriels `count` objet → ICU string. JSON revalidés.
- **Popups → DS** : nouveau `nf-prompt-dialog` (`platform/lib/anatomy/components/organisms/prompt-dialog`) + `ConfirmDialogService.prompt()`. Appliqué à `chantier-detail` : `addLot`, `deleteChantier`.
- **Feature** : action « Créer le marché » sur `chantier-detail` (préremplie depuis le chantier) → débloque situations.
- **Contraste** : badge statuts (fg → stop -700), bouton danger (bg → danger-600). 
- **Icône** : `iconLibrary="lucide"` ajouté aux 3 `nf-button` `file-plus`.
- **Accents** : « Lots à saisir », « Réinitialiser », « Rafraîchir », « …période » (module avancements).

---

## P0 — Bloquant / fil roi

### P0-0 — Situation /new : pré-remplissage des lignes inopérant (bloque facture/encaissement)
- **Constat (live) :** sur `/chantiers/situations/new`, sélectionner le chantier **ne charge pas** les lots, et « Reprendre depuis avancements » **ne fait rien** (ni lignes, ni toast), alors que l'avancement est bien persisté (lot L10 = 40 %, vérifié).
- **Cause racine :** `applications/erp/pages/chantiers/situations/situation-detail/situation-detail.page.ts:167` — `handleCustomAction` traite `reprendre_avancements` **uniquement si `event.item` existe** et lit `item.chantierId`. En création (`/new`), `item` n'est pas encore persisté → handler ignoré.
- **Fix :** en mode création, utiliser le **chantierId sélectionné dans le formulaire** (pas `item.chantierId`), et déclencher le pré-remplissage **à la sélection du chantier** (et/ou autoriser « Reprendre » sans `item`). Préremplir aussi la **période** par défaut (mois courant). Réutiliser `situation.facade.loadLots(chantierId)` (qui renvoie `avancementPercent`, `quantite`, `prixUnitaireHt`).
- **Acceptation :** créer une situation de zéro pour CH-2026-004 → les lignes se remplissent (L10 : 400 m³ × 1500 = 600 000 HT), Décompte calcule RG/TVA/Net. Ensuite `emettreFacture()` puis `marquerPayee()` (déjà au facade) → **facture → encaissement** testables de bout en bout.
- **Note :** le facade `situations/services/situation.facade.ts` expose déjà `loadLots`, `emettreFacture`, `marquerPayee` — la tuyauterie aval existe.
- **MAJ après 1er fix redéployé :** le garde `&& item` est levé ✅ (le handler `reprendre_avancements` se déclenche en création, appelle bien `GET /api/v1/chantiers/ch-004/lots`). **Nouveau bug :** `loadLots` → `lotApi.listByChantier()` **échoue à l'exécution** (toast « Impossible de charger les lots du chantier ») alors que la **même méthode fonctionne** depuis `chantier-detail.page.ts:535`. À investiguer en DevTools : (1) **statut du GET** lots (seul l'OPTIONS 200 capté — si 401, token d'auth non attaché dans ce contexte) ; (2) erreur console **`NG0203`** (« inject() must be called from an injection context ») → s'assurer que la reprise s'exécute **dans le contexte d'injection Angular** (`runInInjectionContext`, ou via signal/effect, pas un callback détaché). Une fois `loadLots` OK → lignes valorisées (L10 600 000 HT) → `emettreFacture()` → `marquerPayee()` → clôture.
- **ROOT CAUSE DÉFINITIF (diagnostic live confirmé) :** le handler `reprendre_avancements` s'exécute **hors contexte d'injection Angular** (console : `NG0203` « inject() must be called from an injection context »). Conséquence : l'appel `listByChantier` part **sans passer par l'intercepteur HTTP d'auth** → requête **sans token** → **401** → toast « Impossible de charger les lots ». La même méthode marche depuis `chantier-detail` car appelée dans un contexte DI valide (constructeur/effect). **Fix :** exécuter la reprise dans le contexte d'injection — méthode de composant normale dans la zone Angular, ou `runInInjectionContext(this.injector, () => this.crud.loadLots(chantierId))`. Vérifier que l'**access token** (et non l'`id_token`) est attaché pour `/api/v1/chantiers/{id}/lots`.


### P0-1 — Lots : capturer quantité + unité + prix unitaire (BPU/DPGF)
- **Pourquoi :** sans quantité/prix sur les lots, l'avancement ne se valorise pas → situations à 0 MAD. Bloque facturation.
- **Fichiers :** `applications/erp/pages/chantiers/chantier-detail/chantier-detail.page.ts` (`addLot`), service `chantier-lot-api.service.ts`, modèle lot.
- **Fix :** étendre la création/édition de lot pour saisir `quantite`, `unite`, `prixUnitaireHt` (modale dédiée ou page d'édition de lot ; idéalement import DPGF). Vérifier que l'API `createForChantier`/update accepte ces champs.
- **Acceptation :** créer un lot avec quantité+prix ; saisir un avancement ; la situation générée affiche un Net HT ≠ 0 cohérent.

### P0-2 — Mouvements de stock non implémentés
- **Fichiers :** `applications/erp/pages/inventory/mouvements/inventory-txes/inventory-tx/inventory-tx.page.ts` (scaffold `// TODO: implement masterSlave`).
- **Fix :** implémenter le pattern masterSlave (en-tête mouvement + lignes) avec les composants `nf-` (`nf-master-slave-shell`).
- **Acceptation :** créer/éditer un mouvement de stock multi-lignes, persisté.

---

## P1 — Majeur (UX / cohérence / features)

### P1-1 — Remplacer les ~18 popups natives restantes par le DS
- **Pourquoi :** `window.prompt/confirm/alert` bloquent le thread + incohérents. Service prêt (`ConfirmDialogService.confirm()/prompt()`).
- **Fichiers (prioriser le générique) :** `platform/lib/anatomy/components/organisms/entity-detail/entity-detail.component.ts` (confirm générique, impact large) ; `platform/core/guards/unsaved-changes.guard.ts` ; `platform/features/notifications/notification-center.page.ts` ; doc-extractor `field-editor`/`layout-editor`. ERP : `chantiers/avancements/avancement-saisie`, `chantiers/planning`, `chantiers/situations/situation-detail`, `finance/{rapprochement,reglement-saisie,virement-detail,plan-comptable,factures-fournisseurs/ff-detail}`, `achats/{appels-offres/ao-comparatif,ao-detail,demandes/demande-detail}`, `approbations/inbox`, `etudes/devis/devis-detail`, `rh/conges/conge-detail`, `ventes/factures/facture-detail`.
- **Acceptation :** `grep -rn "window\.(prompt|confirm|alert)\(" app/applications app/platform` → 0 (hors specs). Chaque action confirme/saisit via modale DS.

### P1-2 — Audit icône `nf-button` (Material vs lucide)
- **Pourquoi :** `iconLibrary` défaut = `material` ; ~49 boutons (sur 74) ne settent pas `lucide`. Ceux avec un nom lucide (kebab non-Material) rendent le nom en texte.
- **Fix :** option A (recommandée) passer le défaut de `iconLibrary` à `lucide` dans `atoms/button/button.component.ts` **et** auditer/corriger les boutons qui utilisaient un vrai nom Material ; option B ajouter `iconLibrary="lucide"` au cas par cas.
- **Acceptation :** aucun nom d'icône affiché en texte dans l'app ; captures des écrans clés OK.

### P1-3 — Création de contrat/marché dans le module Marchés
- **Pourquoi :** `/marches/contrats` n'a aucun bouton de création ; pas de route de création. Mon action sur le chantier est un minimum.
- **Fichiers :** `applications/erp/pages/marches/contrats/*`.
- **Fix :** ajouter une page/flux de création de contrat (numéro, intitulé, chantier, montant, BPU…), et/ou conversion depuis devis/appel d'offres.
- **Acceptation :** créer un contrat complet depuis le module Marchés ; il apparaît lié au chantier.

### P1-4 — Analytics : graphiques manquants
- **Pourquoi :** les 5 tableaux Analytics n'affichent que des stat-cards, aucun graphe/tendance/drill-down.
- **Fichiers :** `applications/erp/pages/analytics/tableau-*`.
- **Fix :** ajouter `nf-chart` (évolution temporelle, comparaison période, répartition), filtres période, export.
- **Acceptation :** chaque tableau affiche au moins un graphe pertinent alimenté par `AnalyticsApiService`.

### P1-5 — Catégories d'articles : treeEditor non implémenté
- **Fichiers :** `applications/erp/pages/inventory/configuration/item-categories/item-category/item-category.page.ts` (TODO).
- **Fix :** implémenter avec `nf-tree-editor`.
- **Acceptation :** créer/déplacer/supprimer des catégories en arbre, persisté.

### P1-6 — Externaliser les chaînes hardcodées en i18n
- **Exemples relevés :** module `chantiers/avancements` (titres, libellés boutons, états vides). Probablement ailleurs.
- **Fix :** remplacer les littéraux par des clés `translate` (fr/en/ar). S'appuyer sur `npm run lint:no-hardcoded-string`.
- **Acceptation :** le ratchet hardcoded-string baisse ; aucune chaîne FR en dur sur les écrans audités.

### P1-7 — Couverture de tests services métier + Storybook
- **Pourquoi :** ~53 specs unit / 216 composants ; ~57 tests back / 1617 fichiers ; 1 seule story Storybook.
- **Fix :** tests sur services critiques (calcul situations, facturation, retenue garantie, paie) ; stories pour atomes/molécules clés (button, input, select, badge, data-table, modal, prompt-dialog).
- **Acceptation :** couverture services critiques en hausse ; Storybook build avec stories des composants clés.

---

## P2 — Mineur / polish / bugs

### P2-1 — Wizard création chantier
- `chantier-create.page.ts` : ajouter un **toast de confirmation** après création (actuellement redirection silencieuse) ; envisager la **création de client inline** (aujourd'hui client pré-existant requis).

### P2-2 — i18n arabe incomplet
- Clés manquantes en `ar` (ex. `chantiers.chantier.detail.deleteConfirm`, `lots.promptCode`, et les `marche.*`/`deleteTitle` ajoutées en fr/en). Lancer/compléter `npm run i18n:ar:placeholders` puis traduire.

### P2-3 — favicon.ico vide
- `public/favicon.ico` = 0 octet. Générer un vrai `.ico` multi-tailles depuis `public/assets/branding/sektor-favicon.svg`.

### P2-4 — Finance : import BAM
- `finance/taux-change/services/taux-change-api.service.ts` : endpoint « à venir » → implémenter back + brancher.

### P2-5 — Cibles tactiles & micro-typo
- Topbar : boutons icônes 34px (porter à 40-44px sur tactile) ; libellés 10px (« Siège », initiales avatar) → 11px min.
- Détail chantier (hero) : grande zone vide à droite des KPI → rééquilibrer.
- Finance/journaux : panneau « Conversations » au placement discutable → revoir.

### P2-6 — Modules pilotage à valider
- `pilotage` / `pilotage-analyses` (LOC faible) : vérifier que ce sont de vrais tableaux de bord et non des squelettes.

---

## Ordre conseillé
P0-1 (lots BPU) → P1-1 (dialogs DS, generic d'abord) → P1-2 (icônes) → P0-2 (mouvements stock) → P1-4 (analytics) → P1-7 (tests) → P1-3/P1-5/P1-6 → P2.
