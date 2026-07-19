# 14 — Tests, Audit log, Qualité CI

> **Sévérité** : P2
> **Estimation** : 1.5 sprint (S9–S10), parallèle des autres
> **Dépendances** : `01-foundations`, `08-administration` (audit log model)

## Findings traités

- [ ] **F-29** Pas d'historique / piste d'audit
- [ ] **TEST-01** Couverture tests unitaires services calcul fiscal/paie ≥ 95%
- [ ] **TEST-02** Tests e2e Playwright des parcours critiques
- [ ] **TEST-03** Tests visuels (Percy / Chromatic) sur Design System
- [ ] **A11Y-01** Audit axe-core en CI
- [ ] **A11Y-02** Focus ring, navigation clavier, contrastes
- [ ] **PERF-01** Audit Lighthouse en CI

## Goal

Qualité industrielle : tests automatisés à tous les niveaux, audit log complet, CI bloquante sur régressions.

## Architecture tests

```
e2e/                                          # Playwright
├── fixtures/                                  # données test
├── helpers/                                   # auth, navigation
├── specs/
│   ├── foundations/                           # cf 01-foundations Tasks 1.x tests
│   ├── chantiers/
│   ├── achats-cycle-complet/                  # parcours BC → réception → facture → paiement
│   ├── marches-cycle-complet/                 # marché → situation → facture
│   ├── paie/
│   ├── pointage-mobile-offline/
│   └── a11y/
└── playwright.config.ts

app/**/*.spec.ts                              # tests unitaires (Karma/Jest)
```

---

## Task 14.1 — Audit log centralisé (F-29)

Voir `08-administration.md` Task 8.6 pour le modèle.

**Implémentation transverse** :

1. **Intercepteur HTTP** : capture toute requête PUT/POST/DELETE → audit entry
2. **Décorateur de service** : wrap les méthodes mutation avec audit logging
3. **Diff calculator** : pour `UPDATE`, compare ancien vs nouveau et stocke uniquement les champs modifiés

**Pattern** :

```ts
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  log(entry: Omit<AuditEntry, 'id' | 'timestamp' | 'userId' | 'companyId'>): void {
    const fullEntry: AuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: this.session.userId(),
      companyId: this.session.companyId(),
    };
    this.store.append(fullEntry);
  }
}
```

**Acceptance criteria** :
- [ ] 100% des actions create/update/delete loggées
- [ ] Diff visible avec ancien/nouveau valeur
- [ ] Recherche/filtre fonctionnel sur 10k+ entrées (cf virtualisation Task 4.1)
- [ ] Pas de données sensibles (mots de passe, secrets) dans le log

---

## Task 14.2 — Tests unitaires services calcul

**Cibles prioritaires (couverture 95%+)** :

1. **`PaieEngineService`** (cf 10-Task 10.2) — moteur paie
2. **`TvaEngineService`** — calcul TVA
3. **`RetenueSourceService`** — RAS 5%
4. **`TimbreFiscalService`** — timbre
5. **`FormulRevisionKService`** — calcul K marchés
6. **`StockValorisationService`** — PMP / FIFO
7. **`CashFlowProjectionService`** — prévision trésorerie
8. **`ApprovalRulesService`** — matrice règles approbation

**Pattern test** :

```ts
describe('PaieEngineService', () => {
  let service: PaieEngineService;
  beforeEach(() => { service = TestBed.inject(PaieEngineService); });

  describe('cas réels MA 2026', () => {
    const cases = [
      { brut: 5_000, cadre: false, charges: 0, attendu: { net: 4_621.70, igr: 41.30 } },
      { brut: 12_000, cadre: false, charges: 2, attendu: { net: 9_280, igr: 1_400 } },
      { brut: 34_500, cadre: true, charges: 3, attendu: { net: 20_700, igr: 10_678, totalCotSal: 3_120 } },
      { brut: 50_000, cadre: true, charges: 0, attendu: { net: 27_400, igr: 16_800 } },
    ];

    cases.forEach(({ brut, cadre, charges, attendu }) => {
      it(`brut ${brut} cadre=${cadre} charges=${charges}`, () => {
        const r = service.calculerFiche({ salaireBase: brut, estCadre: cadre, personnesACharge: charges });
        expect(r.net).toBeCloseTo(attendu.net, 0);
        expect(r.igr).toBeCloseTo(attendu.igr, 0);
      });
    });
  });
});
```

