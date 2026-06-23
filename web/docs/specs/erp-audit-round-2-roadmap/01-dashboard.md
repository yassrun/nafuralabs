# 01 — Dashboard (personnalisation, drill, alertes)

> **Sévérité** : P1 (P0 sur M-DASH-03 drill-down)
> **Estimation** : 0.5 sprint (S11)
> **Dépendances** : `13-admin` (roles pour layout par rôle), `14-transverse` (drill-down universel), `11-pilotage`

## Findings traités

- [x] **M-DASH-01** Personnalisation widgets par rôle (drag & drop) — `DashboardLayoutService`, `@angular/cdk/drag-drop`, 3 layouts seedés, reset ; *restant* : palette « + Ajouter widget » (spec 1.4)
- [x] **M-DASH-02** Graphes & tendances (sparklines, courbe CA cumul vs N-1, top 5 alerte, pyramide Bird HSE) — widgets sous `pages/dashboard/widgets/`, `nf-chart`
- [x] **M-DASH-03** Drill-down depuis chaque KPI vers liste filtrée — `KpiTileComponent`, e2e Playwright
- [ ] **M-DASH-04** Alertes temps réel centralisées
- [ ] **M-DASH-05** Filtres dashboard (société, chantier, période, MOA, métier)
- [ ] **M-DASH-06** Export PDF dashboard du jour
- [ ] **M-DASH-07** Widgets HSE & RH enrichis
- [ ] **M-DASH-08** Mode TV plein écran

## Goal

Transformer le dashboard en **vrai poste de pilotage** : par rôle (DG, conducteur, comptable), drillable, filtrable, exportable en PDF du jour, et avec alertes proactives sur les seuils critiques (engagements, situations en retard, cautions expirant).

## Context to read first

```
app/applications/erp/pages/dashboard/dashboard.page.ts       # 8 tuiles actuelles
app/applications/erp/pages/dashboard/dashboard.page.html
app/platform/lib/anatomy/components/organisms/widgets/       # widget list-widget existant
app/applications/erp/shared/services/                         # services KPI
app/applications/erp/shared/iam/                              # rôles disponibles
```

---

## Task 1.1 — Drill-down KPI (M-DASH-03) **P1**

**Fichiers** :
- `app/applications/erp/pages/dashboard/dashboard.page.ts` (+ rendre les tuiles cliquables)
- `app/applications/erp/pages/dashboard/widgets/kpi-tile.component.ts` (nouveau composant ou utiliser `nf-kpi-card`)

**Action** : chaque tuile doit avoir une `route` cible avec `queryParams` de filtre. Exemple :
- « Factures en retard 6 » → `/finance/regles-paiement?filter=overdue`
- « BC en cours » → `/achats/bons-commande?status=EN_COURS`
- « Avancement moyen 47 % » → `/chantiers?sortBy=avancement`

**Acceptance criteria** :
- [x] 8 tuiles → 8 routes drillables
- [x] Hover state visible (curseur pointer + ombre)
- [x] Test e2e : clic sur chaque tuile → vérifier URL cible + filtre appliqué

---

## Task 1.2 — Graphes & tendances (M-DASH-02) **P1**

**Fichiers** :
- `app/applications/erp/pages/dashboard/widgets/ca-cumul-chart.component.ts` (nouveau)
- `app/applications/erp/pages/dashboard/widgets/top-chantiers-alerte.component.ts` (nouveau)
- `app/applications/erp/pages/dashboard/widgets/marge-sparkline.component.ts` (nouveau)

**Librairie** : utiliser `ng2-charts` / `chart.js` déjà présents ou échange avec `apexcharts` (selon décision DS).

**Widgets cibles** :
1. **Courbe CA cumul mensuel** : N vs N-1 (objectif vs réel)
2. **Sparklines marge par chantier** (top 10) — ligne 30 jours
3. **Top 5 chantiers en alerte** (budget >90 %, retard >15 j, RG immobilisée)
4. **Pyramide HSE Bird** (presque-AT → AT bénin → grave → mortel) — cf M-DASH-07

