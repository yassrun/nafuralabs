# 07 — Pilotage & Approbations

> **Sévérité** : P0 (manquant) → P1 fonctionnel
> **Estimation** : 2 sprints (S5–S6)
> **Dépendances** : `01-foundations`, `02-chantiers-bugs`, `06-marches-facturation` (KPIs basés sur marges)

## Findings traités

- [ ] **F-09** Module Pilotage / Approbations (parties workflow + KPIs)
- [ ] **F-34** Workflow Approbations transversal (sans engine, statuts décoratifs)

## Goal

Deux modules complémentaires :

1. **Approbations** : engine de workflow réutilisable (DA, BC, factures, congés, avenants…) avec inbox approbateur, délégation, escalade SLA.
2. **Pilotage** : tableaux de bord consolidés (marge par chantier, exposition trésorerie, cash-flow prévisionnel) — **différenciateur commercial**.

## Context to read first

```
app/applications/erp/pages/analytics/                          # tableau-* existants
app/applications/erp/shell/erp-nav.generated.ts                # nav approbations + pilotage
app/platform/lib/anatomy/components/organisms/widgets/          # KPI widget existant
docs/specs/erp-frontend-agents/01-dashboard.md                  # spec dashboard existante
```

---

## PARTIE A — Engine d'Approbations

### Task 7.1 — Modèle workflow + matrice règles

**Modèle générique** :

```ts
export type ApprovalEntityType = 'DA' | 'BC' | 'FACTURE_FOURN' | 'FACTURE_CLIENT' | 'AVENANT' | 'CONGE' | 'NOTE_FRAIS' | 'CONTRAT_ST' | 'PAIEMENT';

export type ApprovalDecision = 'APPROUVE' | 'REJETE' | 'DELEGUE' | 'ESCALADE';

export interface ApprovalRequest {
  id: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityRef: string;                          // numéro lisible
  entitySummary: string;                       // ex. "BC FOURN-2026-0042 - 154 200 MAD - Fournisseur SOMACOR"
  montantConcerne?: number;
  chantierId?: string;
  initiateurId: string;
  initiateurNom: string;
  dateCreation: string;
  status: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE' | 'EXPIRE';
  etapeCourante: number;                      // index dans `etapes`
  etapes: ApprovalEtape[];
  historique: ApprovalAction[];
}

export interface ApprovalEtape {
  ordre: number;
  approbateurRoleId?: string;
  approbateurUserId?: string;
  seuilMontantHt?: number;                     // si > seuil, requiert ce niveau
  dateLimite?: string;                         // SLA
  decision?: ApprovalDecision;
  decisionPar?: string;
  decisionAt?: string;
  commentaire?: string;
}

export interface ApprovalAction {
  date: string;
  par: string;
  action: 'CREATION' | 'APPROBATION' | 'REJET' | 'DELEGATION' | 'ESCALADE' | 'EXPIRATION_SLA';
  commentaire?: string;
}
```

**Matrice règles** :

```ts
export interface ApprovalRule {
  entityType: ApprovalEntityType;
  conditions: {
    montantMin?: number;
    montantMax?: number;
    chantierType?: ChantierType[];
  };
  etapes: Array<{
    role: string;                             // ex. 'CONDUCTEUR_TRAVAUX', 'DAF', 'DG'
    delaiSLA: number;                         // en jours
  }>;
}

const APPROVAL_RULES: ApprovalRule[] = [
  // BC < 50K → CT seul
  { entityType: 'BC', conditions: { montantMax: 50_000 }, etapes: [{ role: 'CONDUCTEUR_TRAVAUX', delaiSLA: 2 }] },
  // BC 50K - 200K → CT + DAF
  { entityType: 'BC', conditions: { montantMin: 50_000, montantMax: 200_000 }, etapes: [
    { role: 'CONDUCTEUR_TRAVAUX', delaiSLA: 2 },
    { role: 'DAF', delaiSLA: 3 },
  ]},
  // BC > 200K → CT + DAF + DG
  { entityType: 'BC', conditions: { montantMin: 200_000 }, etapes: [
    { role: 'CONDUCTEUR_TRAVAUX', delaiSLA: 2 },
    { role: 'DAF', delaiSLA: 3 },
    { role: 'DG', delaiSLA: 5 },
  ]},
  // ... etc pour DA, FACTURE, CONGE
];
```

