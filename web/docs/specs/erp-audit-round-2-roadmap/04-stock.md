# 04 — Stock & Logistique (scanner mobile, magasin chantier, péremption)

> **Sévérité** : P1 majoritairement
> **Estimation** : 1 sprint (S7)
> **Dépendances** : Round 1 05-stock (16 sous-routes existantes), `15-mobile` (scanner)

## Findings traités

- [ ] **M-STK-01** Scanner mobile (QR/code-barres) workflow complet
- [ ] **M-STK-02** Réservation stock chantier
- [ ] **M-STK-03** Magasin chantier digital (entrée → sortie → inventaire hebdo)
- [ ] **M-STK-04** Liaison sortie stock ↔ consommation chantier ↔ budget (🟡 Round 1 V2)
- [ ] **M-STK-05** Étiquetage (lot/emplacement + QR codes)
- [ ] **M-STK-06** Multi-emplacements par dépôt
- [ ] **M-STK-07** Date péremption / lot
- [ ] **M-STK-08** Demande de transfert workflow
- [ ] **M-STK-09** CMP / FIFO réel
- [ ] **M-STK-10** ABC analysis Pareto 80/20
- [ ] **M-STK-11** Suggestion réappro auto
- [ ] **M-STK-12** Carte dépôts + tournée (P3)

## Goal