**Acceptance criteria** :
- [x] 4 nouveaux widgets opérationnels avec mock data
- [x] Responsive ≥320px (graphes scrollables horizontalement sur mobile)
- [x] Tooltip détaillé sur chaque point

---

## Task 1.3 — Filtres dashboard (M-DASH-05) **P2**

**Fichiers** :
- `app/applications/erp/pages/dashboard/dashboard-filters.component.ts` (nouveau)
- `app/applications/erp/pages/dashboard/dashboard-filters.service.ts` (nouveau, état partagé)

**Filtres** : société (multi-select), chantier (multi-select avec recherche), période (date range), MOA, métier.

**Acceptance criteria** :
- [ ] Filtres impactent tous les widgets en temps réel
- [ ] Persistance localStorage par utilisateur
- [ ] Reset filtres bouton

---

## Task 1.4 — Personnalisation drag & drop (M-DASH-01) **P1**

**Fichiers** :
- `app/applications/erp/pages/dashboard/dashboard-layout.service.ts` (nouveau)
- Utiliser `@angular/cdk/drag-drop`

**Layouts par défaut** : 3 layouts par rôle (DG, conducteur travaux, comptable). L'utilisateur peut réorganiser, masquer, ajouter widgets. Persistance backend (mock localStorage Round 2, vraie API plus tard).

**Acceptance criteria** :
- [x] 3 layouts par défaut seedés
- [x] Drag & drop fluide (cdk-drop-list)
- [x] Bouton « Réinitialiser layout »
- [ ] Bouton « + Ajouter widget » avec palette

---

## Task 1.5 — Alertes temps réel (M-DASH-04) **P2**

**Fichiers** :
- `app/applications/erp/pages/dashboard/alerts-panel.component.ts` (nouveau)
- `app/applications/erp/shared/services/alerts.service.ts` (nouveau)

**Règles d'alertes** :
- Engagement chantier > 90 % budget
- Situation > 60 jours MOA sans paiement
- Caution < 30 jours d'échéance
- Retard pointage chantier (chef chantier sans pointage > 48 h)

**Acceptance criteria** :
- [ ] Panel d'alertes ouvrable depuis bouton dashboard
- [ ] Compteur badge avec couleur sévérité
- [ ] Drill-down depuis chaque alerte vers l'entité

---

## Task 1.6 — Export PDF dashboard du jour (M-DASH-06) **P2**

**Fichiers** :
- `app/applications/erp/pages/dashboard/dashboard-export.service.ts` (nouveau)

Réutiliser le pipeline PDF de `12-exports` (Round 1) — voir `docs/specs/erp-audit-roadmap/pdf-server-demo.md`.

**Acceptance criteria** :
- [ ] Bouton « Export PDF du jour » génère 1 page A4 avec en-tête société + KPIs + top 5 chantiers
- [ ] Footer : date + utilisateur + société active

---

## Task 1.7 — Mode TV (M-DASH-08) **P3**

Bouton « Mode TV » → plein écran, polling KPIs toutes les 60 s, animations zoom doux. Optionnel mais différenciateur.

---

## Testing

```ts
// e2e/specs/dashboard/drill-down.spec.ts
test('chaque KPI est cliquable et redirige vers la liste filtrée', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Factures en retard');
  await expect(page).toHaveURL(/\/finance.*overdue/);
});

test('export PDF dashboard contient les KPIs', async ({ page }) => {
  await page.goto('/dashboard');
  const download = await Promise.all([page.waitForEvent('download'), page.click('text=Export PDF')]);
  // ... vérifier nom fichier + taille >0
});
```

## Dépendances inverses

- 11-pilotage (M-PIL-04 multi-société utilise filtre société du dashboard)
- 14-transverse (export PDF universel)
