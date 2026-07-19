# 10 — Qualité & HSE — **Module à activer en production**

> **Sévérité** : P0 (modules M-HSE-01..04) — route `/qualite` → **404 au runtime**
> **Estimation** : 1.5 sprint (S3–S4)
> **Dépendances** : Round 1 09-hse-module (modèles définis, stubs créés), `09-rh` (employés), `02-chantiers` (registres par chantier)

## Findings traités

- [ ] **M-HSE-01** Registre des incidents/accidents (AT, AT trajet, presque accident, dommage matériel) **P0**
- [ ] **M-HSE-02** Non-conformités (NC) + CAPA **P0**
- [ ] **M-HSE-03** PPSPS par chantier **P0**
- [ ] **M-HSE-04** PHS générique société **P0**
- [ ] **M-HSE-05** Causerie 1/4 h sécurité (registre quotidien)
- [ ] **M-HSE-06** Audits HSE checklists configurables
- [ ] **M-HSE-07** EPI dotation + renouvellement
- [ ] **M-HSE-08** FDS / Risques chimiques
- [ ] **M-HSE-09** Plans évacuation + exercices + alarmes
- [ ] **M-HSE-10** KPIs HSE (TF1, TF2, TG, ratio dépenses)
- [ ] **M-HSE-11** Déclarations CNSS DAT + CNAOPS
- [ ] **M-HSE-12** Audits ISO 9001/14001/45001
- [ ] **M-HSE-13** Risques environnementaux chantier
- [ ] **M-HSE-14** PV levée réserves QHSE

## Goal

