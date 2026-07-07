# 05 — Module Stock & Logistique (de zéro)

> **Sévérité** : P0
> **Estimation** : 2 sprints (S3–S4)
> **Dépendances** : `01-foundations`. Réutilise `app/applications/erp/pages/inventory/` (déjà à 70% — sert de référence pattern).

## Findings traités

- [ ] **F-07** Module Stock & Logistique 100% absent (tous redirigent vers `/`)

## Goal

Module Stock complet permettant de gérer **béton, fer, ciment, agrégats** sur les chantiers BTP, avec valorisation PMP/FIFO, transferts entre magasins, alertes ruptures et **liaison sortie stock → consommation chantier** (clé du contrôle budget vs réalisé).

## Context to read first

```
app/applications/erp/pages/inventory/                          # base existante (70% complet)
app/applications/erp/inventory/inventory.routes.ts             # routing module
app/applications/erp/inventory/mock/                           # mock service
docs/specs/erp-frontend-agents/04-stock-refinement.md          # spec existante détaillée
```

⚠️ **Note importante** : « Stock & Logistique » dans la sidebar (zone `operations`, route attendue `/stock`) est **différent** de `/inventory` qui existe déjà. Soit on consolide les deux sous une seule URL `/stock`, soit on traite Stock comme un wrapper UX au-dessus d'inventory.

**Décision recommandée** : URL canonique `/stock/*`. `/inventory/*` reste comme alias pour la compat code généré, mais le sidebar pointe vers `/stock/*`.

## Architecture cible

```
app/applications/erp/pages/stock/
├── stock.routes.ts
├── magasins/                    # F-07.1
│   ├── magasin-listing/         # liste magasins (référentiel)
│   ├── magasin-detail/          # capacités, responsable, adresse, géoloc
│   ├── config/                  # listing + detail config-driven
│   ├── models/                  # Magasin
│   └── services/                # facade + mock
├── articles/                    # F-07.2
│   ├── article-listing/
│   ├── article-detail/          # seuils min/max, fournisseurs préférés, prix dernier
│   ├── config/
│   ├── models/                  # Article (UM, type, famille)
│   └── services/
├── mouvements/                  # F-07.3
│   ├── entrees/                 # BL fournisseur
│   ├── sorties/                 # consommation chantier
│   ├── transferts/              # entre magasins
│   ├── retours/                 # vers fournisseur ou inter-magasin
│   ├── ajustements/             # inventaires écarts
│   ├── config/
│   ├── models/                  # MouvementStock
│   └── services/
├── inventaires/                 # F-07.4
│   ├── inventaire-listing/      # campagnes d'inventaire
│   ├── inventaire-saisie/       # saisie comptage par magasin
│   ├── ecarts/                  # rapport écarts → ajustements
│   ├── config/
│   ├── models/
│   └── services/
├── etat/                        # F-07.5
│   ├── etat-stock.page.ts       # vue par magasin/article avec valorisation
│   └── valorisation.page.ts     # PMP / FIFO toggle
├── alertes/                     # F-07.6
│   └── alertes.page.ts          # ruptures, sous-stock, péremption
└── shared/
    └── chantier-consommation-link.service.ts  # F-07.7 : lien sortie → consommation chantier
```

---

## Task 5.1 — Magasins (référentiel + capacités)

**Modèle** :

```ts
export interface Magasin {
  id: string;
  code: string;                  // MAG-CASA-01
  nom: string;
  type: 'CHANTIER' | 'ENTREPOT' | 'TRANSIT' | 'VIRTUEL';
  chantierId?: string;           // si type CHANTIER
  adresse?: string;
  ville: string;
  latitude?: number;
  longitude?: number;
  responsableId?: string;
  responsableNom?: string;
  capaciteM3?: number;
  capaciteTonnes?: number;
  isActive: boolean;
  notes?: string;
}
```

**Pages** :
- Liste `/stock/magasins` : Code · Nom · Type · Ville · Responsable · Capacité · Statut
- Détail `/stock/magasins/:id` : carte d'identité + onglet « Articles en stock » (count + valeur)

**Acceptance criteria** :
- [ ] Seed 6 magasins (1 entrepôt central Casa, 5 magasins chantier)
- [ ] CRUD complet
- [ ] Lien depuis fiche chantier vers magasin chantier associé

---

## Task 5.2 — Articles (référentiel)

**Modèle** :

```ts
export type UniteMesure = 'KG' | 'TONNE' | 'L' | 'M' | 'M2' | 'M3' | 'U' | 'SAC' | 'PAQUET';
export type FamilleArticle = 'BETON' | 'FER' | 'CIMENT' | 'AGREGAT' | 'BRIQUE' | 'BOIS' | 'PEINTURE' | 'ELECTRIQUE' | 'PLOMBERIE' | 'OUTILLAGE' | 'CONSOMMABLE' | 'AUTRE';

export interface Article {
  id: string;
  code: string;                          // ART-001
  designation: string;
  description?: string;
  famille: FamilleArticle;
  uniteMesure: UniteMesure;
  uniteSecondaire?: UniteMesure;          // ex. SAC ↔ KG (1 sac = 50 kg)
  conversionFactor?: number;
  fournisseursPreferreIds: string[];
  seuilMin: number;
  seuilMax?: number;
  delaiReapproJours: number;
  prixAchatDernier?: number;             // historique
  pmp?: number;                          // prix moyen pondéré
  isActive: boolean;
  isPerissable: boolean;
  isSerialise: boolean;                  // si oui, suivi par n° série
}
```

