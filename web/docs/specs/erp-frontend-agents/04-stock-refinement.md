# Agent — Stock & Inventory · Refinement

> **Objet** : combler les gaps du module inventory (déjà ~70%) et durcir l'UX. **PAS** de refonte. Re-lire les briefs existants `pages/inventory/mouvements/receptions/AGENT_*.md` avant de commencer.
> **Routes** : `/inventory/*` (déjà branchées via `inventory.routes.ts`)
> **Permission** : `inventory.<entity>.*` (déjà en place)

## 0. Pré-requis

- Lire en intégralité `web/app/applications/erp/pages/inventory/mouvements/receptions/AGENT_RECEPTION_UX_SOCLE_BRIEF.md`, `AGENT_UX_FIXES.md`, `AGENT_ACTION_BAR_SPEC.md` — leurs principes restent normatifs.
- Lire [00-CONVENTIONS](00-CONVENTIONS.md), [00-UX-PRINCIPES](00-UX-PRINCIPES.md).

## 1. Audit gaps actuels

### Routes nav vs implémenté (vérifier toutes)

| Route nav | État | Gap |
|-----------|------|-----|
| `/inventory/mouvements/receptions` | ✓ | Refinement UX (cf. briefs existants) |
| `/inventory/mouvements/transferts` | ✓ | OK — vérifier état des lignes éditables |
| `/inventory/mouvements/retours` | ✓ | Vérifier lien BL/Réception parent |
| `/inventory/mouvements/inventaires` | ✓ | Saisie tablette (douchette) à finaliser |
| `/inventory/mouvements/pertes-chutes` | ✓ | Vérifier motifs et workflow |
| `/inventory/suivi/etat-stock` | partiel | À finir — vue valorisée par dépôt |
| `/inventory/suivi/valorisation` | partiel | Vue par méthode (AVCO/FIFO/STD) à compléter |
| `/inventory/suivi/alertes` | partiel | Personnalisation seuil par dépôt |
| `/inventory/catalogue/articles` | ✓ | OK |
| `/inventory/catalogue/materiel` | partiel | Vue catalogue distincte du parc |
| `/inventory/configuration/familles` | ✓ | OK |
| `/inventory/configuration/types-articles` | ✓ | OK |
| `/inventory/configuration/uom` | ✓ | OK |
| `/inventory/configuration/depots` | ✓ | OK |
| `/inventory/configuration/motifs` | ✓ | OK |
| `/inventory/configuration/costing-methods` | ✓ | OK |

> Vérifier le réel : exécuter `npm run start` et naviguer sur chaque route. Marquer les écrans cassés/vides.

## 2. Tâches de refinement (par priorité)

### P0 — bloquants démo

#### P0.1 État du stock (`/inventory/suivi/etat-stock`)

Vue à finaliser :

```
┌──────────────────────────────────────────────────────────────────────┐
│ État du stock                                  [▾ Dépôt] [▾ Famille] │
│                                                                      │
│ Vue:  [Par article] [Par dépôt] [Par chantier]    [Exporter Excel]   │
├──────────────────────────────────────────────────────────────────────┤
│ Article          │ Famille  │ Dépôt 1 │ Dépôt 2 │ Chant.001 │ Total │
│                  │          │  Qté/Val│ Qté/Val │  Qté/Val  │ valeur│
│ Ciment CPJ 35    │ Ciments  │ 1200/93k│  450/35k│  120/9.4k │ 138 K │
│ Rond T12         │ Aciers   │  80T/1.2M│  25T/0.4M│ 15T/0.2M│ 1.8M │
│ ...                                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

- Vue pivot article × location avec qté + valeur cumulée.
- Toggle `Par article` (lignes = articles, colonnes = locations) / `Par dépôt` / `Par chantier`.
- Drill click cellule → liste mouvements de cet article × cette location.

#### P0.2 Valorisation (`/inventory/suivi/valorisation`)

Vue tableau de valorisation par méthode (AVCO / FIFO / STD selon costing-method actif).

- Colonnes : article, méthode, quantité totale, prix moyen pondéré, valeur totale, dernière entrée date+prix.
- Carte de synthèse en haut : `Stock total = X MAD HT`, `Variation 30j = ▲ Y%`, `Articles en alerte = N`.
- Export Excel détaillé.

#### P0.3 Alertes (`/inventory/suivi/alertes`)

Page actuellement listing partiel. Compléter :

- Filtre par dépôt + chantier.
- Tri par urgence (`CRITIQUE` puis `EN_ALERTE`).
- Action ligne : `Créer demande achat` (pré-remplie avec article + quantité = `stockMin - currentQty`).
- Configuration seuil par article × dépôt (si pas déjà — drawer édition).

### P1 — UX critique

#### P1.1 Réceptions — finir le brief existant

Appliquer en intégralité `AGENT_RECEPTION_UX_SOCLE_BRIEF.md` :
- Hiérarchie d'actions (gauche/droite).
- Mode consultation distinct du mode édition (style `<dl>`).
- Total visible pendant la saisie.
- Localisation FR-MA des dates et nombres.
- `—` vs `n.a.` (cf. UX-PRINCIPES §5).

#### P1.2 Inventaires (`/inventory/mouvements/inventaires`)

Finaliser le mode saisie tablette :
- Scan code-barres / QR via caméra (lib `ngx-scanner` ou `html5-qrcode`).
- Mode "saisie en aveugle" : on scanne, l'app pré-remplit l'article et demande la quantité comptée.
- Tableau d'inventaire : article, qté théorique, qté comptée, écart, écart valeur.
- Bouton `Valider l'inventaire` génère un mouvement de régularisation (+/-) avec motif `INVENTAIRE`.

