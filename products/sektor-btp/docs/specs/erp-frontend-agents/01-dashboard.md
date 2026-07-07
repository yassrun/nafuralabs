# Agent — Dashboard ERP BTP

> **Objet** : tableau de bord d'accueil. Vue 360° instantanée pour DG, DAF, conducteur principal, contrôleur de gestion. Première impression de l'ERP.
> **Route** : `/dashboard` · **Permission** : `dashboard.read` (toujours autorisé en V1).

## 0. Pré-requis

[00-CONVENTIONS](00-CONVENTIONS.md), [00-UX-PRINCIPES](00-UX-PRINCIPES.md). Dépendant des mocks de tous les modules : agréger en lecture seule.

## 1. Page `DashboardPage`

### Layout (PC desktop ≥ 1366px — adaptable mobile)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Bonjour Yassine — 8 mai 2026                                            │
│ 12 chantiers actifs · 4 alertes critiques                  [Filtres ▾]  │
│                                                                         │
│ ┌─KPI──────┐ ┌─KPI──────┐ ┌─KPI──────┐ ┌─KPI──────┐                    │
│ │ Chiffre  │ │ Marge    │ │ Trésor.  │ │ Stock    │                    │
│ │ d'affaire│ │ globale  │ │ banque   │ │ valeur   │                    │
│ │ 24,8 M   │ │  8,4%    │ │  3,2 M   │ │  4,1 M   │                    │
│ │ ▲ +12%   │ │ ▼ -0.6pt │ │ ▲ stable │ │ ▼ -180k  │                    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │
│                                                                         │
│ ┌─ Chantiers actifs ─────────────────┐ ┌─ Alertes ─────────────────┐    │
│ │ Carte / mosaïque cards par chantier│ │ • Rupture ciment dépôt 2 │    │
│ │ avec mini-progress                  │ │ • Pelle JS220 maintenance│    │
│ │ + indicateur retard / marge         │ │ • SIT-CH-002-03 en retard│    │
│ │                                     │ │ • Caution CH-001 à libér.│    │
│ │ ┌──────────────────────────┐        │ │                           │    │
│ │ │ CH-2026-001 R+5 Casa     │        │ │ [Voir tout]              │    │
│ │ │ ▓▓▓▓▓▓▓▓▓░░░ 62%  marge 9%│       │ └───────────────────────────┘    │
│ │ │ Fin prévue 30/09 ✓        │       │ ┌─ Tâches du jour ────────┐    │
│ │ └──────────────────────────┘        │ │ • Valider DA-2026-0142   │    │
│ │ ┌──────────────────────────┐        │ │ • Approuver SIT-CH-001-04│    │
│ │ │ CH-2026-002 Pont Bouregreg│       │ │ • Pointer absence Karim  │    │
│ │ │ ▓▓▓░░░░░░░░░ 24% marge 7% │       │ │ • Réceptionner BL-...    │    │
│ │ │ Retard 12j ⚠              │       │ └───────────────────────────┘    │
│ │ └──────────────────────────┘        │                                  │
│ └────────────────────────────────────┘                                   │
│                                                                         │
│ ┌─ Évolution CA / mois ────┐ ┌─ Top dépenses fournisseurs ────────┐    │
│ │ courbe 12 mois (MAD)      │ │ camembert + liste top 5            │    │
│ └───────────────────────────┘ └────────────────────────────────────┘    │
│                                                                         │
│ ┌─ Engagements vs réalisé ─┐ ┌─ Pointage du jour ─────────────────┐    │
│ │ barres par chantier       │ │ 47/53 employés pointés ce matin    │    │
│ │                           │ │ Lien → /rh/pointage                │    │
│ └───────────────────────────┘ └────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Widgets (8)

#### W1 — KPIs principaux (4 tuiles)

| KPI | Calcul | Trend |
|-----|--------|-------|
| Chiffre d'affaires HT (mois en cours) | Σ factures clients émises ce mois | vs mois précédent |
| Marge globale % | (Σ situations - Σ coûts réalisés) / Σ situations | vs mois précédent |
| Trésorerie banque | Σ soldes banques (lien finance) | vs début du mois |
| Stock valeur (MAD) | Σ valorisation stock total (depuis inventory.suivi.valorisation) | vs début du mois |

Affichage : grand chiffre + variation (▲▼ + couleur + %).

#### W2 — Chantiers actifs

Cards 1/2 page écran. Pour chaque chantier `EN_COURS` ou `SUSPENDU` :

- Code + nom court.
- Mini-progress avancement (avec couleur si en retard).
- Marge % (couleur).
- Date fin prévue.
- Click → fiche chantier.

Tri : date fin prévue ASC. Limite 6 cards visibles, lien `Voir tous (12)`.

#### W3 — Alertes (panneau droit)

Panneau alertes consolidé multi-modules :

| Source | Type | Exemple |
|--------|------|---------|
| Stock | Rupture / sous mini | Ciment CPJ 35 — 12 sacs (mini 50) |
| Matériel | Maintenance due | Pelle JS220 — révision dépassée 8j |
| Chantiers | Retard planning | CH-2026-002 — fin prévue dans -12j |
| Situations | Attente MOA > 30j | SIT-CH-002-03 — soumise 02/04 |
| Finance | Caution à libérer | CH-2024-019 — 1 an depuis réception |
| RH | Contrat à échéance | CDD Karim Alami — fin dans 14j |
| HSE | Incidents non clos | INC-2026-007 — depuis 3j |

