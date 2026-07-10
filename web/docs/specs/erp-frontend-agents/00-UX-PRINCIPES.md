# Principes UX — ERP BTP Maroc

> Référentiel UX que tous les agents doivent appliquer. Issu d'un benchmark Sage BTP / Onaya / BatiPilot / Optim BTP / Procore / Buildertrend, et adapté au contexte BTP Maroc (saisie chantier, faible bande passante, multi-rôles).

## Personas cibles

| Persona | Usage typique | Périphérique | Contexte |
|---------|--------------|--------------|----------|
| **Conducteur de travaux** | Pointer, valider BL, suivre avancement, demander achats | Tablette / smartphone sur chantier | Mobilité, gants, lumière forte |
| **Chef de chantier** | Pointage équipe, consommation matériaux, sécurité | Smartphone | Saisie courte, en mouvement |
| **Magasinier dépôt** | Réception, transferts, inventaires, alertes stock | PC + scan douchette | Fixe, dense, scan code-barres |
| **Acheteur** | DA → AO → BC → contrat, suivi fournisseurs | PC | Bureau, multi-fenêtres |
| **Contrôleur de gestion** | Budget chantier, situations, marges, analytique | PC | Bureau, exports Excel attendus |
| **Comptable** | Factures fournisseurs, journaux, rapprochement | PC | Bureau, double écran, productivité saisie |
| **DAF / DG** | Dashboard, marges chantiers, trésorerie, KPIs | PC + smartphone | Lecture, pilotage |
| **Métreur / Étude** | Métrés, devis, bibliothèque prix | PC + plans imprimés | Bureau, manipulation gros volumes |
| **RH / Paie** | Employés, congés, planning équipes, paie | PC | Bureau |
| **HSE** | Incidents, inspections, formations | Smartphone + PC | Mixte chantier/bureau |

## 7 principes directeurs

### 1. **Densité d'information** (PC bureau)

Les pages métier (listings, journaux, balances, analytique) **doivent** afficher beaucoup d'information sans scroll horizontal sous 1366×768 (résolution minimum cible). Cela implique :

- Lignes compactes (32–36px de hauteur dans listings).
- Typographie lisible (text-sm = 14px par défaut).
- Pas de cards redondantes pour des données tabulaires — utiliser `<table>`.
- Filtres pliés par défaut, sticky en haut.

### 2. **Adaptation mobile pour les rôles terrain**

Routes terrain (`/chantiers/avancements`, `/chantiers/pointage`, `/inventory/mouvements/receptions`, `/hse/incidents`) doivent rester utilisables en 360px de large :

- CTA en bas fixe (FAB ou sticky bar).
- Champs de saisie ≥ 44px de hauteur.
- Scan code-barres prioritaire (caméra ou douchette HID).
- Mode hors-ligne pour saisie pointage (V2 — OK V1 sans, mais structure le permettre).

### 3. **Hiérarchie d'actions claire** (cf. AGENT_RECEPTION_UX_SOCLE_BRIEF.md)

Sur les pages de détail à workflow :

- **Gauche** : navigation (`Retour`) + actions utilitaires secondaires (`Scanner BL`, `Imprimer`, `Dupliquer`).
- **Centre / au-dessus** : badge de statut, toujours visible.
- **Droite** : actions de workflow ordonnées (transitions de statut), CTA primaire à l'extrême droite.
- En consultation : le formulaire ne doit **pas** ressembler à un formulaire éditable.

### 4. **Statuts métier explicites, pas techniques**

| Mauvais | Bon |
|---------|-----|
| `DRAFT` | `Brouillon` |
| `PENDING` | `En attente validation` |
| `APPROVED` | `Validé` |
| `IN_PROGRESS` | `En cours` |
| `DONE` | `Clôturé` / `Terminé` |
| `CANCELLED` | `Annulé` |

Couleurs (utilisateur final, pas designer) :
- gris = brouillon / inactif
- bleu = en cours / soumis
- vert = validé / OK
- orange = alerte / attente
- rouge = bloqué / refusé / critique
- violet = exceptionnel / archivé

### 5. **Données nulles signifiantes**

`—` cache l'information. Préférer :

| Cas | Affichage |
|-----|-----------|
| Champ optionnel non renseigné | `—` (gris clair) |
| Champ qui ne s'applique pas dans ce contexte | `n.a.` (gris très clair, italique) |
| Donnée en attente de calcul | `…` ou skeleton |
| Donnée manquante critique | `Non défini` (orange, cliquable pour saisir) |

### 6. **Toujours afficher les totaux pendant la saisie**

Pour devis, BC, factures, situations, inventaires : la **somme** (HT, TVA, TTC, écart, valeur) doit être visible **à tout moment** pendant la saisie des lignes. Pattern : footer sticky récapitulatif en bas de la zone de lignes.

### 7. **Imprimable = exportable**