**Pages** :
- Liste `/stock/articles` avec filtres famille + recherche + statut
- Détail `/stock/articles/:id` avec onglets : Identification · Stock par magasin · Mouvements · Fournisseurs · Prix

**Acceptance criteria** :
- [ ] Seed ~80 articles BTP réalistes (Casa) : ciment 32.5R, fer 8/10/12 mm, gravier 0/15 + 15/25, sable, ferraillage, etc.
- [ ] Prix d'achat moyen pondéré (PMP) calculé à chaque entrée
- [ ] Lien vers fournisseurs préférés cliquable

---

## Task 5.3 — Mouvements (entrées, sorties, transferts, retours, ajustements)

**Modèle unifié** :

```ts
export type MouvementType = 'ENTREE_BL' | 'SORTIE_CHANTIER' | 'TRANSFERT' | 'RETOUR_FOURNISSEUR' | 'RETOUR_CHANTIER' | 'AJUSTEMENT_PLUS' | 'AJUSTEMENT_MOINS' | 'INVENTAIRE_INITIAL';

export interface MouvementStock {
  id: string;
  numero: string;                        // MVT-2026-00001
  type: MouvementType;
  date: string;
  magasinSourceId?: string;              // requis sauf ENTREE/INVENTAIRE
  magasinDestId?: string;                // requis sauf SORTIE/RETOUR_FOURNISSEUR
  chantierId?: string;                   // si SORTIE_CHANTIER ou RETOUR_CHANTIER
  bcFournisseurId?: string;              // si ENTREE_BL
  blReference?: string;                  // n° BL papier
  motif?: string;                        // si AJUSTEMENT
  responsableId: string;
  validePar?: string;
  status: 'BROUILLON' | 'VALIDE' | 'ANNULE';
  lignes: MouvementLigne[];
}

export interface MouvementLigne {
  id: string;
  mouvementId: string;
  articleId: string;
  articleCode: string;
  articleDesignation: string;
  quantite: number;
  unite: UniteMesure;
  prixUnitaire?: number;                 // si ENTREE
  totalHt?: number;
  numeroSerie?: string;                  // si serialisé
  lot?: string;                          // pour péremption
  datePeremption?: string;
}
```

**Pages** :
- `/stock/mouvements/entrees` : listing BL fournisseurs + saisie depuis BC
- `/stock/mouvements/sorties` : listing sorties chantier
- `/stock/mouvements/transferts` : entre magasins
- `/stock/mouvements/retours` : vers fournisseur ou retour chantier
- `/stock/mouvements/ajustements` : suite à inventaire

**UX critique** :
- **Saisie BL fournisseur** : depuis BC, pré-remplir lignes. Vérifier écart quantité commandée vs livrée → alerte.
- **Sortie chantier** : sélecteur chantier → magasin chantier sélectionné par défaut. Lien automatique vers consommation budget.
- **Validation 2 yeux** : `BROUILLON → VALIDE` requiert un rôle `STOCK_VALIDATEUR`.

**Acceptance criteria** :
- [ ] CRUD pour chaque type
- [ ] Stock par magasin/article recalculé à chaque mouvement validé
- [ ] PMP recalculé à chaque ENTREE_BL
- [ ] Audit log (cf F-29) sur chaque mouvement
- [ ] Test e2e : créer BC → réception → vérifier stock incrémenté

---

## Task 5.4 — Inventaires

**Workflow** :
1. Création campagne d'inventaire (date, magasin(s), responsable)
2. Saisie comptage par article (mobile-friendly pour magasin chantier)
3. Calcul écarts vs stock théorique
4. Validation → génère mouvements `AJUSTEMENT_PLUS/MOINS`

**Modèle** :

```ts
export interface CampagneInventaire {
  id: string;
  numero: string;
  dateInventaire: string;
  magasinIds: string[];
  responsableId: string;
  status: 'PLANIFIEE' | 'EN_COURS' | 'CLOS' | 'VALIDEE';
  lignes: InventaireLigne[];
}

export interface InventaireLigne {
  id: string;
  campagneId: string;
  articleId: string;
  magasinId: string;
  qteTheorique: number;
  qteCompte: number;
  ecart: number;                         // qteCompte - qteTheorique
  motif?: string;
  status: 'A_COMPTER' | 'COMPTE' | 'AJUSTE';
}
```

**Acceptance criteria** :
- [ ] Saisie tactile-friendly (clavier numérique sur mobile)
- [ ] Rapport d'écart exportable CSV
- [ ] Validation génère mouvements automatiques

---

## Task 5.5 — État stock + valorisation PMP/FIFO

**Page** : `/stock/etat`

