# 12 — Approbations (Engine workflow, multi-types, inbox, délégation, matrice)

> **Sévérité** : P0 (M-APR-01..03) — gouvernance entreprise absente
> **Estimation** : 1 sprint (S2)
> **Dépendances** : Round 1 07-pilotage-approbations (barre soumission + inbox démo), `13-admin` (rôles + sociétés)

## Findings traités

- [x] **M-APR-01** Engine workflow générique **P0**
- [x] **M-APR-02** Approbations multi-types **P0**
- [x] **M-APR-03** Inbox approbateur + audit log immuable **P0**
- [ ] **M-APR-04** Délégation absence approbateur
- [ ] **M-APR-05** Notifications email/push/in-app + escalade SLA
- [ ] **M-APR-06** Configuration matricielle (société/division/chantier/montant)
- [ ] **M-APR-07** Approbation mobile 1-clic
- [ ] **M-APR-08** Audit trail hash & timestamping (P2)

## Goal

Construire un **engine workflow générique** capable de gérer les approbations de tous types d'entités (DA, AO attribution, BC, facture fournisseur, situation, congés, paie, virement bancaire, avenant, OS), avec configuration matricielle par société/division/chantier × montant × rôles, délégation absence, notifications multi-canal + escalade SLA, et inbox approbateur productif.

## Context to read first

```
app/applications/erp/pages/approbations/                           # Round 1 inbox
app/applications/erp/approbations/services/                        # Round 1 services
app/applications/erp/approbations/services/approval-rules.service.ts   # Round 1 7.2
app/applications/erp/approbations/services/approbations-mock.service.ts # Round 1
app/applications/erp/shared/components/submit-approval-button/      # Round 1 7.3
```

---

## Task 12.1 — Engine workflow générique (M-APR-01) **P0**

**Modèles** :

```ts
export interface ApprovalWorkflow {
  id: string;
  nom: string;                          // « Workflow BC standard »
  entiteType: ApprovalEntityType;       // DA | AO | BC | FF | SIT | CONGE | PAIE | VIR | AVN | OS
  conditions: ApprovalCondition[];      // matchers
  etapes: EtapeWorkflow[];               // série ou parallèle
  delaiSLAJours: number;                 // alerte si dépassé
  escaladeApresJ?: number;               // jours → escalade
  societeId?: string;                    // null = global
  actif: boolean;
}

export interface ApprovalCondition {
  champ: string;                         // « montant »
  operateur: '<' | '<=' | '=' | '>=' | '>' | 'IN';
  valeur: number | string | string[];
}

export interface EtapeWorkflow {
  ordre: number;                         // 1, 2, 3...
  type: 'SERIE' | 'PARALLELE';
  approbateurs: ApprovateurConfig[];     // rôles ou personnes
  quorumPct?: number;                    // si PARALLELE : % requis
  optionnelle?: boolean;
}

export interface ApprovateurConfig {
  type: 'ROLE' | 'PERSONNE' | 'MANAGER' | 'DELEGATION';
  ref: string;                           // role id ou user id
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  entiteType: ApprovalEntityType;
  entiteId: string;                      // id de l'entité (BC, FF, etc.)
  entiteResume: string;                  // « BC-2026-042 — 152 000 MAD »
  initiateurId: string;
  dateInitiation: string;
  etatActuel: 'EN_COURS' | 'APPROUVE' | 'REJETE' | 'ANNULE' | 'EN_ESCALADE';
  etapeActuelleOrdre: number;
  historique: ApprovalEvent[];
}

export interface ApprovalEvent {
  date: string;
  approbateurId: string;
  action: 'SOUMIS' | 'APPROUVE' | 'REJETE' | 'DEMANDE_COMPLEMENT' | 'DELEGUE' | 'COMMENTE' | 'ESCALADE';
  commentaire?: string;
  hash?: string;                         // chaîne hash immuable (M-APR-08)
}
```

**Action** :
1. Service `ApprovalEngineService` qui :
   - À l'événement « SOUMIS_APPROBATION » d'une entité, trouve le workflow applicable (par type + conditions)
   - Crée `ApprovalRequest` + initialise étape 1
   - Notifie approbateur(s) de l'étape 1
   - À chaque APPROUVE, avance étape ou clôture si dernière
   - À chaque REJETE, clôture en REJETE
2. `ApprovalRequest` indépendant de l'entité (couple `entiteType + entiteId`)