Tout document métier (BC, BL, facture, devis, situation, certificat de paiement, fiche pointage) doit avoir un bouton `Imprimer` qui ouvre un PDF. En V1 mock : génération via composant Angular `<print-template>` + `window.print()` ou `jsPDF`. Format A4, en-tête société Seyrura, footer mentions légales (ICE, RC, IF, Patente, CNSS).

## Écrans non-tabulaires obligatoires

Certaines vues métier ne supportent pas un listing :

| Écran | Module | Composant cible |
|-------|--------|-----------------|
| **Planning Gantt** | Chantiers, RH planning | `<nf-gantt>` (à créer dans `@lib/anatomy`) |
| **Calendrier** | Chantiers planning, HSE inspections, RH congés | `<nf-calendar>` ou FullCalendar |
| **Kanban** | DA, BC, devis (états workflow) | `<nf-kanban>` à créer |
| **Carte / map** | Chantiers (géolocalisation), engins | Leaflet (V2 — OK absent V1) |
| **Tree / hiérarchie** | Plan comptable, familles articles, organigramme | `<nf-tree>` |
| **Form wizard** | Création chantier, création employé, devis depuis métré | `<nf-stepper>` à créer |
| **Pivot table** | Analytique, balance par axe | `<nf-pivot>` à créer |

> **V1 acceptable** : utiliser une lib externe (FullCalendar, ag-Grid pour pivot, ngx-charts). Tracer dans le brief le composant retenu pour cohérence.

## Patterns de listing — extensions au socle

Pour des listings métier riches (factures, BC, situations) :

- **Filtres rapides** : chips au-dessus des filtres (ex: `Aujourd'hui`, `Cette semaine`, `Validés`, `En retard`).
- **Vue groupée** : possibilité de grouper par chantier / fournisseur / mois (toggle dans la toolbar).
- **Sélection multiple + actions de masse** : valider, exporter, imprimer (CTA dans toolbar quand sélection ≥ 1).
- **Indicateurs de ligne** : barre de couleur à gauche pour statut (3px), badge urgence à droite.
- **Colonnes pinned** : code et désignation toujours visibles en scroll horizontal.

## Patterns de detail — extensions au socle

- **Header sticky** avec : titre, badge statut, KPIs résumés (ex: pour un chantier : avancement %, marge %, BC engagés, factures émises), action bar.
- **Onglets sticky** quand le détail est long (ex: chantier — Général, Lots, Planning, Budget, Documents, Pointage, Sous-traitance, Médias).
- **Activité / journal** en aside de droite (ouvrable) — qui a fait quoi quand sur ce document.
- **Liens profonds** : tout référence (chantier, fournisseur, article…) est cliquable et navigue vers son détail.

## i18n & locale

- Locale par défaut : `fr-MA`.
- Devise : MAD avec format `1 234 567,89 MAD`.
- Dates : `JJ/MM/AAAA`. Dates+heure : `JJ/MM/AAAA HH:mm`.
- Pluriels FR (1 chantier, 2 chantiers).
- Acceptation V2 : AR-MA (RTL non géré V1).

## Iconographie

- Lib : `lucide-angular` (déjà en place dans erp-nav).
- Convention : 1 icône par concept métier, cohérente partout (ex: `package` pour article, `truck` pour engin, `hard-hat` pour chantier, `building-2` pour bâtiment, `users` pour clients/employés selon contexte).
- Taille standard : 16px en listing, 20px en header, 24px en cards/dashboard.

## Accessibilité (V1 niveau acceptable)

- Contraste AA minimum (texte sur fond > 4.5:1).
- Focus visible (outline) — ne pas le supprimer.
- Labels obligatoires sur tous les inputs.
- Boutons icon-only avec `aria-label`.
- Tous les statuts ont une couleur **et** un texte (jamais couleur seule).

## Performance budget

- **Dashboard** : LCP < 1.5s, agrège ≤ 8 widgets.
- **Listings** : pagination serveur (50 lignes/page), virtualisation au-delà de 200 lignes locales.
- **Detail à lignes** (devis, BC) : virtualisation au-delà de 100 lignes.
- **Chargement initial app** : < 3s en 4G — chunks par module via `loadChildren`.

## Cohérence cross-module

- Tout document mentionnant un chantier doit avoir un **lien direct** vers la fiche chantier.
- Tout document mentionnant un fournisseur/client doit linker vers la fiche tiers.
- Toute facture doit linker vers le BC et la réception parents.
- Toute situation doit linker vers le chantier et les avancements.
- Tout pointage doit linker vers le chantier et l'employé.

## Anti-patterns UX interdits

- Modale qui ouvre une modale.
- Spinner global plein écran > 500ms (utiliser skeletons par zone).
- Notifications toasts pour des opérations asynchrones longues (utiliser une zone de tâches en arrière-plan).
- Tableaux avec scroll horizontal > 3 écrans (réduire colonnes ou densifier).
- Suppression sans confirmation (toujours dialog avec impact détaillé).
- Champs cachés conditionnellement qui réapparaissent — préférer désactivés explicites avec tooltip.
- Validation uniquement à la soumission (validation inline pendant la saisie).