Faire monter le **module Stock** (déjà très complet selon l'audit) au niveau d'un **WMS BTP** : scanner mobile en réception/sortie/inventaire, réservation stock par chantier, magasin chantier digital relié au budget, lots/emplacements précis, péremption pour chimiques, suggestion réappro auto.

## Context to read first

```
app/applications/erp/pages/inventory/                                      # 16 sous-routes Round 1
app/applications/erp/pages/inventory/mouvements/receptions/
app/applications/erp/pages/inventory/mouvements/sorties/                   # Round 1 5.3
app/applications/erp/pages/inventory/mouvements/transferts/
app/applications/erp/pages/inventory/catalogue/articles/                   # Round 1 5.2 (PMP + posteBudgetId)
app/applications/erp/inventory/services/inventory-mock.service.ts
app/applications/erp/inventory/services/inventory-tx.facade.ts             # Round 1 5.7 V2
app/applications/erp/inventory/services/stock-budget-sync.service.ts
```

---

## Task 4.1 — Scanner mobile QR/code-barres (M-STK-01) **P1**

**Librairie** : `@zxing/ngx-scanner` (Angular wrapper) ou `quagga2` (JS lib).

**Workflows mobiles** :
1. **Réception BL** : scan code-barre du BL → ouverture formulaire prérempli avec lignes BC
2. **Sortie stock** : scan QR article + saisie qté → consommation chantier
3. **Inventaire** : scan article par article → comptage incrémental

**Fichiers** :
- `app/applications/erp/pages/inventory/mobile/scanner/scanner.component.ts` (nouveau)
- Route `/m/inventory/scan/:context` (`context` = `RECEPTION`, `SORTIE`, `INVENTAIRE`)

**Acceptance criteria** :
- [ ] Permission caméra demandée correctement
- [ ] Détection QR + code-barres EAN-13
- [ ] Beep audio + vibration sur scan réussi (sur mobile)
- [ ] Mode offline (sync différée)

---

## Task 4.2 — Réservation stock chantier (M-STK-02) **P1**

**Modèle** :

```ts
export interface ReservationStock {
  id: string;
  articleId: string;
  qte: number;
  uom: string;
  chantierId: string;
  dateBesoin: string;          // semaine de besoin
  dateExpiration: string;       // au-delà = libérée
  dateCreation: string;
  creePar: string;
  status: 'ACTIVE' | 'CONSOMMEE' | 'EXPIREE' | 'ANNULEE';
  motif?: string;               // « Planning lot GO sem 21 »
}
```

**Action** :
1. Sur fiche article : section « Réservations actives »
2. Sur fiche chantier (onglet Stock) : section « Mes réservations »
3. La quantité disponible affichée tient compte des réservations actives
4. Une sortie chantier consomme les réservations en premier (FIFO réservation)

**Acceptance criteria** :
- [ ] CRUD réservations
- [ ] Quantité disponible = Stock - Réservations actives
- [ ] Auto-libération si dépassement date expiration (job mock)

---

## Task 4.3 — Magasin chantier digital (M-STK-03) **P1**

**Concept** : chaque chantier possède un « magasin » virtuel (dépôt typé `CHANTIER` cf Round 1 5.1). Workflow :
1. **Entrée magasin chantier** : transfert depuis dépôt central via BC livraison
2. **Sortie chantier** : bon de matières signé chef chantier (mobile cf §15) → consommation valorisée
3. **Inventaire chantier hebdo** : recomptage avec écarts justifiés

**Page** : `/inventory/magasin-chantier/:chantierId`

**Acceptance criteria** :
- [ ] Vue magasin chantier (liste articles + qtés + valorisation)
- [ ] Bouton « Bon de matières » avec signature électronique (cf M-CHA-06)
- [ ] Liaison sortie → budget chantier (cf M-STK-04)

---

## Task 4.4 — Liaison sortie ↔ budget (M-STK-04) **🟡 P1**

**État Round 1** : `Article.posteBudgetId` existe + `StockBudgetSyncService.recordOutflow()` câblé. Reste :
- UI : afficher dans budget chantier le « réalisé matière » par poste depuis les sorties
- Comparaison réalisé vs prévu (métré)
- Rapport d'écarts par lot

**Action** :
1. Étendre `BudgetFacade` pour exposer `realisesMatieresParPoste(chantierId)`
2. Onglet Budget chantier : nouvelle colonne « Réalisé matière (depuis stock) »
3. KPI dashboard : « Top 3 chantiers en sur-consommation matière »

**Acceptance criteria** :
- [ ] Budget chantier affiche colonne « Réalisé matière »
- [ ] Drill-down ligne budget → sorties stock du poste
- [ ] Test unitaire `stock-budget-sync.service.spec.ts` étendu

---

## Task 4.5 — Étiquetage (M-STK-05) **P1**

**Action** :
1. Génération étiquettes lot/emplacement avec QR
2. Impression depuis dépôt vers Bluetooth ou réseau (Zebra ZPL si prod ; PDF A4 multi-étiquettes pour démo)
3. Format QR : `nafura://article/<articleId>?lot=<lot>&emp=<emplacement>`

**Acceptance criteria** :
- [ ] Bouton « Imprimer étiquettes » sur fiche article + sur réception
- [ ] PDF prêt impression (taille 50×30 mm × N)

---

## Task 4.6 — Multi-emplacements par dépôt (M-STK-06) **P1**

**Modèle** :

```ts
export interface Emplacement {
  id: string;
  depotId: string;
  code: string;             // « A-12-03 » (allée-rack-niveau)
  designation?: string;
  capaciteVolume?: number;
  emplacementDefaut?: boolean;
}

// Article.emplacementsPossibles?: string[]
// Article.emplacementParDefaut?: string
```

**Acceptance criteria** :
- [ ] CRUD emplacements par dépôt
- [ ] Sortie/réception demande emplacement
- [ ] Inventaire par emplacement

---

## Task 4.7 — Date péremption / lot (M-STK-07) **P1**

**Modèle complément** :

```ts
export interface LotStock {
  id: string;
  articleId: string;
  numeroLot: string;
  qteInitiale: number;
  qteRestante: number;
  dateReception: string;
  dateFabrication?: string;
  datePeremption?: string;     // calcul + alerte J-30
  fournisseurId?: string;
}
```

**Règle** :
- Si `Article.isPerissable === true` → lot obligatoire à la réception
- Sortie FEFO (First Expired First Out)
- Alerte J-30 + bloquant J-7 (config)

**Acceptance criteria** :
- [ ] Champ lot à la réception (obligatoire si périssable)
- [ ] Stock par lot avec date péremption
- [ ] Alerte dashboard « 5 lots à péremption < 30 j »

---

## Task 4.8 — Demande de transfert workflow (M-STK-08) **P2**

**Workflow** : chantier A demande → magasin valide → transporteur ramasse → chantier B reçoit. Statuts : `BROUILLON → DEMANDEE → VALIDEE → EN_TRANSIT → RECUE`.

Cf Round 1 5.3 transferts (déjà partiel ?) — étendre.

---

## Task 4.9 — CMP / FIFO réel (M-STK-09) **P2**

Round 1 5.5 a `valorisation.facade.ts` agrégé. **Vérifier** que la méthode `costing-methods` (route existante) impacte effectivement le calcul des sorties et de la valorisation.

**Acceptance criteria** :
- [ ] Test unitaire qui valide CMP vs FIFO sur séquence connue
- [ ] UI affiche méthode utilisée par article

---

## Task 4.10 — ABC analysis (M-STK-10) **P2**

Page `/inventory/analyse-abc` : tableau articles triés par valeur consommée YTD avec classes A (80 % de la valeur) / B (15 %) / C (5 %). Recommandation seuils réappro par classe.

---

## Task 4.11 — Suggestion réappro auto (M-STK-11) **P2**

Algorithme : `stock_actuel + reservations - consommation_prevue_n_jours < stock_mini` → générer brouillon DA.

Page `/inventory/reappro-auto` avec liste articles à réapprovisionner + bouton « Générer DA ».

---

## Task 4.12 — Carte dépôts + tournée (M-STK-12) **P3**

Différer. Google Maps Directions API ou OSRM.

---

## Testing

```ts
// e2e/specs/inventory/magasin-chantier.spec.ts
test('Sortie magasin chantier impacte budget réalisé', async ({ page }) => {
  // 1. Goto magasin chantier ch-001
  // 2. Sortie 10 t de ciment
  // 3. Goto budget ch-001 → vérifier ligne MATERIAUX +10 t consommé
});
```

## Dépendances inverses

- 02-chantiers (onglet Stock fiche chantier consomme magasin chantier)
- 15-mobile (scanner, bon matières mobile)
- 03-achats (réappro auto génère DA brouillon)