Chaque alerte : icône + titre + sous-titre + bouton action contextuel + close.

#### W4 — Tâches du jour

To-do dynamique consolidée pour l'utilisateur courant (V1 mock : assignations en dur dans seeds).

- Validations en attente (DA, BC, situations, congés).
- Pointages incomplets.
- Documents à uploader.
- Click action → page concernée.

#### W5 — Évolution CA / mois

Graphique line chart 12 mois glissants. Données : Σ `Facture.totalHt` par mois.

Lib : `ngx-charts` (déjà courante Angular) ou `Chart.js`.

#### W6 — Top 5 dépenses fournisseurs

Camembert + liste des 5 plus gros fournisseurs (cumul depuis début année). Click segment → liste filtrée.

#### W7 — Engagements vs Réalisé (par chantier)

Bar chart horizontal empilé : pour chaque chantier actif, barres `Réalisé` (vert) / `Engagé non réalisé` (orange) / `Reste à engager` (gris) sur fond `Budget total`.

#### W8 — Pointage du jour

Mini widget : `47/53 employés pointés` + bouton `Voir détail` → `/rh/pointage`.

### Filtres globaux

Drawer droit `Filtres` :
- Période (Aujourd'hui, 7j, 30j, Mois, Trimestre, Année — défaut 30j).
- Chantiers (multi-select).
- Conducteur travaux (qui filtre les chantiers).

Filtres impactent W1, W2, W5, W6, W7.

## 2. Service & calculs

```ts
// applications/erp/dashboard/services/dashboard.facade.ts
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly chantiersMock = inject(ChantiersMockService);
  private readonly inventoryMock = inject(InventoryMockService);
  private readonly venteMock = inject(VentesMockService);
  // ... idem pour les autres modules
  
  readonly kpis = computed<DashboardKpis>(() => {
    const ca = this.venteMock.cumulFacturesMois(this.mois);
    const margeGlobale = this.calcMargeGlobale();
    const tresorerie = this.financeMock.soldeBanques();
    const stockValeur = this.inventoryMock.valorisationTotal();
    return { ca, margeGlobale, tresorerie, stockValeur };
  });
  
  readonly alertes = computed<Alerte[]>(() => [
    ...this.alertesStock(),
    ...this.alertesMateriel(),
    ...this.alertesChantiers(),
    ...this.alertesSituations(),
    ...this.alertesFinance(),
    ...this.alertesRh(),
    ...this.alertesHse(),
  ].sort((a, b) => severite(b) - severite(a)));
  
  readonly chantiersActifs = computed(() => 
    this.chantiersMock.list().filter(c => c.status === 'EN_COURS' || c.status === 'SUSPENDU')
  );
}
```

## 3. Mock alertes (seeds)

Au moins 1 alerte de chaque type pour démo riche. Pré-seeder `~10-15 alertes` total au démarrage. Mises à jour live sur changements de mock (ex: livraison qui fait sortir d'un état d'alerte stock).

## 4. Files to deliver

```
applications/erp/dashboard/
├── dashboard.routes.ts
├── pages/
│   └── dashboard.page.{ts,html,scss}
├── components/
│   ├── kpi-tile/                    # tuile KPI réutilisable (value, label, trend)
│   ├── chantier-card-mini/          # card chantier dashboard
│   ├── alertes-panel/
│   ├── alerte-item/
│   ├── todo-panel/
│   ├── ca-evolution-chart/
│   ├── top-fournisseurs-chart/
│   ├── engagements-bar-chart/
│   └── pointage-mini-widget/
├── models/dashboard.model.ts
└── services/dashboard.facade.ts
```

## 5. UX details

- **Skeleton screens** par widget pendant le chargement (200ms simulés).
- **Refresh manuel** en haut à droite (icon `refresh-cw`).
- **Auto-refresh** : pas en V1 (économie ressources).
- **Empty states** par widget (ex: "Aucune alerte 🎉").
- **Drilldown** : chaque chiffre cliquable navigue vers le module source filtré.
- **Personnalisation** (V2) : drag&drop pour réordonner widgets, masquer widgets — tracer `dashboard.config.ts` user-scoped.
- **Mobile** : layout 1 colonne, KPIs en swipe horizontal, alertes pliables.

## 6. Performance

- LCP < 1.5s.
- Tous les calculs `computed` mémoïsés.
- Pas d'appel http réel V1 (mocks synchrones).
- Charts lazy-loaded (chunk séparé pour `ngx-charts`).

## 7. DoD

- [ ] 8 widgets affichés et opérationnels avec mock.
- [ ] KPIs reflètent les mocks des autres modules (cohérence — un changement dans inventory se voit ici).
- [ ] Alertes consolidées multi-modules avec drilldown click.
- [ ] Charts rendus sans erreur console.
- [ ] Filtres globaux opèrent sur W1, W2, W5, W6, W7.
- [ ] Mobile : layout 1 colonne sans scroll horizontal.
- [ ] Skeleton screens à l'init.
- [ ] Première vue (au-dessus pli) charge sous 1.5s.
- [ ] `dashboard.routes.ts` injecté dans `erp.routes.generated.ts`.