Activer le **module HSE complet** (Round 1 a posé les modèles + stubs ; l'audit Round 2 constate que la route `/qualite` retourne 404 en runtime). Objectif : couvrir les exigences MOA publics MA + MOA privés majeurs (OCP, ONEE, ADM, Holdings) + obligations légales (CNSS DAT, DUER, PPSPS, médecine du travail).

## Context to read first

```
app/applications/erp/pages/hse/                                 # Round 1 stubs existants
app/applications/erp/pages/hse/incidents/                       # Round 1
app/applications/erp/pages/hse/non-conformites/                 # Round 1
app/applications/erp/pages/hse/inspections/                     # Round 1
app/applications/erp/pages/hse/formations/                      # Round 1
app/applications/erp/pages/hse/epi/                              # Round 1 9.2 volets démarrés
app/applications/erp/pages/hse/duer/                             # Round 1 9.3 matrice
app/applications/erp/pages/hse/ppsps/                            # Round 1 9.3 print démo
app/applications/erp/pages/hse/visites-medicales/                # Round 1 9.4
app/applications/erp/pages/hse/registres/                        # Round 1 9.5
app/applications/erp/hse/hse.routes.ts                           # routing
app/applications/erp/shell/erp-nav.generated.ts                  # nav HSE → /qualite
docs/specs/erp-audit-roadmap/09-hse-module.md                    # Round 1 référence
```

---

## Task 10.0 — Activer la route HSE (Bloquant runtime) **P0**

**Action prioritaire** : diagnostiquer pourquoi `/qualite` retourne 404 alors que :
- Round 1 09-hse-module.md = tâches majoritairement ✅
- Stubs existent dans `app/applications/erp/pages/hse/`

**Hypothèses** :
1. Sidebar pointe vers `/qualite` mais routing déclaré sur `/hse` (alias absent)
2. `HSE_ROUTES` non importé dans `app.routes.ts`
3. Lazy loading qui échoue silencieusement

**Acceptance criteria** :
- [ ] `/qualite` et `/hse` accessibles tous deux (redirect ou alias)
- [ ] Sidebar « Qualité & HSE » charge le tableau de bord HSE
- [ ] Tous les sous-modules accessibles (incidents, NC, inspections, formations, EPI, DUER, PPSPS, visites, registres)

---

## Task 10.1 — Registre incidents/accidents (M-HSE-01) **P0**

Étendre Round 1 (modèle Incident défini). Compléter :
- UI listing avec filtres (chantier, type, gravité, statut)
- Fiche détail avec workflow OUVERT → INVESTIGATION → CLOS
- Si type AT* ou MP → bouton « Déclarer CNSS DAT » (cf §16 M-INT-03)
- Alerte 48h obligatoire CNSS DAT
- Photos + témoins + plan d'action

**Acceptance criteria** :
- [ ] CRUD complet
- [ ] Drill-down chantier + employé
- [ ] Génération PDF déclaration CNSS DAT

---

## Task 10.2 — Non-conformités + CAPA (M-HSE-02) **P0**

Étendre Round 1 (modèle NonConformite défini). Compléter :
- Workflow CAPA (Corrective and Preventive Actions) avec responsable, échéance, vérification efficacité
- Création NC depuis Inspection ou Audit
- Drill-down chantier + zone

---

## Task 10.3 — PPSPS par chantier (M-HSE-03) **P0**

Étendre Round 1 9.3 (matrice DUER + print démo). PPSPS = Plan Particulier Sécurité Protection Santé.

**Modèle** :

```ts
export interface PPSPS {
  id: string;
  chantierId: string;
  version: number;
  redacteurId: string;
  dateRedaction: string;
  sections: PPSPSSection[];
  documentUrl?: string;
  status: 'BROUILLON' | 'VALIDE' | 'APPLICATIF' | 'ARCHIVE';
}

export interface PPSPSSection {
  numero: string;             // « 1.1 », « 2.3 »
  titre: string;
  contenu: string;            // markdown
  risquesAssocies?: string[];  // ref DUER
  procedures?: string[];
}
```

**Sections types** (conforme art. R4532-65 équivalent MA) :
1. Renseignements administratifs
2. Description ouvrage
3. Coordination prévention
4. Mesures organisation générale
5. Mesures techniques (échafaudage, terrassement, etc.)
6. Évaluation risques + DUER
7. Premiers secours
8. Coactivité

**Acceptance criteria** :
- [ ] Éditeur sections markdown
- [ ] PDF officiel généré
- [ ] Version 2/3/... possible avec historique

---

## Task 10.4 — PHS générique société (M-HSE-04) **P0**

PHS = Plan Hygiène Sécurité société (avant PPSPS chantier). Document chapeau qui définit la politique HSE globale. Modèle similaire PPSPS mais niveau société.

---

## Task 10.5 — Causerie 1/4 h sécurité (M-HSE-05) **P1**

**Modèle** :

```ts
export interface Causerie {
  id: string;
  chantierId: string;
  date: string;
  sujet: string;
  animateur: string;
  presentsIds: string[];        // employés
  pointsCles: string[];
  signaturesUrl?: string;       // page signatures
}
```

Mobile-first (chef chantier saisit le matin avant démarrage).

**Acceptance criteria** :
- [ ] CRUD causeries
- [ ] Bibliothèque sujets seedés (20+)
- [ ] Export PDF registre mensuel par chantier

---

## Task 10.6 — Audits HSE (M-HSE-06) **P1**

**Modèle** :

```ts
export interface AuditHSE {
  id: string;
  chantierId: string;
  date: string;
  auditeurId: string;
  templateId: string;
  reponses: ReponseAudit[];
  scoreGlobal: number;            // %
  ncCreees: string[];             // refs NC générées
  photos: string[];
  documentUrl?: string;
}

export interface AuditTemplate {
  id: string;
  nom: string;                    // « Audit chantier mensuel »
  rubriques: { titre: string; items: { question: string; type: 'OUI_NON' | 'NOTE_5' | 'TEXTE' }[] }[];
}
```

**Acceptance criteria** :
- [ ] 3 templates seedés (mensuel chantier, EPI, environnement)
- [ ] Saisie mobile-first
- [ ] Création auto NC si réponse « non » critique

---

## Task 10.7 — EPI dotation + renouvellement (M-HSE-07) **P1**

Étendre Round 1 9.2 (volets démarrés). Compléter :
- Attribution EPI par employé (date attribution, renouvellement prévu, vérifications)
- Alerte J-30 renouvellement
- Lien stock : sortie auto à l'attribution

---

## Task 10.8 — FDS / Risques chimiques (M-HSE-08) **P1**

**Modèle** :

```ts
export interface FDSProduit {
  id: string;
  designation: string;
  fournisseurId: string;
  numeroFds: string;
  dateRevision: string;
  pictogrammes: string[];         // GHS codes
  fdsDocumentUrl: string;
  utilisationsAutorisees: string[];
  formationRequise: boolean;
}
```

Référentiel produits dangereux + qui a été formé + où sont-ils stockés.

---

## Task 10.9 — Plans évacuation + exercices (M-HSE-09) **P1**

Registre des exercices d'évacuation par chantier (date, durée, observations, plan affiché, alarmes testées).

---

## Task 10.10 — KPIs HSE (M-HSE-10) **P1**

**Calculs** :
- **TF1** : nb AT avec arrêt × 1.000.000 / heures travaillées
- **TF2** : nb AT (avec/sans arrêt) × 1.000.000 / heures travaillées
- **TG** : jours arrêt × 1.000 / heures travaillées
- **Ratio dépenses HSE / CA** : %
- **Jours sans accident** : compteur

Page `/hse/tableau-bord` (Round 1 9.6 partiel). Étendre avec graphiques évolution 12 mois + pyramide Bird.

---

## Task 10.11 — Déclarations CNSS DAT + CNAOPS (M-HSE-11) **P1**

Cf §16 M-INT-03 (API CNSS DAT). Bouton sur fiche incident AT → déclaration auto.

CNAOPS = Caisse Nationale Aide Personnes Sans Profession (régime salariés agricoles). Si applicable, déclaration séparée.

---

## Task 10.12 — Audits ISO 9001/14001/45001 (M-HSE-12) **P2**

Checklists configurables pour audits internes/externes ISO. Suivi recommandations + non-conformités.

---

## Task 10.13 — Risques environnementaux chantier (M-HSE-13) **P2**

Registres : consommation eau, déchets (catégories), bruit, poussière. Conformité ISO 14001.

---

## Task 10.14 — PV levée réserves QHSE (M-HSE-14) **P2**

Pour audits / inspections MOA : enregistrement réserves levées avec photos avant/après.

---

## Routing à wirer (corriger Round 1)

**Fichier** : `app/applications/erp/hse/hse.routes.ts`

Vérifier :
- Toutes les routes lazy-load fonctionnent
- Alias `/qualite` → `/hse` ou inverse
- Sidebar pointe vers le bon chemin

---

## Testing

```ts
describe('IncidentService', () => {
  it('génère déclaration CNSS DAT pour AT', () => { /* … */ });
  it('alerte 48h dépassement', () => { /* … */ });
});

describe('HseKpiService', () => {
  it('calcule TF1 = AT × 1M / heures', () => { /* … */ });
});

// e2e
test('/qualite ne retourne plus 404', async ({ page }) => {
  await page.goto('/qualite');
  await expect(page).not.toHaveURL(/404/);
  await expect(page.locator('h1, h2').first()).toContainText(/HSE|Sécurité|Qualité/i);
});
```

## Dépendances inverses

- 09-rh (AT lien Employé + déclaration RH)
- 02-chantiers (PPSPS par chantier + risques chantier)
- 05-materiel (CACES bloquant via §09)
- 11-pilotage (KPI HSE)
- 16-integrations (CNSS DAT API)
