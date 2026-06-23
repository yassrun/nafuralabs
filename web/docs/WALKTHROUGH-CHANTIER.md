# Parcours bout-en-bout — Création & exécution d'un chantier

> Simulation « société réelle » : créer un chantier et dérouler toutes les opérations jusqu'à clôture.
> Date 2026-06-17. Je pilote l'app moi-même et je note ce qui marche / casse / manque à chaque étape.
> Légende : ✅ OK · ⚠️ friction UX · 🐞 bug · ❌ bloquant · 🕳️ feature manquante

## Scénario
Société : « BTP Démo Sektor ». Objectif : créer un chantier, le structurer (lots/phases), budgéter, saisir l'avancement, produire une situation de travaux, facturer, encaisser, clôturer.

## Journal des étapes

### 🔴 BLOQUANT #1 — Gel du rendu par l'API View Transitions (cause racine)
**Constat :** des gels du rendu (de ~30s jusqu'au blocage total) surviennent sur les transitions/interactions : changement d'étape du wizard, changement d'onglet, et surtout au clic **« + Ajouter un lot »** qui a **figé toute l'app de façon irrécupérable** (clic, JS, screenshot et même reload via l'extension finissent en timeout).
**Console :** exception récurrente `InvalidStateError: Transition was aborted because of invalid state`.
**Cause racine (code) :** `app/app.config.ts:142` → `withViewTransitions()` active l'API View Transitions du router. Quand une nouvelle transition démarre avant la fin de la précédente (nav rapide, ouverture d'overlay), l'API lève `InvalidStateError` et le rendu se bloque.
**Reco :** retirer `withViewTransitions()` (fonctionnalité expérimentale, instable ici) — ou l'envelopper dans un guard qui annule proprement la transition en cours. **Une ligne, faible risque, fort impact** : c'est très probablement la source de la quasi-totalité de la jank observée dans l'app.
**Impact test :** bloque la suite du parcours (lots → budget → situations → facture → encaissement) tant que ce n'est pas corrigé.
**✅ CORRIGÉ (feu vert utilisateur)** : `withViewTransitions()` retiré de `app.config.ts` (+ import nettoyé). À confirmer après rebuild.

### 🟠 SYSTÉMIQUE #2 — Interpolation i18n cassée partout (`{{param}}` vs MessageFormat)
**Constat :** « Étape {1} / {5} » et « {CH-2026-004} » dans le wizard = symptôme d'un bug global. L'app utilise le compilateur **MessageFormat** (accolades simples `{param}`), mais **363 paramètres** de traduction, sur **24 fichiers**, étaient écrits en double-accolade `{{param}}` (`{{count}}`×90, `{{name}}`×60, `{{numero}}`×36, etc.). MessageFormat les rend avec les accolades littérales → texte cassé partout où une traduction a un paramètre (compteurs, noms, numéros…).
**✅ CORRIGÉ** : conversion globale `{{param}}` → `{param}` sur les 183 fichiers i18n (blocs ICU `{x, plural…}` non touchés ; tous les JSON revalidés). À confirmer visuellement après rebuild.

### 🔴 BLOQUANT #3 — Popups natives (`window.prompt/confirm`) au lieu de `nf-modal` (systémique)
**Constat :** « Ajouter un lot » ouvrait une **popup navigateur native** (`window.prompt`), qui **bloque le thread JS** (d'où le faux « gel »). Sur le fond, c'est incohérent avec le design system : ces dialogues doivent passer par un `nf-modal`. **~20 occurrences** dans l'app (`window.prompt/confirm/alert`), dont le générique `entity-detail.component.ts` (impact large).
**Service existant :** `ConfirmDialogService.confirm()` existait (modal Material) mais **aucune** variante « prompt » (saisie).
**✅ CORRIGÉ (référence) :**
- Nouveau composant DS `nf-prompt-dialog` (`platform/lib/anatomy/.../organisms/prompt-dialog`) — N champs texte, retourne les valeurs.
- Nouvelle méthode `ConfirmDialogService.prompt(options)`.
- `chantier-detail` : `addLot` (2 prompts → 1 modal code+désignation) et `deleteChantier` (confirm natif → `confirm()` DS, variante danger) recâblés. i18n fr/en ajoutée (ar : clés parentes absentes au préalable, à compléter via `i18n:ar:placeholders`).
**🕳️ Reste à faire (backlog mécanique, même pattern) :** remplacer les ~18 autres natifs :
`platform/lib/anatomy/.../entity-detail` (confirm générique, prioritaire), `platform/core/guards/unsaved-changes.guard`, `notification-center`, doc-extractor (field/layout editors) ; ERP : `chantiers/avancement-saisie` + `chantiers/planning` (confirm), `chantiers/situations/situation-detail` (prompt), `finance/{rapprochement,reglement-saisie,virement-detail,plan-comptable,factures-fournisseurs}`, `achats/{ao-comparatif,ao-detail,demande-detail}`, `approbations/inbox`, `etudes/devis-detail`, `rh/conge-detail`, `ventes/facture-detail`.

### ✅ Vérifié après rebuild
- Bloqueur View Transitions levé : navigation/onglets fluides, plus de gel.
- Wizard : « Étape 1 / 5 » et « CH-2026-004 » s'affichent correctement (plus d'accolades).
- **Ajout de lot via la nouvelle modale `nf-prompt-dialog`** : ouvre la modale (titre « Ajouter un lot », champs code + désignation), crée le lot (L01 « Gros œuvre »), toast « Lot ajouté ». Plus de popup native, plus de gel. ✅

### 🟠 Étape 2 — Situation de travaux : chaîne interrompue (marché non lié)
**Constat :** onglet Situations → « **Aucun marché lié à ce chantier dans la démo — liaison requise pour la génération** ». Le wizard de création capture « N° marché / référence » comme **simple chaîne**, sans créer ni lier une entité **Marché (contrat)**. Or la génération de situation exige un marché lié → **la chaîne chantier → situation → facture → encaissement est bloquée** pour un chantier créé via le wizard.
**Reco :** soit le wizard crée/relie un vrai marché, soit proposer une action « Lier un marché » sur le chantier. À investiguer côté module Marchés.

### 🔴 MUR DE WORKFLOW — Impossible de relier/créer un marché (chaîne facturation bloquée)
**Constat :** la génération de situation exige un marché lié. Or :
- La liste **Marchés & Contrats** (`/marches/contrats`) n'a **aucun bouton de création** (seulement « Réinitialiser » / « Exporter »). Aucune route/page de création de contrat trouvée dans le code (`marches/contrats`).
- Le wizard chantier ne crée pas d'entité marché (juste un n° en texte).
→ Un chantier créé via le wizard **ne peut pas** obtenir de marché lié par l'UI → situations/factures/encaissement inaccessibles. **Trou fonctionnel structurel** sur le fil roi.
**Reco :** ajouter une création de contrat (depuis le module Marchés et/ou une action « Lier un marché » sur le chantier, et/ou conversion depuis un devis/appel d'offres).
**✅ CONSTRUIT (feu vert) :** bouton **« Créer le marché »** sur l'onglet Situations (état sans marché) → `creerMarche()` crée+lie un marché **prérempli depuis le chantier** (numéro = marcheReference ou `MAR-<code>`, intitulé, client, montant HT, TVA, RG 7%, dates, statut `EN_EXECUTION`) via `contratApi.create({chantierId,...})`, puis recharge `marchesCache`. L'API/back supportaient déjà la création+liaison ; seul l'UI manquait. i18n fr/en ajoutée. À tester après rebuild → doit débloquer la génération de situation.

### 🐞 BUG — « [object Object] » dans les badges de comptage (listings Marchés)
**Constat :** `<span class="count">[object Object]</span>` sur `/marches/contrats`. Source : `{{ 'marches.contrat.listing.count' | translate:{count:...} }}` où la clé i18n était stockée en **objet** `{one:'{count} marché', other:'{count} marchés'}` au lieu d'une **chaîne ICU MessageFormat**.
**✅ CORRIGÉ :** 12 clés `count` converties en `"{count, plural, one {# marché} other {# marchés}}"` (fr/en/ar), JSON revalidés. (Les autres objets type `notationOptions` — non-pluriels — laissés intacts.) À confirmer après rebuild.

### ✅ Étape 3 — Marché + génération de situation (débloqué)
- **« Créer le marché »** (feature construite) : modale de confirmation (message interpolé OK), toast « Marché créé et lié au chantier », l'état « aucun marché » disparaît, le CTA « Générer situation » apparaît. ✅ Chaîne rétablie.
- **« Générer situation N (brouillon) »** : calcule un brouillon avec la bonne structure métier (Travaux période HT, Révision K, Pénalités, **RG 7%**, Net HT, **TVA 20%**, Net TTC). Montants à 0 car avancement 0% — cohérent.
- ℹ️ L'aperçu inline est un **calcul de démo** (libellé « Task 07 M-MAR-05, démo »), non persisté. Les situations réelles se créent dans le module **Situations** (`/chantiers/situations`). Pour des montants ≠ 0 : saisir d'abord l'**avancement physique** sur les lots.

### 🐞 BUG mineur — icône `file-plus` affichée en texte
Sur les `nf-button` avec `icon="file-plus"` (CTA « Générer situation » existant **et** mon « Créer le marché »), le nom « file-plus » s'affiche **en toutes lettres** au lieu du glyphe lucide → l'icône n'est pas enregistrée dans le set du composant bouton (`atoms/button`). Cause réelle : `iconLibrary` du `nf-button` défaut = **`material`** ; les boutons avec un nom **lucide** (`file-plus`) sans `iconLibrary="lucide"` tombent en `<mat-icon>` → la ligature Material n'existe pas → le nom s'affiche en texte.
**✅ CORRIGÉ :** `iconLibrary="lucide"` ajouté aux 3 `nf-button` `file-plus` (chantier-detail ×2, metre-dpgf ×1).
🕳️ **Backlog (systémique) :** sur 74 boutons avec `icon=`, seuls 25 settent `iconLibrary="lucide"`. Auditer les ~49 restants : ceux avec un nom lucide (kebab non-Material) sont cassés de la même façon. Reco : soit passer le défaut à `lucide`, soit ajouter `iconLibrary` au cas par cas.

### ✅ Nettoyage accents i18n (hardcodés)
Corrigé : « Lots a saisir » → « Lots à saisir » (avancement-saisie), « Reinitialiser » → « Réinitialiser » (avancements-listing), « Rafraichir » → « Rafraîchir » et « Aucun avancement sur la periode » → « …période » (config avancements). 🕳️ Backlog : ces libellés sont **hardcodés** (violation i18n) — à externaliser en clés de traduction.

### ⏭️ Étape 4 — Avancement physique (à poursuivre)
Page `/chantiers/avancements/saisie` (« Saisie d'avancement » / « Lots à saisir », champ Date). Attend un contexte chantier pour lister les lots et saisir l'avancement → alimente une situation à montants réels. **Prochaine étape du parcours.**
Petits détails i18n notés sur `/chantiers/avancements` : « Reinitialiser » (sans accent) en double avec « Réinitialiser », « Rafraichir » et « Lots a saisir » (accents manquants).

### Reste à parcourir pour boucler le fil roi
Avancement physique → situation réelle (persistée, module Situations) → **facture** → **encaissement** → clôture chantier. (Le calcul de situation et la structure financière sont déjà validés ; reste à dérouler la persistance et la facturation.)

### 🟠 Étape 4 — Avancement : dépendance manquante (lots sans quantité/prix)
La saisie d'avancement fonctionne (sélecteur chantier, lot L01 chargé, champ Cumul U). MAIS saisir 50 U donne « Avancement 0 % » + warning « Le cumul dépasse… » car **le lot n'a pas de quantité totale** : il a été créé avec **seulement code + désignation** (ma modale ET l'ancien `window.prompt` ne capturent ni quantité, ni unité, ni prix unitaire).
**Conséquence :** sans BPU/DPGF (quantité × prix) sur les lots, l'avancement ne se valorise pas → **la situation reste à 0 MAD**. C'est la dernière dépendance du fil roi.
**Reco :** enrichir la création/édition de lot (quantité, unité, prix unitaire HT) — soit étendre la modale « Ajouter un lot », soit une page d'édition de lot / import DPGF. Ensuite : avancement → situation valorisée → facture → encaissement deviennent testables.
**Note infra :** l'app est une **PWA (service worker ngsw)** → après un rebuild, les assets (JS, i18n) peuvent être servis depuis le cache du SW pendant 1-2 reloads (mes fixes texte « Lots à saisir » / icône peuvent ne pas apparaître immédiatement). Pour vérif fiable : recharger 2×, ou désactiver le SW en dev.

### ✅ Après implémentation backlog par Cursor — chaîne débloquée
Vérifié en live :
- **P0-1 (lots BPU) fait** : la modale « Ajouter un lot » capture désormais **Quantité (BPU)**, **Unité**, **Prix unitaire HT**. Lot L10 « Fondations » 1000 m³ × 1500 = colonne **Montant HT** renseignée.
- **Avancement valorisé** : saisie 400 m³ sur L10 → **0 % → 40 %** calculé correctement (débloqué par P0-1). Validation via **modale de confirmation DS** (« Valider 1 lot ? 0 % → 40 % ») — plus de popup native (P1-1 en place ici). Toast « 1 lot validé ».
- **Fixes de nettoyage live** : « Lots à saisir », « Rafraîchir », « …période » accentués (SW à jour).
- **Vraie fiche situation** (`/chantiers/situations/new`) bien structurée : en-tête, **Lots & avancement cumulé** (Qté tot./préc./cumul, %, PU, Cumul HT), **Décompte** (Travaux période HT, RG 7 %, Résorption avance, TVA 20 %, Net à payer HT/TTC), bouton **« Reprendre depuis avancements »**.

### ⚠️ Nuance UX situation — pré-remplissage
Sélectionner le chantier seul **ne pré-remplit pas** les lignes (« Aucun lot — sélectionnez un chantier… » persiste). « Reprendre depuis avancements » ne tire rien tant que les champs **Période début/fin** sont vides (la reprise filtre par période). Reco : pré-remplir la période par défaut (mois courant) et/ou déclencher la reprise à la sélection du chantier. Reste ensuite : compléter période → reprendre → valider situation → **facture → encaissement** (drivable manuellement ; mon automatisation bute sur les datepickers Material).

### Étape 1 — Création du chantier (wizard 5 étapes) ✅ fonctionne
Parcours : Liste chantiers → « + Nouveau chantier » → assistant 5 étapes → chantier créé (CH-2026-004 « Résidence Al Manar », 5 M MAD). Bons champs métier BTP : identité → client/marché (MOA/MOE/BET, privé/public CCAG) → localisation/dates → finances (montant HT, TVA, retenue garantie, RAS, avance) → équipe/cautions.

Findings :
- 🐞 **Interpolation cassée dans le wizard** : « Étape **{1} / {5}** » et « Code chantier prévu : **{CH-2026-004}** » — les accolades s'affichent littéralement sur **toutes** les étapes. Binding i18n/template à corriger. _(Très visible, première impression du workflow le plus important.)_
- 🐞 **Gel transitoire ~30s** à chaque changement d'étape : exception console `InvalidStateError: Transition was aborted because of invalid state` (animation de route). Le rendu se fige le temps de la transition. À investiguer (probablement BrowserAnimations sur le wizard).
- ⚠️ **Aucun toast de confirmation** après « Créer le chantier » : redirection silencieuse vers le détail, pas de feedback explicite « Chantier créé ».
- 🕳️ **Client obligatoirement pré-existant** : pas de création de client inline dans le wizard (seulement « Voir les clients »). Pour une société qui démarre de zéro, il faut d'abord créer un client ailleurs → friction de premier usage.
- ✅ Validation, navigation Précédent/Suivant, option « Brouillon », et calcul du prochain code (CH-2026-004) fonctionnent.

---