**Acceptance criteria** :
- [ ] Service `ApprovalEngineService` testé unitairement
- [ ] Mock de 5 workflows seedés (BC standard, BC > 500K, Congés, Paie, Virement)
- [ ] Test : BC 100K → workflow 1 étape ; BC 1M → workflow 3 étapes série

---

## Task 12.2 — Approbations multi-types (M-APR-02) **P0**

Brancher la barre `<app-submit-approval-button>` (Round 1) sur :
- DA (déjà partiel Round 1)
- AO attribution (résultat attribution)
- BC (déjà partiel)
- Facture fournisseur (déjà partiel)
- Situation (nouveau)
- Congés (déjà partiel)
- Paie (validation mensuelle)
- Virement bancaire (nouveau)
- Avenant (déjà partiel)
- OS (nouveau)

Chaque type a son workflow type + ses conditions (montant seuil par exemple).

**Acceptance criteria** :
- [ ] 10 types branchés
- [ ] Workflow auto-sélectionné selon entité
- [ ] Test e2e pour chaque type

---

## Task 12.3 — Inbox approbateur + audit log immuable (M-APR-03) **P0**

Étendre Round 1 inbox (`/approbations`) :
- Vue card avec résumé entité, montant, initiateur, ancienneté
- Boutons : Approuver / Rejeter / **Demander complément** / Commenter / Déléguer
- Filtre par type / société / société / urgence
- Tri par SLA (le plus en retard en haut)
- Audit log immuable : chaque action loggée avec hash SHA-256 chaîné (M-APR-08)

**Acceptance criteria** :
- [ ] Inbox montre 20+ requêtes mock seedées
- [ ] Action « Demander complément » envoie commentaire à l'initiateur
- [ ] Audit log : hash[N] = sha256(hash[N-1] + event[N])

---

## Task 12.4 — Délégation absence (M-APR-04) **P1**

**Modèle** :

```ts
export interface DelegationApprobation {
  id: string;
  approbateurAbsentId: string;
  delegueId: string;
  dateDebut: string;
  dateFin: string;
  types?: ApprovalEntityType[];        // si vide = tous
  actif: boolean;
}
```

**Action** : page `/admin/delegations` (gérée par utilisateur lui-même). Si délégation active pendant une absence, l'engine route vers le délégué automatiquement.

---

## Task 12.5 — Notifications + escalade (M-APR-05) **P1**

- In-app (Round 1 ✅)
- Email (mock SMTP en démo)
- Push (cf §15 M-MOB-07)
- WhatsApp (cf §16 M-INT-09)
- Escalade : si étape non traitée après `escaladeApresJ` → notification au N+1

---

## Task 12.6 — Matrice pouvoirs (M-APR-06) **P1**

Page `/admin/approvals/matrice` :
- Tableau croisé : type entité × seuils montants → rôles
- Exemple : BC <50K → Directeur travaux ; 50–500K → DG ; >500K → Comité
- Configuration par société / division / chantier

---

## Task 12.7 — Approbation mobile 1-clic (M-APR-07) **P1**

Email/notification avec **lien d'action directe** (token JWT) qui :
1. Ouvre page mobile `/m/approuver/:token`
2. Affiche résumé + boutons Approuver / Rejeter
3. Sans login si token valide < 24h

---

## Task 12.8 — Audit trail hash (M-APR-08) **P2**

Étendre `ApprovalEvent` :
- `hash` = SHA-256(previousHash + eventData)
- Stockage chaîne dans blockchain de log
- Vérification intégrité : changement N → tous les hash suivants invalidés
- Export PDF avec preuve d'intégrité

---

## Testing

```ts
describe('ApprovalEngineService', () => {
  it('sélectionne workflow selon type et conditions montant', () => { /* … */ });
  it('avance étape 1 → 2 après approbation', () => { /* … */ });
  it('escalade après J+SLA', () => { /* … */ });
  it('route vers délégué si délégation active', () => { /* … */ });
});

// e2e
test('Workflow BC 1M passe 3 étapes série', async ({ page }) => { /* … */ });
test('Inbox tri SLA puis filtre type', async ({ page }) => { /* … */ });
```

## Dépendances inverses

- 03-achats, 06-etudes, 07-marches, 08-finance, 09-rh (toutes les entités approuvables)
- 13-admin (rôles + sociétés)
- 14-transverse (M-TRA-03 workflow universel)
- 15-mobile (approbation mobile)
- 16-integrations (WhatsApp)