#### P1.3 Catalogue Matériel (`/inventory/catalogue/materiel`)

Vue catalogue (nomenclature) distincte de la vue parc (instances) — la vue parc est dans `/materiel/parc` (cf. spec 05).

Le catalogue contient les **types d'engins/matériel** (modèles, marques, caractéristiques techniques génériques). Le parc contient les **instances** (numéro de série, état, affectation).

À finaliser : page listing + détail catalogue matériel avec sections :
- Identité (code, désignation, marque, modèle).
- Caractéristiques techniques (puissance, capacité, dimensions).
- Coûts standards (prix achat, prix location journalier, coût horaire utilisation).
- Maintenance (intervalle révisions, opérations standards).
- Photos.

### P2 — finitions

#### P2.1 Pertes & chutes

Vérifier :
- Workflow `BROUILLON → SOUMISE → APPROUVEE → ENREGISTREE`.
- Motifs typés (vol, casse, péremption, chute de coupe…) — utiliser les `MotifMouvement` existants.
- Limite d'auto-validation : si valeur > 500 MAD, requiert approbation conducteur.

#### P2.2 Transferts

Vérifier :
- Source ≠ destination (validation).
- Génération automatique de 2 mouvements (sortie source / entrée destination).
- Si destination = location CHANTIER, mise à jour stock chantier.

#### P2.3 Retours

- Lier au BL ou réception parent (champ `parentReceptionId`).
- Workflow : `BROUILLON → CONFIRME → ENVOYE`.
- Imprimer bon de retour fournisseur.

## 3. UX boost transverse

À appliquer sur **toutes** les pages inventory :

- **Locale FR-MA** : dates `JJ/MM/AAAA`, nombres `1 234,56`, devise `MAD`.
- **Empty states** propres (icône + texte + CTA).
- **Filtres rapides chips** sur tous les listings (`Aujourd'hui`, `Cette semaine`, `Ce mois`, `Mes saisies`).
- **Vue groupée** : toggle `Grouper par dépôt / par chantier / par article` sur réception, transfert, retour, perte.
- **Actions de masse** : sélection multiple → `Exporter`, `Imprimer`, `Valider sélection`.
- **Indicateur de ligne** (3px à gauche) selon statut (vert validé, bleu en cours, gris brouillon).

## 4. Composants à ajouter / améliorer

```
applications/erp/inventory/components/
├── stock-pivot-table/             # NEW — table pivot état stock
├── valorisation-summary-card/     # NEW — carte synthèse valorisation
├── alerte-row/                    # NEW — ligne alerte avec CTA inline
├── scanner-input/                 # NEW — input avec scan caméra/HID
├── ecart-cell/                    # NEW — affichage écart inventaire (valeur + couleur)
└── (existants à conserver)
```

## 5. Mock — étoffer

Étendre `InventoryMockService` :
- Stock balances cohérents : tous les articles × tous les dépôts (matrice).
- 8-15 alertes dont 3 critiques.
- 4-6 inventaires sur les 3 derniers mois.
- 30+ mouvements répartis (réception, transfert, retour, perte) en cohérence avec les chantiers actifs.

## 6. Files to update / create

Pas de réécriture. Touches chirurgicales :

```
pages/inventory/suivi/etat-stock/        UPDATE — vue pivot
pages/inventory/suivi/valorisation/      UPDATE — vue par méthode
pages/inventory/suivi/alertes/           UPDATE — CTA "Créer DA" + config seuils
pages/inventory/mouvements/receptions/   UPDATE — appliquer brief UX existant
pages/inventory/mouvements/inventaires/  UPDATE — mode scan tablette
pages/inventory/mouvements/pertes-chutes/UPDATE — limite auto-valid
pages/inventory/catalogue/materiel/      UPDATE — finir catalogue
applications/erp/inventory/components/   ADD — 5 composants ci-dessus
applications/erp/inventory/mock/         UPDATE — étoffer seeds
```

## 7. DoD

- [ ] Toutes les routes nav `/inventory/*` ouvrent une page fonctionnelle (pas de placeholder).
- [ ] Vue pivot état stock opérationnelle.
- [ ] Valorisation calcule les méthodes AVCO/FIFO/STD correctement (mocké).
- [ ] Alertes : CTA `Créer DA` génère bien une demande d'achat pré-remplie (lien module achats).
- [ ] Réceptions : brief UX appliqué (lecture distincte, total sticky, actions hiérarchisées).
- [ ] Inventaires : scan caméra / saisie aveugle fonctionne.
- [ ] Catalogue matériel séparé du parc et complet.
- [ ] Tous les nouveaux composants exposent des props typées sans `any`.
- [ ] Locale FR-MA respectée partout.
- [ ] Performance : aucun listing > 1s en première vue.
- [ ] Régression zéro sur les pages déjà OK (smoke-test manuel : créer une réception, valider, voir le stock impacté).