**Acceptance criteria** :
- [ ] Modèle TS strict
- [ ] Matrice configurable dans `app-settings` (à terme)
- [ ] Service `ApprovalService.requestApproval(entityType, entityId, montant?)` qui crée la request avec les bonnes étapes

---

### Task 7.2 — Inbox approbateur

**Page** : `/approbations` (ou `/approbations/inbox`)

**UX** :
- Tabs : « À traiter » (compteur badge) · « En attente d'autres » · « Mes initiatives » · « Historique »
- Liste : pour chaque approval, carte avec entité résumée + montant + initiateur + SLA restant
- Click → modal détail avec :
  - Récap entité (lien vers détail entité)
  - Historique workflow (timeline)
  - Boutons : « Approuver » · « Rejeter » (commentaire requis) · « Déléguer » (à un autre approbateur)
- Filtres : type d'entité, montant, chantier, urgence

**Acceptance criteria** :
- [ ] Compteur badge sidebar « Approbations » synchronisé
- [ ] Modal détail avec tous les éléments contextuels
- [ ] Approbation/rejet déclenche toast + notification à l'initiateur
- [ ] Délégation : transfert aux nouvelles règles d'approbation

---

### Task 7.3 — Intégration dans les modules existants

**Pattern** : tout module qui a besoin d'approbation expose un bouton « Soumettre pour approbation » sur l'entité en statut `BROUILLON`.

**Implémentation** :

```ts
// dans le facade BC par exemple
async submitForApproval(bcId: string): Promise<void> {
  const bc = await this.api.getById(bcId);
  await this.approvalService.requestApproval('BC', bcId, bc.montantHt);
  bc.status = 'EN_APPROBATION';
  await this.api.update(bc);
  this.toast.success('Soumis pour approbation.');
}
```

**Cibles à patcher** :
- DA Achats
- BC Achats
- Facture Fournisseur
- Avenant Marché
- Congé RH
- Contrat Sous-traitance
- Paiement

**Acceptance criteria** :
- [ ] Sur 7 entités, bouton « Soumettre » fonctionne
- [ ] Statut entité passe en `EN_APPROBATION`
- [ ] Approbation finale → entité passe en `APPROUVE` (et autorise les actions suivantes)

---

### Task 7.4 — Notifications + escalade SLA

**Notifications** :
- À l'approbateur quand request créée
- À l'initiateur quand approuvée/rejetée
- Rappel J-1 SLA expiry
- À l'approbateur de niveau supérieur si SLA expiré (auto-escalade)

**Service `ApprovalScheduler`** : tâche cron côté backend (mock côté front avec interval) qui scan les requests en attente et déclenche escalades + notifications.

**Acceptance criteria** :
- [ ] Notification cloche apparaît à l'approbateur cible
- [ ] Test e2e : créer request → vérifier notification apparaît dans `/notifications`

---

## PARTIE B — Pilotage & KPIs

### Task 7.5 — Dashboard pilotage par chantier

**Page** : `/pilotage/chantiers` (ou `/pilotage/marges-chantier`)

**Vue** : tableau avec colonnes :
- Code chantier
- Nom
- Montant marché HT (initial + avenants)
- Cumul facturé HT
- % facturé
- Avancement physique %
- **Différentiel facturé/avancement** (alerte si > 10%)
- Cumul réalisé budget HT (depuis stock + paie + ST)
- **Marge brute projetée** (marché - réalisé prévu)
- **Marge en %** (KPI critique)
- Cash position : cumul encaissé - cumul décaissé

**Couleurs** : marge < 5% rouge, 5-15% ambre, > 15% vert.

**Drill-down** : click ligne → page détaillée par chantier avec décomposition.

**Acceptance criteria** :
- [ ] Tableau performant pour 50+ chantiers
- [ ] Tri par marge (DESC/ASC)
- [ ] Filtres par statut, conducteur, ville
- [ ] Export CSV/XLSX

---

### Task 7.6 — Cash-flow prévisionnel

**Page** : `/pilotage/cash-flow`

