# 10 — Approbation par permission

> Revue 2026-10-07, axe maturité. Taille **M** (back + front). Aucune dépendance.
> Détaille le point 1 de `ROADMAP.md` (« Statuts et approbations ») pour sa première partie.

## Objectif

Un cycle de vie désigne ses approbateurs par une **permission**, jamais par un rôle, comme les notifications (`to: "permission:<id>"`). C'est la règle 3 d'ARCHITECTURE.md, aujourd'hui enfreinte par l'approbation.

## Besoin

- `Lifecycle.Approval` porte `role` ; le BC démo écrit `"role": "DEMO_LEAD"` (`records/purchase-request.json`). Un rôle créé par l'organisation, ou un rôle de produit qui inclut la permission, n'est donc pas approbateur.
- La chaîne entière est en rôle :
  - `ApprovalGateway.request(…, String approverRole)` ;
  - `LifecycleApprovals` → `ApprovalStepDefinition.approverRole` ;
  - `ApprovalStep.approverRole` ;
  - `ApprovalStepRepository.…(tenantId, status, approverRole)`.
- La boîte `/approvals` filtre par rôle.

## Existant

- `core/framework/…/record/Lifecycle.java` (`Approval(role, when, title, approved, rejected)`), `LifecycleEngine.fire`, `ApprovalGateway`.
- `approbation/` : `LifecycleApprovals`, `ApprovalServiceImpl`, `ApprovalStepDefinition`, `domain/model/ApprovalStep`, `WorkflowStep`, `ApprovalStepRepository`, `WorkflowStepDto`.
- Deux sources d'approbation :
  - le cycle de vie JSON (`LifecycleApprovals`) ;
  - les **modèles de workflow** administrables (`/api/v1/platform/collaboration/workflow/templates`, écran « Workflows d'approbation »).

## Contrat

### Lot 1 — Permission dans le cycle de vie

```json
"approval": {
  "permission": "demo.purchasing.request.approve",
  "when": "amount > 10000",
  "title": "Demande d'achat : {subject}",
  "approved": "approve",
  "rejected": "reject"
}
```

- `role` est retiré du schéma et du record `Approval` (lab mode : pas de compatibilité).
- La permission doit être déclarée dans le manifeste du BC, sinon le démarrage échoue (même contrôle que `notify`).
- Le demandeur ne peut pas approuver sa propre demande, même s'il a la permission (prépare la « double validation » de la ROADMAP).

### Lot 2 — Chaîne serveur

- `ApprovalGateway.request(entityType, entityId, title, approverPermission)`.
- `ApprovalStep.approverPermission` remplace `approverRole` (schéma cible corrigé).
- La boîte `/approvals` liste les étapes dont l'utilisateur détient la permission (`UserContext.hasPermission`), dans son organisation.
- La décision vérifie la permission au moment de la décision, pas à la création de l'étape.

### Lot 3 — Notification des approbateurs

- À l'ouverture d'une approbation : notification aux membres qui détiennent la permission, par le chemin existant (`NotificationRouter`, `to: "permission:<id>"`), avec un événement de la plateforme `platform.approvals.requested`.

### Lot 4 — Démo et tests

- BC démo : `demo.purchasing.request.approve`, ajoutée au rôle par défaut correspondant ; `DEMO_LEAD` l'obtient par composition.
- host-tests :
  - un rôle créé par l'organisation avec la permission peut approuver ;
  - un utilisateur sans la permission reçoit un 403 ;
  - le demandeur ne peut pas s'auto-approuver ;
  - une permission non déclarée empêche le démarrage.

## Hors scope (suite du point 1 de la ROADMAP)

- Approbations multi-étapes (le modèle `stepNumber` existe, il n'est pas exposé au cycle de vie).
- Historique des transitions dans la fiche (couvert en partie par l'audit `status_change`).

## Vérification

1. `node platform-host/ops/run.mjs check`.
2. Lab : `lead@host.local` soumet une demande > 10 000 dans org-a ; `admin@host.local` la voit dans `/approvals` et l'approuve ; `lead` ne peut pas l'approuver lui-même ; un rôle créé dans l'écran Rôles avec la permission voit la demande.
3. Notification reçue par les détenteurs de la permission.

## Critères d'acceptation

- [ ] Plus aucun `role` ni `approverRole` dans le cycle de vie, la passerelle, le module `approbation` ou le BC démo.
- [ ] Boîte `/approvals` filtrée par permission.
- [ ] Pas d'auto-approbation.
- [ ] Approbateurs notifiés.

## Documentation

- `docs/PLATFORM.md` § Cycle de vie et approbations : `approval.permission`.
- `docs/UI.md`, ligne « Approbation » : « les détenteurs de la permission sont notifiés ».
- `ROADMAP.md` 1 : retirer « approbateur désigné par permission » et « notifications aux approbateurs ».

## Décisions ouvertes

1. Les **modèles de workflow** administrables et l'approbation du cycle de vie JSON font-ils doublon ? Si oui, lequel reste ? À trancher avant les approbations multi-étapes. Recommandation : le cycle de vie JSON est la seule source ; un modèle administrable ne pourrait que **paramétrer** des seuils ou des étapes déclarés par le BC, sans créer de second moteur.
