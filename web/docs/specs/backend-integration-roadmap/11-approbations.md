# Wave 5 — Approbations

## Findings traités

D'après `migration_plan.md` §10 et `00-MOCK-INVENTORY.md` §2.10 :

- Le module Approbations a `pages/approbations/services/approbations-mock.service.ts` mock-only.
- 2 fichiers (`inbox.page.ts`, `submit-approval-button.component.ts`) injectent ce mock.
- Aucun engine workflow réel — la roadmap Round 2 Task 12 propose un engine générique côté frontend, ce qui crée du couplage avec les mocks métier.
- **Conséquence pour la migration backend :** sans engine workflow, les transitions de statut (submit/approve/reject) de TOUS les modules Wave 2-3-4 doivent au moins être appelées par des endpoints custom **immédiats** (pas d'engine). L'engine arrive en Wave 5 pour gérer la couche au-dessus (matrice pouvoirs, délégation, escalade).

## Goal

Créer `backend/domains/approbations` pour :

1. Engine workflow générique (entity-agnostic).
2. Approval request + events + audit chain hash SHA-256.
3. Délégation + escalade SLA.
4. Matrice pouvoirs configurable.

Plus important : **brancher** cet engine sur les transitions des autres modules (DA, AO, BC, FF, SIT, CONGE, PAIE, VIR, AVN, OS) sans les casser.

## Source-of-truth frontend

Cf. `00-MOCK-INVENTORY.md` §2.10 — 2 fichiers à nettoyer (point d'entrée minimal côté UI).

```
pages/approbations/services/approbations-mock.service.ts            ← à remplacer par /api/v1/approbations/...
pages/approbations/inbox/inbox.page.ts                              ← inbox approbateur
pages/approbations/components/submit-approval-button/...           ← composant générique transverse
```

Note : ce composant `<app-submit-approval-button>` est appelé depuis les modules métier (DA, AO, BC, FF…). Il faut s'assurer qu'il consomme l'engine via HTTP et plus le mock.

## Cible backend

```
backend/domains/approbations/
```

### Entités à créer

| Entité | Description |
|---|---|
| `ApprovalWorkflow` | Définition d'un workflow (entity-type + conditions + étapes) |
| `ApprovalCondition` | Condition d'activation (champ/opérateur/valeur) |
| `EtapeWorkflow` | Étape (ordre, série/parallèle, approbateurs, quorum) |
| `ApprovateurConfig` | Configuration approbateur (ROLE/PERSONNE/MANAGER/DELEGATION) |
| `ApprovalRequest` | Demande active (entité × étape courante × état) |
| `ApprovalEvent` | Événement (SOUMIS/APPROUVE/REJETE/DEMANDE_COMPLEMENT/DELEGUE/COMMENTE/ESCALADE) avec hash chaîné |
| `DelegationApprobation` | Délégation utilisateur (période + délégué) |
| `MatricePouvoir` | Matrice type-entité × seuils → rôles |

## Tasks

### B-APR-01 — Approval workflow engine

**Goal :** entités root + service `ApprovalEngineService` qui sélectionne, fait avancer, escalade les workflows.

**Champs `ApprovalWorkflow` :**
```
id, tenant_id, code, label, entity_type (BC/DA/AO/FF/SIT/...),
conditions[] (JSON ou table liée),
etapes[] (ordre + parallel + approbateurs),
sla_jours, escalade_apres_jours,
is_active
```

**Champs `ApprovalRequest` :**
```
id, tenant_id, workflow_id, entity_type, entity_id,
status (EN_COURS/APPROUVE/REJETE/ANNULE),
etape_courante_index, etape_courante_id,
initiateur_user_id, date_soumission, date_cloture,
created_at, updated_at
```

**Endpoints :**
```
GET    /api/v1/approbations/workflows
POST   /api/v1/approbations/workflows
PUT    /api/v1/approbations/workflows/{id}

POST   /api/v1/approbations/requests                  ← soumission (auto-sélectionne le workflow)
GET    /api/v1/approbations/requests?status=...&approbateurUserId=...
GET    /api/v1/approbations/requests/{id}
POST   /api/v1/approbations/requests/{id}/approve
POST   /api/v1/approbations/requests/{id}/reject
POST   /api/v1/approbations/requests/{id}/demande-complement
POST   /api/v1/approbations/requests/{id}/commenter
POST   /api/v1/approbations/requests/{id}/deleguer/{userId}
```

**Logique sélection workflow :** à `POST /requests`, parcours des `ApprovalWorkflow` `entity_type` matchant + `ApprovalCondition` vérifiées (ex. `montant >= 500000`) → premier match = workflow actif.

**Tests unitaires obligatoires :** `ApprovalEngineServiceTest` (sélection workflow, avancement étape, séries/parallèle, quorum, escalade).

**Seeds (5 workflows initiaux) :** BC standard, BC>500K, Congés, Paie, Virement.

**Désinjection :** `pages/approbations/components/submit-approval-button/`.

**Effort :** 3-4 j.h

---

### B-APR-02 — Approval request + events + hash chain

**Goal :** entité `ApprovalEvent` avec hash chaîné SHA-256 (audit trail intégrité).

**Logique hash :**
```
event.hash = SHA-256(event.previous_hash + event.action + event.user_id + event.timestamp + event.payload)
```

**Endpoints :**
```
GET    /api/v1/approbations/requests/{id}/events
GET    /api/v1/approbations/requests/{id}/verify-integrity   ← retourne ok=true/false
GET    /api/v1/approbations/requests/{id}/audit.pdf          ← PDF avec preuve intégrité
```

**Désinjection :** `pages/approbations/inbox/inbox.page.ts` (consomme events réels).

**Tests unitaires :** `ApprovalEventChainTest` (hash chain + détection altération).

**Effort :** 2-3 j.h

---

### B-APR-03 — Délégation + escalade SLA

**Goal :** entité `DelegationApprobation` + job `@Scheduled` d'escalade.

**Champs `DelegationApprobation` :**
```
id, tenant_id, user_id (délégant), delegue_user_id, date_debut, date_fin,
is_active, created_at
```

**Logique :**
- À chaque assignation d'`ApprovalRequest` à un user, le service vérifie s'il a une `DelegationApprobation` active → réassigne au délégué.
- Job quotidien : scan `ApprovalRequest` `status=EN_COURS` dont l'étape courante dépasse `escalade_apres_jours` → notification N+1 + `ApprovalEvent` type ESCALADE.

**Endpoints :**
```
GET    /api/v1/approbations/delegations?userId=...
POST   /api/v1/approbations/delegations
PUT    /api/v1/approbations/delegations/{id}
DELETE /api/v1/approbations/delegations/{id}
```

**Effort :** 1-2 j.h

---

### B-APR-04 — Matrice pouvoirs

**Goal :** entité `MatricePouvoir` qui configure par société/division/chantier les seuils approbateurs.

**Exemple matrice BC :**
```
BC < 50_000 MAD  → Directeur travaux
50_000 ≤ BC < 500_000 → DG
BC ≥ 500_000 → Comité
```

**Endpoints :**
```
GET    /api/v1/approbations/matrice-pouvoirs?entityType=BC
POST   /api/v1/approbations/matrice-pouvoirs
PUT    /api/v1/approbations/matrice-pouvoirs/{id}
DELETE /api/v1/approbations/matrice-pouvoirs/{id}
```

**Logique :** la matrice est un input au moteur de sélection de `ApprovalWorkflow` (B-APR-01).

**Effort :** 1-2 j.h

## Frontend cleanup

```bash
grep -r "approbations-mock.service" web/app/applications/erp/ 2>/dev/null
# (vide attendu)
```

## Testing

| Test | Type | Périmètre |
|---|---|---|
| `ApprovalEngineServiceTest` | JUnit | sélection workflow + avancement étape |
| `ApprovalEventChainTest` | JUnit | hash chaîné + détection altération |
| `DelegationServiceTest` | JUnit | réassignation auto |
| `EscaladeServiceTest` | JUnit | escalade J+N |
| `MatricePouvoirServiceTest` | JUnit | choix workflow selon seuils |
| `approbations-flow.e2e.spec.ts` | Playwright | soumission BC 1M → approbations 3 étapes série → audit log |

## Dependencies

- **Wave 0** : utilisateurs/rôles (déjà en place via IAM platform).
- **Tous les autres modules Wave 2-3-4** : la migration des approbations **n'est pas bloquante** pour les modules métier (ils ont leurs propres endpoints `/submit`, `/approve`). L'engine est un **enrichissement** qui orchestre par-dessus.

## Stratégie de branchement

Pour ne pas bloquer Wave 2-3-4 :

1. **Phase 1 (Waves 2-3-4) :** chaque module Wave 2-3-4 expose ses propres `POST /…/{id}/submit/approve/reject` qui changent le statut **directement**. Pas de couplage avec approbations.
2. **Phase 2 (Wave 5) :** l'engine `ApprovalEngineService` est branché en **observateur** : à chaque appel `/submit`, le service métier crée aussi une `ApprovalRequest`. Les `/approve` métier sont remplacés par `/approbations/requests/{id}/approve` qui, après dernière étape, appelle un callback du service métier pour finaliser.
3. **Cleanup :** une fois l'engine en place, les `POST /…/{id}/approve` métier deviennent des appels internes uniquement (non exposés à l'extérieur). L'UI passe par `<app-submit-approval-button>`.

## Definition of Done — Approbations

- [ ] B-APR-01 → B-APR-04 toutes `[x]`
- [ ] `grep ApprobationsMockService|approbations-mock.service` → vide
- [ ] Engine intégré aux 10 types d'entités (DA, AO, BC, FF, SIT, CONGE, PAIE, VIR, AVN, OS) au moins en mode observateur
- [ ] Audit trail vérifié sur 1 PR de bout en bout
- [ ] `00-PROGRESS.md` à jour
