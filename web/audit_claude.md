# Audit UX & Fonctionnel — ERP BTP Maroc

> **Contexte** : Audit réalisé sur l'ERP en cours de développement (`localhost:4200`) avec données mockées. Objectif : produire une feuille de route actionnable pour finaliser le produit et le rendre concurrentiel sur le marché marocain face aux solutions existantes (Sage Maroc, Batigest, SAP B1, Odoo BTP).
> **Date** : 09/05/2026
> **Périmètre audité** : 13 modules visibles dans la sidebar (Tableau de bord, Chantiers, Achats, Stock, Matériel, Études, Marchés, Finance, RH, Qualité/HSE, Pilotage, Approbations, Administration).
> **Mode de lecture pour agent implémenteur** : Chaque finding a un ID (`F-XX`), une sévérité (P0/P1/P2/P3), un module concerné et une recommandation d'action explicite. Traiter les P0 en premier.

---

## 1. Résumé exécutif

### État de complétude par module

| Module | Routes existantes | Données | Verdict |
|---|---|---|---|
| Tableau de bord | OK | KPIs présents | **Squelette OK, à enrichir** |
| Chantiers — liste | OK | Mock CH-2025-XXX | **OK mais drill-down cassé** |
| Chantiers — détail | Existe | **Mock vide** | **CASSÉ : "Chantier introuvable" pour tout ID** |
| Chantiers — Planning | OK | Mock CH-2026-XXX | OK (Gantt) |
| Chantiers — Avancements | OK | Mock | OK |
| Chantiers — Situations | OK | Mock | **Currency $ au lieu de MAD** |
| Chantiers — Budget | OK | Mock CH-2026-XXX | OK |
| Chantiers — Sous-traitance | **404 fallback** | — | **Route absente** |
| Chantiers — Documents | **404 fallback** | — | **Route absente** |
| Achats — Demandes | OK | Mock CH-2026-XXX | OK |
| Achats — Appels d'offres | OK | Mock | OK |
| Achats — BC | OK | Mock | OK |
| Achats — Contrats fournisseurs | OK | Mock | OK |
| Achats — Fournisseurs | OK | Mock | OK |
| Stock & Logistique | **Redirect vers /** | — | **Module 100 % manquant** |
| Matériel — Parc | OK | Mock | **Clés i18n non traduites** |
| Matériel — Affectations | OK | Mock PROJ-2024-XXX | **3e format de chantier ID** |
| Matériel — Locations | Stub | "Vue provisoire" | **À compléter** |
| Matériel — Maintenance | **Redirect /materiel/parc** | — | **Manquant** |
| Matériel — Carburant | **Redirect /materiel/locations** | — | **Manquant** |
| Études — Bibliothèque prix | OK | Mock | **Currency $ au lieu de MAD** |
| Études — Métrés | OK | Mock | OK |
| Études — Devis | OK | Mock | **Currency $ au lieu de MAD** |
| Études — AO clients | OK | Mock | Currency unit absente |
| Marchés & Facturation | **Redirect vers /** | — | **Module 100 % manquant** |
| Finance — Journaux | OK | Mock | OK |
| Finance — Factures fournisseurs | OK | Mock | OK |
| Finance — Règlements | OK | Mock | OK (le mieux fait) |
| Finance — Caisses, Virements, Rapprochement, etc. | À vérifier | — | À auditer |
| RH — Employés | OK | Mock | OK |
| RH — Pointage | **Redirect vers /** | — | **Manquant** |
| RH — Planning équipes | À vérifier | — | À auditer |
| RH — Congés | À vérifier | — | À auditer |
| RH — Paie | OK | Mock | **Calcul retenues incohérent** |
| Qualité & HSE | **Redirect vers /** | — | **Module 100 % manquant** |
| Pilotage & Analyses | **Redirect vers /** | — | **Module 100 % manquant** |
| Approbations | **Redirect vers /** | — | **Module 100 % manquant** |
| Administration | **Redirect vers /** | — | **Module 100 % manquant** |

### Verdict global

**5 modules complètement absents** (Stock, Marchés, HSE, Pilotage, Approbations, Administration) sur 13 modules sidebar — soit **~38 %** de l'ERP qui n'existe pas encore au-delà du label. **Marchés & Facturation** est le plus critique car c'est l'un des cœurs business de l'ERP BTP.

Les modules existants ont un bon niveau de soin sur le **module Finance/Règlements** (référence à reproduire ailleurs), mais souffrent de **5 problèmes transversaux majeurs** : devise incohérente, IDs chantiers incohérents, drill-down cassé, i18n cassée par endroits, navigation enfants non câblée.

---

## 2. Problèmes BLOQUANTS (P0) — à corriger en priorité

### F-01 — [P0] Détail chantier toujours « Chantier introuvable »
- **Module** : Chantiers — fiche détail
- **Constat** : Toute URL `/chantiers/:id` (testée avec `CH-2025-001`, `CH-2026-001`) affiche le composant fiche chantier mais retourne **« Chantier introuvable — Le chantier demandé n'existe pas dans le mock courant. »**
- **Impact** : Aucun drill-down possible depuis la liste — l'utilisateur ne peut pas accéder au détail d'un chantier. C'est la fonctionnalité centrale d'un ERP chantier.
- **Action** : (1) Aligner les datasets mock pour que `MesChantiers` et `FicheChantier` partagent la même source ; (2) Corriger le service `ChantierService.getById(id)` qui ne retourne rien.

### F-02 — [P0] Lignes du tableau « Mes chantiers » non cliquables
- **Module** : Chantiers — liste
- **Constat** : DOM inspecté — les `<tr>` n'ont ni `routerLink` ni handler `(click)`. Le code `CH-2025-001` est rendu en `<strong class="code">` simple, pas en lien.
- **Impact** : Impossible de naviguer vers la fiche chantier depuis la liste (UX standard cassée).
- **Action** : Ajouter `[routerLink]="['/chantiers', chantier.code]"` sur chaque ligne ou au minimum sur le code/désignation. Ajouter un `cursor:pointer` et un état `:hover`.

### F-03 — [P0] Devise affichée en `$` au lieu de `MAD`
- **Modules** : `chantiers/situations`, `etudes/bibliotheque-prix`, `etudes/devis`
- **Constat** :
  - Situations : `$10,251,657.34`, `$4,712,929.82`
  - Bibliothèque de prix : `$28.60`, `$161.55`, `$8,551.44`
  - Devis : `$680,000.00`, `$3,850,000.00` alors que les en-têtes disent « Total HT (MAD) »
- **Impact** : **Crédibilité produit nulle** pour un ERP marocain. Risque commercial direct.
- **Action** : (1) Remplacer tout pipe Angular `currency` par un pipe global `mad` ou `currency:'MAD':'symbol-narrow':'1.2-2':'fr-MA'` ; (2) Centraliser dans un `LocaleService` ; (3) Fixer `LOCALE_ID` à `fr-MA` au bootstrap ; (4) Ajouter test e2e qui scanne le DOM pour `$` et fait échouer le build.

### F-04 — [P0] Trois formats de codes chantiers en parallèle (incohérence mock)
- **Modules** : transversal
- **Constat** :
  - `Mes chantiers` → `CH-2025-001` … `CH-2024-022`, ex. « Résidence Yasmine — Casa »
  - `Planning` → `CH-2026-001` … `CH-2026-006`, ex. « Residence Atlas R+5 »
  - `Achats / Demandes` → `CH-2026-001` … `CH-2026-005`, ex. « Résidence Les Acacias – Casablanca »
  - `Matériel / Affectations` → `PROJ-2024-001`, `PROJ-2024-002`
- **Impact** : (1) Impossible de croiser les données entre modules ; (2) Démos commerciales catastrophiques ; (3) Confusion totale lors du recoupement budget / engagements / situations.
- **Action** : Créer un **dataset mock unique** (`assets/mocks/chantiers.mock.ts`) consommé par tous les modules. Fixer une convention `CH-YYYY-NNN` unique. Reformuler tous les services mocks pour pointer vers cette source.

### F-05 — [P0] Routes `/chantiers/sous-traitance` et `/chantiers/documents` cassées
- **Module** : Chantiers
- **Constat** : Les liens sidebar pointent vers `/chantiers/sous-traitance` et `/chantiers/documents` mais les routes ne sont pas déclarées. Le routeur tombe sur la route paramétrée `/chantiers/:id` et affiche « Chantier introuvable ».
- **Impact** : 2 sous-modules sidebar inutilisables.
- **Action** : Déclarer ces routes **avant** la route `:id` dans le routing module, OU ajouter une garde qui rejette les paths réservés. Implémenter les composants associés (cf F-08).

### F-06 — [P0] Clés de traduction non résolues dans Matériel
- **Module** : Matériel — parc, maintenance
- **Constat** : Les en-têtes de colonnes affichent `inventory.materiel.fields.code`, `inventory.materiel.fields.designation`, `inventory.materiel.fields.famille`, `inventory.materiel.fields.marqueModele`, `inventory.materiel.fields.numeroSerie`, `inventory.materiel.fields.status`, `inventory.materiel.fields.chantierActuel`.
- **Impact** : Module visiblement cassé pour tout utilisateur — impression de produit incomplet.
- **Action** : Ajouter les entrées dans `assets/i18n/fr.json` (et `ar.json`, `en.json`). Ajouter un `MissingTranslationHandler` qui log en dev et qui escalade en CI.

### F-07 — [P0] Module Stock & Logistique 100 % absent
- **Module** : Stock
- **Constat** : `/stock`, `/stock/magasins`, etc. redirigent tous vers `/`. La sidebar Stock ne déploie aucun sous-item.
- **Impact** : Bloquant pour toute promesse de gestion des matériaux chantier (béton, fer, ciment, agrégats…), des transferts entre magasins, des inventaires, des ruptures.
- **Action** : Implémenter au minimum :
  - `/stock/magasins` (référentiel + capacités)
  - `/stock/articles` (référentiel articles + seuils min/max)
  - `/stock/mouvements` (entrées BL fournisseur, sorties chantier, transferts, retours)
  - `/stock/inventaires` (saisie inventaires, écarts)
  - `/stock/etat` (état stock par magasin/article avec valorisation PMP/FIFO)
  - `/stock/alertes` (sous-stock, péremption)
  - Lier sortie stock → consommation chantier (clé pour le contrôle budget vs réalisé).

### F-08 — [P0] Module Marchés & Facturation 100 % absent
- **Module** : Marchés & Facturation
- **Constat** : `/marches` et toutes ses sous-routes redirigent vers `/`. Le bouton sidebar ne déploie pas de sous-items.
- **Impact** : **Mort fonctionnel** — c'est ici que se gère le contrat client (le marché), les avenants, les factures de situation, les certificats de paiement, les retenues. Sans ce module, l'ERP n'est pas vendable au Maroc.
- **Action** : Implémenter au minimum :
  - `/marches/contrats` (marché initial, type forfait/BPU/régie/marché public)
  - `/marches/avenants` (avenants signés, en cours)
  - `/marches/factures` (factures clients, lien avec situations de travaux)
  - `/marches/cautions` (caution provisoire, définitive, retenue de garantie 7 % spécifique Maroc)
  - `/marches/penalites` (pénalités de retard, escomptes)
  - `/marches/revisions-prix` (formule de révision K = a + b·BTPxx + c·MOdéfini par le CCAG-Travaux marocain)
  - Spécifique Maroc : champs ICE client, IF, RC, Patente, RIB pour le décaissement, gestion de la TVA 20 % BTP et de la retenue à la source 5 % travaux fournis à l'État.

### F-09 — [P0] Module Pilotage / Approbations / Administration / Qualité-HSE absents
- **Modules** : 4 modules sidebar sans implémentation
- **Constat** : Tous redirigent vers `/`.
- **Impact** :
  - **Approbations** : workflow validation (DA, BC, factures, congés…) — sans ça, aucune gouvernance possible.
  - **Administration** : utilisateurs, rôles, permissions, paramétrage entreprise (logos, ICE, IF, exercices, banques), exercices comptables — c'est le **prérequis** à toute mise en production.
  - **Qualité & HSE** : non-conformités (NC), incidents/accidents, registres légaux marocains (DT, déclaration accidents CNSS), audits chantier — exigé par les MOA publics et grands MOA privés.
  - **Pilotage** : tableaux de bord consolidés, marge par chantier, exposition trésorerie — c'est le **différenciateur commercial** vs concurrents généralistes.
- **Action** : Au minimum stub avec écran « Module en cours d'implémentation » + ticket epic par module, mais surtout planifier :
  1. Administration (sécurité, rôles, sociétés multi-entité)
  2. Approbations (engine de workflow réutilisable)
  3. HSE (NC + incidents + registres)
  4. Pilotage (KPIs consolidés)

---

## 3. Problèmes MAJEURS (P1)

### F-10 — [P1] Pas de fil d'Ariane / breadcrumb dans plusieurs modules
- **Constat** : Les modules Achats, Études, Finance ne montrent pas systématiquement de breadcrumb. Quand il y a un breadcrumb (Matériel/Affectations), il est faux : « Stock & Logistique / Matériel & Équipements / Affectations chantier » alors que Matériel n'est pas un sous-module de Stock.
- **Action** : (1) Composant `<app-breadcrumb>` global piloté par `data: { breadcrumb }` du routing ; (2) Corriger la hiérarchie ; (3) Rendre les segments cliquables.

### F-11 — [P1] Recherche globale (Ctrl+K) non fonctionnelle
- **Constat** : Le bouton « Ouvrir la recherche » dans le header est cliquable mais n'ouvre aucun overlay/modal. Aucun raccourci `Ctrl+K` ne fonctionne.
- **Impact** : Promesse non tenue — un ERP avec 13 modules a impérativement besoin d'une command palette.
- **Action** : Implémenter une command palette (`@ngneat/hot-keys` ou `cdk-overlay`) qui indexe : pages, chantiers, BC, fournisseurs, factures. Pattern Linear/Notion.

### F-12 — [P1] Bouton « Notifications » sans contenu
- **Constat** : Click sur l'icône cloche → aucun panel n'apparaît.
- **Action** : Implémenter `NotificationCenterComponent` avec catégories (Approbations en attente, Échéances, Alertes budget, Alertes HSE, Saisies en retard).

### F-13 — [P1] Toggle de langue non fonctionnel
- **Constat** : Click sur « FR » → aucun menu déroulant (FR/AR/EN) ne s'affiche.
- **Impact** : L'AR est un must pour le Maroc (utilisateurs terrain : chefs de chantier, magasiniers).
- **Action** : (1) Implémenter le menu langue ; (2) Switch `LOCALE_ID` à chaud ; (3) Préparer le support RTL pour AR (`dir="rtl"` + classes Tailwind `rtl:`).

### F-14 — [P1] `<html lang>` à `"en"`, ce qui casse l'accessibilité
- **Constat** : `document.documentElement.lang === "en"` alors que toute l'UI est en français.
- **Impact** : Lecteurs d'écran annoncent en anglais ; SEO ; ressentiment qualité.
- **Action** : Mettre à jour `lang` dynamiquement au switch de langue (et le `dir` pour AR).

### F-15 — [P1] Bouton « New » / « + » incohérent
- **Constat** : Selon les modules, le bouton de création s'appelle « New » (achats, matériel, métrés, devis), « + Nouvelle écriture » (finance journaux), « + Saisir facture », « + Règlement client », « Saisir avancement », « Voir planning » — labels et styles différents.
- **Action** : Convention unique : `+ <Verbe métier>` (« + Nouveau bon de commande », « + Nouvelle facture »). Composant `<app-page-header>` réutilisable avec slot d'actions primaires.

### F-16 — [P1] Formats de nombres et devises incohérents
- **Constat** :
  - Liste chantiers : `25 M`, `87 M` (M sans unité)
  - Budget : `MAD 103,350,000` (séparateur virgule anglo-saxon)
  - Factures : `103.800` (séparateur point — convention MA)
  - Règlements : `+15.329.800,00 MAD` (point milliers + virgule décimales — convention MA correcte)
  - AOC : `22,000,000` (sans devise)
  - BC : `420.000 MAD` (correct)
- **Impact** : Lecture difficile, erreurs d'interprétation possibles (différence × 1000 entre conventions).
- **Action** : Normaliser sur la convention `1 234 567,89 MAD` (norme OMP + ANRT). Pipe `madCurrency` unique. Désactiver tout autre format.

### F-17 — [P1] Calcul des retenues paie incohérent
- **Module** : RH — Paie
- **Constat** : Pour un brut de **34 500 MAD**, la fiche affiche « Retenues : 1 049 MAD ». Or les charges salariales marocaines (CNSS plafonnée 4,48 % sur 6 000 MAD ≈ 269 MAD + AMO 2,26 % ≈ 780 MAD + retraite éventuelle CIMR si cadre) tournent autour de 1 000–4 000 MAD selon barème. **L'IGR de 10 678 MAD pour ce brut est cohérent**, donc seules les retenues sociales sont sous-calculées.
- **Action** : Implémenter le moteur de calcul paie marocain :
  - CNSS prestations sociales 4,48 % plafonnée à 6 000 MAD
  - CNSS prestations familiales (employeur) 6,40 %
  - AMO 2,26 % salarial sans plafond
  - IGR 2026 selon barème mensuel par tranches
  - Frais professionnels 35 % plafonnés à 35 000 MAD/an
  - CIMR cadres optionnel
  - Taxe formation professionnelle (1,6 % employeur)
  - Inclure éditions BAP CNSS, déclaration mensuelle, état 9421

### F-18 — [P1] Panneau IA toujours visible occupe 25–30 % de l'écran
- **Constat** : Le panneau « Conversations / Agent ERP » à droite est ouvert par défaut, gravement amputant la zone de lecture des tableaux denses (situations, budget).
- **Action** : (1) Fermer par défaut ; (2) Ouvrable via raccourci `?` ou bouton flottant ; (3) Mémoriser l'état utilisateur dans `localStorage` (ou DB user-prefs).

### F-19 — [P1] Tableaux denses sans virtualisation ni pagination claire
- **Constat** : Plusieurs tableaux affichent peu de lignes mais le pattern « Items per page : 20 » de Material n'est pas uniforme. Pas de virtualisation visible (`cdk-virtual-scroll`).
- **Impact** : À 1 000+ lignes (BC, mouvements stock, écritures comptables), perfs et UX dégradées.
- **Action** : (1) Virtualisation systématique sur tableaux > 50 lignes ; (2) Pagination/infinite-scroll uniforme ; (3) Recherche/filtre par colonne ; (4) Sticky header.

### F-20 — [P1] Aucun feedback utilisateur sur les actions critiques
- **Constat** : Pas de toasts/snackbars visibles pour confirmer création, modification, suppression. Les boutons « Voir planning », « Saisir avancement » n'ouvrent rien (mock).
- **Action** : Composant `<app-toast>` global. Pattern : `success / error / warning / info`. Position `bottom-right`. Auto-dismiss 4 s, persistant pour erreurs.

### F-21 — [P1] Aucun garde-fou navigation pour saisies non sauvegardées
- **Action** : Implémenter `CanDeactivateGuard` pour les formulaires longs (devis, métrés, budget chantier) : « Vous avez des modifications non sauvegardées, quitter quand même ? ».

### F-22 — [P1] Pas de gestion d'état vide / loading / erreur
- **Constat** : Les écrans n'affichent que la donnée mockée. Pas de skeletons, pas de message « aucun résultat », pas de boutons de retry.
- **Action** : 3 états par tableau/écran : `loading` (skeleton), `empty` (illustration + CTA création), `error` (message + retry). Composant `<app-data-state>`.

### F-23 — [P1] Filtres affichés en chips horizontaux non scrollables sur petits écrans
- **Constat** : Les onglets-filtres (« Tous / À valider / En cours livraison / En retard / À facturer ») risquent de déborder sur tablette/mobile.
- **Action** : `overflow-x: auto` + scroll snap ; ou regroupement dans un menu « Filtres » avancé.

### F-24 — [P1] Spécificités fiscales/légales marocaines absentes ou partielles
- **Constat** :
  - Fournisseurs : ICE présent ✓ ; **manque IF, RC, Patente, RIB**.
  - Factures : pas de gestion visible de la **retenue à la source 5 %** (travaux fournis à l'État, art. 158 CGI).
  - Pas de mention de **TPCC** (Taxe pour la Promotion du Paysage Audiovisuel National, optionnelle BTP).
  - Pas de gestion **timbre fiscal** sur facturation espèces.
  - Pas d'**autoliquidation TVA** prestations BTP fournies à autoentrepreneurs.
- **Action** : Étoffer le référentiel fiscal :
  - Champs `ice`, `if`, `rc`, `patente`, `rib` sur tiers (client, fournisseur, employé)
  - Configuration des taux et règles d'application TVA 20 % / 14 % / 10 %
  - Retenues à la source paramétrables (5 %, 10 %)
  - Génération du **fichier SIMPL-IS** (DGI) et **DAMANCOM** (CNSS)

---

## 4. Problèmes MOYENS (P2)

### F-25 — [P2] Encodage / accents non uniformes
- **Constat** : Module Planning : « Vue Gantt consolidee multi-chantiers avec dependances et edition des dates » (sans accents) vs autres modules avec accents corrects.
- **Action** : Linter sur les fichiers i18n pour bloquer les caractères ASCII là où l'on attend de l'UTF-8 français.

### F-26 — [P2] Typographie & hiérarchie visuelle
- **Constat** : Titres H1/H2 peu différenciés, sous-titres parfois en petite italique pâle (ex. « Saisie, validation, suivi des règlements ») peu lisibles. Beaucoup de gris peu contrastés.
- **Action** : Définir un design system (Tokens : `--text-primary`, `--text-secondary`, `--text-tertiary` ; échelle typo `12/14/16/20/24/32` ; line-height 1.4–1.6). Auditer contraste WCAG AA.

### F-27 — [P2] Absence d'export CSV/Excel/PDF sur tous les tableaux
- **Constat** : Pas de bouton export visible. Or les contrôleurs de gestion BTP travaillent **en permanence** sous Excel.
- **Action** : Bouton « Exporter » sur chaque écran de liste : CSV / XLSX (via `xlsx-populate` ou `exceljs`) / PDF (impression formattée).

### F-28 — [P2] Impression / génération PDF invisible
- **Constat** : Pas d'aperçu impression visible pour BC, devis, factures, situations, contrats. Or **chaque document doit pouvoir être tamponné/signé**.
- **Action** : Templates HTML imprimables avec en-tête société (logo + ICE + IF + adresse + RIB), signatures, cachet. Génération PDF côté serveur (via Puppeteer / wkhtmltopdf) pour fidélité.

### F-29 — [P2] Pas d'historique / piste d'audit
- **Constat** : Aucune trace de qui a modifié quoi et quand.
- **Action** : Audit log par entité (`audit_log` table + UI « Historique »). Indispensable pour les MOA publics.

### F-30 — [P2] Statuts en couleurs inconsistantes
- **Constat** : Statuts colorés différemment selon les modules (ex. « En cours » vert chantier, vs « Brouillon » jaune BC, vs « Soumise » bleu DA…). Pas de légende.
- **Action** : Système de design `<app-status-badge [status]="...">` avec mapping centralisé. Légende au survol (tooltip).

### F-31 — [P2] « Avancement moyen 0% » dans le dashboard alors que les chantiers individuels affichent 18–62 %
- **Constat** : Le KPI dashboard ne reflète pas la donnée réelle.
- **Action** : Recalcul réel pondéré par budget ou par durée. Plus généralement, faire en sorte que les KPIs dashboard agrègent les **mêmes datasets** que les modules détaillés (bug F-04 indirect).

### F-32 — [P2] Module RH : sous-routes manquantes
- **Constat** : `/rh/pointage` redirige vers `/`. `/rh/planning-equipes` et `/rh/conges` à vérifier.
- **Action** : Implémenter pointage chantier (digital, avec photo + géoloc — différenciateur fort vs concurrence). Saisie offline indispensable pour terrain.

### F-33 — [P2] Champs / formulaires non testés
- **Constat** : Aucun écran de création ouvert (boutons « New » non cliqués dans cet audit, mais pas vu de formulaires modaux dans les flux). Risque de découvrir 50 + bugs supplémentaires en saisie réelle.
- **Action** : Auditer et documenter chaque formulaire : validation côté client, masques (téléphone MA `+212 6 XX XX XX XX`, ICE 15 chiffres, RIB 24 caractères), autocomplétion, dépendances champs.

### F-34 — [P2] Module Approbations transversal
- **Constat** : Le module est manquant mais déjà référencé partout (« À valider », « Soumise », « Brouillon »…). Sans engine d'approbation, ces statuts sont décoratifs.
- **Action** : Spec workflow engine :
  - Définir matrice : `entity × montant × rôle approbateur`
  - UI : Inbox approbateur + commentaires + délégation + escalade SLA
  - Notifications email/push sur attente
  - Audit complet

### F-35 — [P2] Bouton « core.ai.assistant.title » avec clé non traduite
- **Constat** : Bouton flottant en bas à droite affiche `core.ai.assistant.title` au lieu d'un libellé.
- **Action** : Ajouter la traduction.

---

## 5. Problèmes MINEURS (P3)

### F-36 — [P3] Icône texte « 🤖 » brute en bas de page
- **Constat** : Une icône emoji 🤖 isolée, probablement celle du bouton AI flottant rendue sans wrapper.
- **Action** : Remplacer par une icône SVG de la lib (lucide / material-icons).

### F-37 — [P3] Pluriels non gérés
- **Constat** : « 12 chantier(s) » avec parenthèses au lieu d'un pluriel ICU.
- **Action** : `{ count, plural, =0 {Aucun chantier} one {1 chantier} other {{count} chantiers} }`.

### F-38 — [P3] Tooltip et raccourcis clavier absents
- **Action** : Tooltip sur chaque action primaire + raccourcis `g+c` (go chantiers), `n` (new), `?` (aide).

### F-39 — [P3] Logo / branding absent
- **Constat** : « ERP » en haut à gauche, sans logo société ni nom du produit.
- **Action** : Espace réservé pour logo client (multi-tenant) et nom produit.

### F-40 — [P3] Pas de dark mode
- **Constat** : Uniquement light. Un paramètre user pour `prefers-color-scheme` est attendu sur les ERP modernes.
- **Action** : Tokens CSS variables, switch user.

### F-41 — [P3] Manifest PWA absent
- **Constat** : Pas de `link[rel=manifest]` détecté.
- **Action** : Configurer PWA (Angular `@angular/pwa`) — utile pour installation sur tablette chantier et fonctionnement offline.

### F-42 — [P3] Bouton « Réinitialiser » filtres présent partout mais pas toujours visible
- **Action** : Standardiser position et label.

---

## 6. Spécificités marché marocain — checklist concurrentielle

Pour battre Sage Maroc / Batigest / SAP B1 / ERPGEC, le produit doit cocher :

| Domaine | Fonctionnalité | Statut actuel |
|---|---|---|
| **Fiscal** | TVA 20 / 14 / 10 % BTP | À vérifier |
| **Fiscal** | Retenue à la source 5 % marchés publics | **Manquant** |
| **Fiscal** | Timbre fiscal facturation espèces | **Manquant** |
| **Fiscal** | Génération SIMPL-IS (DGI) | **Manquant** |
| **Fiscal** | Annexe ventes/achats DGI | **Manquant** |
| **Social** | CNSS, AMO, CIMR, IGR 2026 | **Mock incohérent** |
| **Social** | DAMANCOM mensuel | **Manquant** |
| **Social** | État 9421 annuel | **Manquant** |
| **Marché public** | Cautions provisoire/définitive/RG 7 % | **Manquant** |
| **Marché public** | Formule de révision K (CCAG-T) | **Manquant** |
| **Marché public** | Décompte général définitif (DGD) | **Manquant** |
| **Banque** | Virements multi-RIB (AWB, BMCE, CIH, Pop., BMCI…) | Présent (Règlements) |
| **Banque** | Effet de commerce (LCN) | Présent |
| **Référentiel tiers** | ICE, IF, RC, Patente | **Partiel** (ICE seul) |
| **Bilingue** | FR / AR avec RTL | **Manquant** |
| **BTP métier** | BPU/Forfait/Régie | À vérifier |
| **BTP métier** | Sous-traitance (déclaration art. 187 CGI) | À vérifier |
| **BTP métier** | Métré + DQE + chiffrage à partir de bibliothèque prix | Squelette OK |
| **BTP métier** | Avancement physique pondéré par lot | OK |
| **BTP métier** | Pointage chantier mobile + photo | **Manquant** |
| **BTP métier** | Carnet d'attachement | **Manquant** |
| **BTP métier** | Journal de chantier | **Manquant** |
| **HSE** | Registre AT, MP, NC, audits HSE | **Manquant** |
| **Pilotage** | Marge projetée par chantier | Squelette OK |
| **Pilotage** | Cash-flow prévisionnel chantier | **Manquant** |

---

## 7. Recommandations transverses & architecturales

### Design System
- **DS-01** : Établir un design system Figma + tokens CSS (couleurs, espace, typo, ombres, rayons, durées).
- **DS-02** : Composants réutilisables : `Button`, `Input`, `Select`, `Datepicker`, `Table`, `Pagination`, `EmptyState`, `Skeleton`, `Toast`, `Modal`, `Drawer`, `Tabs`, `StatusBadge`, `Breadcrumb`, `PageHeader`, `KpiCard`, `MoneyInput` (MAD), `IceInput`, `RibInput`, `PhoneMaInput`.

### Internationalisation
- **I18N-01** : Source unique de vérité (`assets/i18n/{fr,ar,en}.json`) + clé manquante = build error.
- **I18N-02** : `LOCALE_ID` dynamique, `<html lang dir>` dynamiques, support RTL.
- **I18N-03** : Pipes monétaires/dates uniformes par locale (`fr-MA`, `ar-MA`, `en-US`).

### Architecture données mock
- **DATA-01** : Un seul jeu de données mock cohérent (`/assets/mocks/seed.json`) consommé par tous les services. Permet aussi de provisionner facilement la première démo client.
- **DATA-02** : Service `MockApiService` interceptant les appels HTTP, désactivable via env (`useMocks: false`).

### Sécurité & multi-tenancy
- **SEC-01** : Pas vu de page login dans l'audit (mode dev). Prévoir SSO (Microsoft / Google), 2FA, gestion sessions, déconnexion auto.
- **SEC-02** : Multi-société/multi-établissement (un même groupe BTP a souvent plusieurs entités juridiques).
- **SEC-03** : Permissions granulaires par rôle × module × action × chantier.

### Performance
- **PERF-01** : Audit Lighthouse / Web Vitals à intégrer en CI.
- **PERF-02** : Lazy loading par module (probablement déjà fait en Angular).
- **PERF-03** : Virtualisation tableaux ; suspense/skeleton.

### Accessibilité
- **A11Y-01** : Audit axe-core en CI.
- **A11Y-02** : Focus ring visible, navigation 100 % clavier, ARIA labels complets, contrastes WCAG AA minimum.
- **A11Y-03** : Annoncer les changements de page aux lecteurs d'écran (live region).

### Tests
- **TEST-01** : Couverture tests unitaires services calcul fiscal/paie ≥ 95 %.
- **TEST-02** : Tests e2e Playwright des parcours critiques (création BC → réception → facture → règlement).
- **TEST-03** : Tests visuels (Percy / Chromatic) sur DS.

### Mobile / terrain
- **MOB-01** : PWA installable + service worker avec stratégie offline-first pour pointage et avancements.
- **MOB-02** : Mode terrain optimisé tablette/mobile : interactions tactiles, formulaires courts, photo + géoloc.

---

## 8. Roadmap suggérée (12 semaines pour rendre l'ERP vendable)

### Sprint 1–2 (S1–S2) — **Fondations & cohérence**
- F-04 : dataset mock unifié
- F-03 : devise globale MAD + LOCALE_ID
- F-06 : i18n keys manquantes + handler missing
- F-14 : `<html lang>` dynamique
- F-01, F-02 : drill-down chantier
- F-05 : routes sous-traitance / documents chantier
- DS-01 / DS-02 : design system MVP + composants `MoneyInput`, `IceInput`, `Table`, `EmptyState`, `Toast`

### Sprint 3–4 (S3–S4) — **Modules manquants critiques**
- F-08 : Marchés & Facturation (avenants, situations, retenues, révision K)
- F-07 : Stock & Logistique (référentiel + mouvements)
- F-24 : champs IF / RC / Patente / RIB sur tiers
- Spécifique fiscal Maroc : retenue source 5 %, TVA, timbre

### Sprint 5–6 (S5–S6) — **Module Pilotage & Approbations**
- F-09 : Approbations (workflow engine)
- F-09 : Pilotage (KPIs marge, trésorerie, alertes)
- F-15 : standardisation actions primaires
- F-10 : breadcrumbs + page-header global
- F-11 : command palette Ctrl+K
- F-12 : centre de notifications

### Sprint 7–8 (S7–S8) — **HSE & RH terrain**
- F-09 : module Qualité & HSE (NC, incidents, registres)
- F-32 : pointage chantier mobile (photo + géoloc, offline)
- F-17 : moteur paie marocain complet (CNSS, AMO, IGR, CIMR, BAP)
- F-13 : bilingue FR / AR + RTL

### Sprint 9–10 (S9–S10) — **Production-readiness**
- F-09 : Administration (utilisateurs, rôles, paramètres société, multi-entité)
- F-29 : audit log
- F-27, F-28 : exports CSV/Excel + impressions PDF (BC, devis, factures, situations)
- SEC-01 / SEC-02 / SEC-03 : sécurité & multi-tenancy
- F-21 : CanDeactivate guards
- TEST-01 / TEST-02 : couverture

### Sprint 11–12 (S11–S12) — **Polish & démo commerciale**
- F-26, F-30 : design pass complet
- F-31 : KPIs dashboard cohérents
- F-22 : états vides / loading / erreur partout
- MOB-01 : PWA + offline
- A11Y-01 / A11Y-02 : audit accessibilité
- F-19 : virtualisation
- Préparation jeu de données démo « société modèle » + scripts seed
- Documentation utilisateur + onboarding tour

---

## 9. Annexe — Bug list rapide pour ticket batch

```
[P0] F-01 Fiche chantier toujours « introuvable » → fixer mock + service
[P0] F-02 Lignes liste chantiers non cliquables → routerLink
[P0] F-03 Currency $ au lieu MAD (situations, biblio prix, devis) → pipe global
[P0] F-04 3 formats de codes chantier (CH-2025/CH-2026/PROJ-2024) → dataset unique
[P0] F-05 /chantiers/sous-traitance et /documents → 404 → déclarer routes
[P0] F-06 Clés i18n inventory.materiel.* non traduites
[P0] F-07 Module Stock 100% absent
[P0] F-08 Module Marchés & Facturation 100% absent
[P0] F-09 Pilotage / Approbations / Admin / HSE absents
[P1] F-10 Breadcrumbs absents/erronés
[P1] F-11 Recherche globale Ctrl+K non fonctionnelle
[P1] F-12 Notifications panel inexistant
[P1] F-13 Toggle langue inopérant
[P1] F-14 <html lang="en"> alors UI fr
[P1] F-15 Boutons de création hétérogènes (« New » vs « + Saisir »…)
[P1] F-16 Formats de nombres incohérents
[P1] F-17 Retenues paie sous-calculées
[P1] F-18 Panneau IA toujours ouvert mange l'écran
[P1] F-19 Pas de virtualisation tableaux
[P1] F-20 Pas de feedback toast sur actions
[P1] F-21 Pas de CanDeactivate guards
[P1] F-22 Pas d'états loading/empty/error
[P1] F-23 Filtres horizontaux non scrollables sur petit écran
[P1] F-24 Spécificités fiscales MA (IF/RC/RIB/RAS 5%/timbre) manquantes
[P2] F-25 Accents français manquants dans Planning
[P2] F-26 Hiérarchie typographique faible
[P2] F-27 Pas d'export CSV/XLSX/PDF
[P2] F-28 Pas de templates impression
[P2] F-29 Pas d'audit log
[P2] F-30 Statuts colorés incohérents
[P2] F-31 Dashboard KPI « Avancement moyen 0% » faux
[P2] F-32 RH pointage chantier inexistant
[P2] F-33 Formulaires de saisie non audités
[P2] F-34 Workflow Approbations à spécifier
[P2] F-35 Clé "core.ai.assistant.title" non traduite
[P3] F-36 Emoji 🤖 isolé en page
[P3] F-37 Pluriels non ICU
[P3] F-38 Tooltips et raccourcis manquants
[P3] F-39 Logo / branding absent
[P3] F-40 Pas de dark mode
[P3] F-41 PWA manifest absent
[P3] F-42 Bouton « Réinitialiser » filtres standardiser
```

---

## 10. Comment exploiter ce document avec un agent

Pour chaque finding `F-XX` :
1. **Lire** le constat et l'impact pour comprendre le pourquoi.
2. **Suivre l'action** proposée comme cahier des charges minimal.
3. **Compléter** par un test e2e Playwright ou un test unitaire pour éviter régression.
4. **Valider** en cochant la case dans la table de complétude (§ 1).

> Astuce prompt agent : « Implémente F-03 (devise MAD globale) en suivant les recommandations. Ajoute un test e2e qui crawle toutes les routes et fait échouer si un caractère "$" est trouvé dans le DOM. Recherche le dataset mock et remplace toute hardcoded $ par MAD. »

— **Fin de l'audit.**