**Vue** : courbe + tableau mois par mois sur 12 mois glissants :
- **Encaissements prévus** : factures émises non payées + factures à émettre selon planning situations
- **Décaissements prévus** : BC validés, factures fournisseurs en attente, paie, charges fixes
- **Solde mensuel** + **solde cumulé**
- Ligne « seuil minimal » (configurable, ex. 1M MAD)

**Cas d'alerte** : solde cumulé < seuil → notification cloche + email DG.

**Acceptance criteria** :
- [ ] Graphe responsive (Chart.js ou ngx-charts)
- [ ] Switch granularité : mois / semaine
- [ ] Export PDF du forecast pour comité

---

### Task 7.7 — KPI marge consolidée

**Page** : `/pilotage/marge-consolidee` ou widget dashboard

**KPIs** :
- Marge globale entreprise % (Σmarge / Σmarché)
- Top 5 chantiers les plus rentables
- Bottom 5 chantiers en risque
- Évolution marge mois/mois (12 mois)

**Source** : agrégation de tous les chantiers.

**Acceptance criteria** :
- [ ] KPIs visibles sur tableau de bord
- [ ] Drill-down vers liste pilotage par chantier (Task 7.5)

---

### Task 7.8 — Alertes pilotage transversales

**Catégories** (intégrées au centre notifications cf F-12) :
- Chantier en dépassement budget (réalisé > 90% × budget)
- Cash-flow projeté < seuil
- Marge projetée < 5%
- Caution expirant < J+30 (cf 06-marches Task 6.4)
- Facture client en retard > 60 jours
- Stock article critique en rupture
- Approbation en retard SLA

---

## Routing à wirer

**Fichier à créer** : `app/applications/erp/pilotage/pilotage.routes.ts`

```ts
export const PILOTAGE_ROUTES: Routes = [
  { path: 'pilotage', pathMatch: 'full', redirectTo: 'pilotage/marges-chantier' },
  { path: 'pilotage/marges-chantier', loadComponent: () => import('../pages/pilotage/marges-chantier/marges-chantier.page').then(m => m.MargesChantierPage) },
  { path: 'pilotage/cash-flow', loadComponent: () => import('../pages/pilotage/cash-flow/cash-flow.page').then(m => m.CashFlowPage) },
  { path: 'pilotage/marge-consolidee', loadComponent: () => import('../pages/pilotage/marge-consolidee/marge-consolidee.page').then(m => m.MargeConsolideePage) },
];
```

**Fichier à créer** : `app/applications/erp/approbations/approbations.routes.ts`

```ts
export const APPROBATIONS_ROUTES: Routes = [
  { path: 'approbations', pathMatch: 'full', loadComponent: () => import('../pages/approbations/inbox/inbox.page').then(m => m.ApprobationsInboxPage) },
  { path: 'approbations/historique', loadComponent: () => import('../pages/approbations/historique/historique.page').then(m => m.ApprobationsHistoriquePage) },
  { path: 'approbations/regles', loadComponent: () => import('../pages/approbations/regles/regles.page').then(m => m.ApprobationsReglesPage) },  // admin only
  { path: 'approbations/:id', loadComponent: () => import('../pages/approbations/detail/approbation-detail.page').then(m => m.ApprobationDetailPage) },
];
```

---

## Testing

### Tests E2E

```ts
test('workflow approbation BC > 50K', async ({ page }) => {
  // 1. créer BC 80 000 MAD
  await page.goto('/achats/commandes/new');
  // ... remplir
  await page.locator('button', { name: 'Soumettre pour approbation' }).click();

  // 2. login en tant que CT
  // 3. /approbations inbox - voir BC en haut
  // 4. approuver
  // 5. login en tant que DAF
  // 6. /approbations - voir BC
  // 7. approuver
  // 8. retour BC : statut APPROUVE
});

test('marge chantier alerte < 5%', async ({ page }) => {
  await page.goto('/pilotage/marges-chantier');
  await expect(page.locator('tr.alert-marge')).toHaveCount(1); // au moins un chantier en alerte
});
```

## Dépendances inverses

- 08-administration : matrice règles approbation configurable par admin
- 12-exports-impressions : PDF dashboards pilotage pour comité