**Acceptance criteria** :
- [ ] Couverture services calcul ≥ 95% (mesuré avec Istanbul)
- [ ] CI bloque si couverture chute
- [ ] Cas réels validés avec un expert paie/fiscal MA

---

## Task 14.3 — Tests e2e parcours critiques (Playwright)

**Parcours obligatoires** :

### P1. Cycle achats complet
```
DA → BC → Réception (BL) → Facture fournisseur → Paiement
```
Vérifier : stock incrémenté, budget chantier mis à jour, audit log complet.

### P2. Cycle marché complet
```
Création marché → Avenant → Situation → Facturation → Caution levée → DGD
```

### P3. Cycle RH paie
```
Embauche → Pointage mensuel → Variables paie → Calcul fiche → Validation → Bulletins → DAMANCOM XML
```

### P4. Cycle approbation BC > seuil
```
Création BC 200K → Soumission → CT approuve → DAF approuve → DG approuve → BC en exécution
```

### P5. Drill-down chantier
```
/chantiers (liste) → click → /chantiers/CH-2026-003 → onglets Phases/Budget/Situations
```

### P6. Pointage mobile offline (cf 13-Task 13.6)

**Acceptance criteria** :
- [ ] 6+ parcours e2e verts
- [ ] CI execute Playwright sur PR (avec capture trace pour échec)
- [ ] Tests stables (no flaky : retry 2× max)

---

## Task 14.4 — Audit accessibilité axe-core en CI

**Setup** :

```bash
npm i -D @axe-core/playwright
```

```ts
// e2e/specs/a11y/critical-pages.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  '/dashboard',
  '/chantiers',
  '/chantiers/CH-2026-003',
  '/achats/commandes',
  '/marches/factures',
  '/finance/journaux',
  '/rh/employes',
  '/hse/incidents',
  '/administration/members',
];

for (const url of PAGES) {
  test(`a11y ${url}`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });
}
```

**Acceptance criteria** :
- [ ] 0 violation critique sur les 9 pages clés
- [ ] CI bloque si nouvelle violation introduite

---

## Task 14.5 — Lighthouse CI

**Setup** : `@lhci/cli`

```yaml
# .github/workflows/lighthouse.yml
- name: Lighthouse CI
  run: |
    npm i -g @lhci/cli
    lhci autorun --config=.lighthouserc.json
```

```json
// .lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4200/dashboard", "http://localhost:4200/chantiers"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.7 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.85 }]
      }
    }
  }
}
```

**Acceptance criteria** :
- [ ] Score perf ≥ 70 (cible 90 en S12)
- [ ] Score a11y ≥ 90
- [ ] Bloquant en CI

---

## Task 14.6 — Tests visuels (Storybook + Chromatic)

**Setup** :

```bash
npx storybook@latest init
```

**Stories obligatoires** : tous les composants atomes/molecules du DS (cf 11-design-system).

**Chromatic** : snapshot visuel par composant ; régression bloquante en CI.

**Acceptance criteria** :
- [ ] 30+ stories pour les composants DS
- [ ] CI Chromatic verte sur main
- [ ] Régressions visuelles détectées avant merge

---

## Task 14.7 — Tests intégration mocks (load + chaos)

**Concept** : lancer un seed mock géant (1000 chantiers, 50k mouvements stock, 10k factures) et vérifier perfs.

**Outil** : script Node qui génère le seed + Playwright qui mesure :
- Temps premier render listing
- Scroll fluidité (FPS)
- Mémoire heap après navigation 50 pages

**Acceptance criteria** :
- [ ] Listing 1000 lignes : premier render < 500ms
- [ ] Scroll : > 50 FPS continus
- [ ] Memory leak : navigation 50 pages ≤ +50MB heap

---

## Task 14.8 — Documentation pour les agents implémenteurs

**Fichier** : `docs/specs/erp-audit-roadmap/_TESTING_GUIDE.md`

Contenu :
- Comment lancer les tests localement
- Comment écrire un test e2e (template + bonnes pratiques)
- Comment écrire un test unit
- Quels patterns éviter (timer fakes, racing conditions)
- Comment ajouter un check axe-core sur une nouvelle page
- Comment seed mock spécifique pour un test

**Acceptance criteria** :
- [ ] Guide lisible par un agent qui n'a jamais travaillé sur le projet
- [ ] Onboarding test < 30 min
