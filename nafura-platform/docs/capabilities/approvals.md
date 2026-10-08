# Approbations (`cap.approvals`)

## Identité

| | |
|---|---|
| Catalogue | `cap.approvals` |
| Modules | `approbation` |
| Requires | (aucun) |
| Note | **~7/10** (approbateur par permission, boîte, notif ; multi-étapes et historique encore ouverts) |

## État

**Source métier.** Le cycle de vie JSON (`approval.permission`) est la seule source d’approbation d’un record. Les modèles de workflow administrables (`/administration/workflows`) paramétrent des chaînes d’étapes (permission, seuil, délai) sans second moteur de cycle de vie.

**Contrat d’une étape.** `approverPermission` (jamais un rôle). Schéma cible : colonnes `approver_permission` / `escalation_permission`. La boîte `/approvals` liste les étapes PENDING dont l’utilisateur détient la permission (`UserContext.hasPermission`), dans son organisation ; le demandeur n’y voit pas sa propre demande. La décision revérifie la permission et refuse l’auto-approbation (403).

**Notifications.** À l’ouverture (`PENDING`) : `platform.approval.requested` aux membres qui détiennent la permission (chemin `NotificationRouter`, même résolution que `to: "permission:<id>"` des transitions). Le demandeur est exclu. Décision hors cycle de vie : `platform.approval.decided` au demandeur ; avec cycle de vie, ce sont les `notify` de la transition de sortie.

**Démo.** `demo.purchasing.request.approve` / `demo.projects.project.approve` dans le manifeste + rôle `DEMO_EDITOR` (donc `DEMO_LEAD` par composition).

## Contrat

- BC : déclarer la permission d’approbation dans le manifeste ; l’écrire dans `approval.permission` du record.
- Produit / org : attribuer la permission via un rôle (produit, BC ou créé dans l’écran Rôles) — jamais de rôle hardcodé dans le code.
- UI : ne pas filtrer la boîte autrement que par le backend.

## Hors scope

- Approbations multi-étapes exposées au cycle de vie JSON (`stepNumber` existe, pas branché sur `Lifecycle.Approval`).
- Historique des transitions dans la fiche (partiellement couvert par l’audit `status_change`).
- Double validation généralisée (préparée par le refus d’auto-approbation).

## Roadmap

| Lot | Livrable | Done quand |
|---|---|---|
| 1 | Approbateur par permission + notif + anti auto-approbation | livré (spec 10) |
| 2 | Multi-étapes dans le cycle de vie (ou paramétrage BC des étapes déclarées) | un record peut enchaîner N étapes sans second moteur |
| 3 | Historique des transitions dans la fiche | section / timeline lisible hors audit brut |

## Vérifier

1. `node platform-host/ops/run.mjs check`
2. Lab : `lead@host.local` soumet une DA > 10 000 ; `admin@host.local` voit `/approvals` et approuve ; `lead` ne peut pas s’auto-approuver ; un rôle org avec la permission voit la demande.
3. Notification `platform.approval.requested` reçue par les détenteurs.