**Vues** :
1. Pivot par magasin/article : quantité · valeur PMP · valeur dernier prix
2. Filtres : magasin, famille, statut (rupture / sous-stock / OK), recherche article
3. Toggle : valorisation PMP vs FIFO (FIFO requis pour audit fiscal MA)

**Calcul FIFO** : conserver les lots d'entrée et sortir dans l'ordre chronologique. Mock : tableau `LotEntree[]` par article/magasin avec date + quantité + prix.

**Acceptance criteria** :
- [ ] Tableau pivot performant (cf virtualisation Task 4.1) sur > 100 articles
- [ ] Switch PMP/FIFO change la colonne « Valeur » en temps réel
- [ ] Export CSV/XLSX

---

## Task 5.6 — Alertes stock

**Page** : `/stock/alertes`

**Catégories** :
1. **Rupture** : quantité = 0 sur article actif
2. **Sous-stock** : quantité < seuilMin
3. **Péremption proche** : datePeremption < J+30
4. **Sur-stock** : quantité > seuilMax (immobilisation cash)

**Alertes intégrées au centre notifications** (cf F-12).

**Acceptance criteria** :
- [ ] Page alertes avec compteurs par catégorie
- [ ] Click sur alerte → navigue vers article concerné
- [ ] Notifications dans la cloche (cf 03-shell-ux Task 3.3)

---

## Task 5.7 — Liaison sortie stock → consommation chantier ⚠️ CLÉ MÉTIER

**Goal** : chaque sortie chantier validée alimente automatiquement le « réalisé » du budget chantier, par poste analytique.

**Architecture** :
1. Article a un mapping vers un poste budget : `Article.posteBudgetId` (ex. `BETON` → `02-GROS-OEUVRE-BETON`).
2. Sortie chantier validée → publie un événement `StockOutEvent` capté par `BudgetService`.
3. `BudgetService.recordConsommation(chantierId, posteId, montant)` met à jour le réalisé.

**Sans event bus** (mock) : le facade Stock appelle directement le facade Budget.

**Modèle complémentaire** :

```ts
// app/applications/erp/pages/stock/articles/models/index.ts
export interface ArticlePosteMapping {
  articleId: string;
  chantierId?: string;        // optionnel : règle globale ou per-chantier
  posteBudgetCode: string;     // ex. '02.01.03'
}
```

**UX** : sur la fiche article, onglet « Mapping budget » pour configurer.

**Acceptance criteria** :
- [ ] Sortie chantier validée → réalisé budget incrémenté du `quantite × prixPMP`
- [ ] Vue « Réalisé » sur fiche budget chantier mise à jour en live
- [ ] Test e2e : créer sortie 50 kg ciment → vérifier réalisé budget incrémenté

---

## Routing à wirer

**Fichier à créer** : `app/applications/erp/pages/stock/stock.routes.ts`

```ts
export const STOCK_ROUTES: Routes = [
  { path: 'stock', pathMatch: 'full', redirectTo: 'stock/etat' },
  { path: 'stock/etat', loadComponent: () => import('./etat/etat-stock.page').then(m => m.EtatStockPage) },
  { path: 'stock/valorisation', loadComponent: () => import('./etat/valorisation.page').then(m => m.ValorisationPage) },
  { path: 'stock/alertes', loadComponent: () => import('./alertes/alertes.page').then(m => m.AlertesPage) },
  { path: 'stock/magasins', loadChildren: () => import('./magasins/magasins.routes').then(m => m.MAGASINS_ROUTES) },
  { path: 'stock/articles', loadChildren: () => import('./articles/articles.routes').then(m => m.ARTICLES_ROUTES) },
  { path: 'stock/mouvements', loadChildren: () => import('./mouvements/mouvements.routes').then(m => m.MOUVEMENTS_ROUTES) },
  { path: 'stock/inventaires', loadChildren: () => import('./inventaires/inventaires.routes').then(m => m.INVENTAIRES_ROUTES) },
];
```

**Et dans** : `app/applications/erp/inventory/inventory.routes.ts` (ou créer `stock.routes.ts` parent) — wirer dans le routeur principal ERP.

---

## Testing global

### E2E parcours critique

```ts
test('cycle complet : BC → réception → sortie chantier → réalisé budget', async ({ page }) => {
  // 1. créer BC fournisseur 100 sacs ciment 50 MAD
  await page.goto('/achats/commandes/new');
  // ... remplir
  // 2. réceptionner via /stock/mouvements/entrees
  await page.goto('/stock/mouvements/entrees/new');
  // ... lier au BC
  // 3. vérifier stock incrémenté
  await page.goto('/stock/etat');
  await expect(page.getByText('100')).toBeVisible();
  // 4. sortie chantier 30 sacs
  await page.goto('/stock/mouvements/sorties/new');
  // ...
  // 5. vérifier réalisé budget chantier
  await page.goto('/chantiers/budget/CH-2026-003');
  await expect(page.getByText('1 500 MAD')).toBeVisible(); // 30 × 50
});
```

## Dépendances inverses

- 06-marches-facturation : la facturation des situations consomme les sorties chantier comme justificatifs
- 07-pilotage-approbations : alertes stock dans les KPIs marge
