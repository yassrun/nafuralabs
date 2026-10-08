# IAM / Membres (`cap.iam`)

## Identité

| | |
|---|---|
| Catalogue | `cap.iam` (membres, invitations) ; rôles / catalogue = `cap.access` |
| Modules | `iam` (+ `access` pour les rôles) |
| Requires | (catalogue : aucun) ; runtime : tenancy, identity, authorization |
| Note | **~8/10** (lots 1–4 + UX archétypes host ; reste alignement permissions + invite lab org) |

Pas de `cap.members` : les « membres » sont le produit visible de `cap.iam`.

## État

**API** (`IamController` `/api/tenants/{tenantId}/…`) : liste / détail membres ; invite ; resend ; PATCH rôles ; PATCH status (`active` \| `suspended`) ; DELETE membership ; bulk membres d’un rôle. Permissions `tenant.members.{read,invite,write,suspend,remove}` et `tenant.roles.*`.

**Invitation** : membership `INVITED` + token HMAC (`app.invitation.expiry-days`, défaut 7) + e-mail (`InvitationEmailPort`, Brevo si `cap.notifications`). Public : `GET /api/public/invitations/preview`, `POST …/accept` (`InvitationAcceptService`, provisioning Keycloak optionnel, welcome mail). Lien e-mail : `{app.frontend-base-url}/invite/accept?token=…`. Corps e-mail : modèles transactionnels `invitation` / `welcome` — contrat variables et résolution dans [notifications.md](notifications.md) § Templates transactionnels.

**Contrat invite / livraison / resend** :
- **Inviter** = créer le membership + tenter l’e-mail. Échec Brevo → HTTP 201 + `invitationEmailStatus=failed` (pas de rollback du membre).
- **Déjà présent** → HTTP 409 `MEMBER_EXISTS:<status>` (`invited` \| `active` \| `suspended`). UI : si `invited`, proposer **Renvoyer** ; si `active` / `suspended`, message dédié (pas de 2ᵉ invite).
- **Renvoyer** = nouveau token (ancien révoqué) + nouvel e-mail. Même contrat livraison : réponse avec `emailDeliveryStatus` `sent` \| `failed` (pas d’exception sur échec mail).

**UI host** : `/administration/members` (`nf-listing-page` + invite en action de liste), `/administration/members/:id` (`nf-record-page` + actions), `/administration/roles` (liste + fiche `nf-record-page`, permissions en section écran, membres du rôle en section listing), **`/invite/accept`** (public, hors shell ; login avec `returnUrl`). API record-compatible : `/api/v1/platform/admin/members` et `/api/v1/platform/admin/roles`.

**Accès** : seul le statut `ACTIVE` passe le filtre de contexte tenant. Multi-org : N `TenantMembership` par `AppUser`. Audience sur l’appartenance (défaut `members`) ; l’invite ne pose pas d’audience.

**Garde-fous OWNER (lot 3)** : suspend / remove / retrait du rôle OWNER refusés si le membre cible est le dernier OWNER **actif** du tenant (`IllegalStateException` → HTTP 409).

**Audit membership (lot 4)** : événements manuels `cap.audit` (`entityType` `tenant-member`) pour invite, accept, resend, changement de rôles, suspend/reactivate, remove — via `MembershipAudit` + `AuditService`.

**Périmètre** : un rôle d’appartenance reste valable pour toute l’organisation. Le limiter à un nœud est un grant (`tenant.members.scope-grant.*`, écran Périmètres) — voir [PLATFORM.md](../PLATFORM.md) § Permissions et rôles.

**Hors livré** : transfert OWNER explicite, SCIM, bulk CSV, unifier `administration.members.*` vs `tenant.members.*`.

## Contrat

- Un seul chemin d’invitation : `IamService` → token → e-mail → `InvitationAcceptService`.
- UI admin : archétypes host (`nf-listing-page` / `nf-record-page`), pas de fiche maison.
- Permissions dans le code API : `tenant.members.*` / `tenant.roles.*` ; jamais de rôles hardcodés dans les écrans.
- Rôles custom et matrice : `cap.access` (`nf-permission-picker`).

## Hors scope

- SCIM / sync annuaire IdP (lot post-8/10).
- MFA et revoke de session (IdP / user-settings).
- Console opérateur Organisations/Utilisateurs (tenancy multi, spec 09).
- Audience externe bout-en-bout (spec 11) — champ membership seulement ici.

## Roadmap

| Lot | Livrable | Done quand |
|---|---|---|
| **1 — UX archétype** | Membres et rôles = `nf-listing-page` + `nf-record-page` (specs 01 lot 5 / 02) | **Livré** |
| **2 — Accept invite host** | Page publique `/invite/accept` (preview + accept + session) | **Livré** — route host hors shell ; login honore `returnUrl` |
| **3 — Garde-fous OWNER** | Interdire suspend/remove/dé-rôler le dernier OWNER actif | **Livré** — backend 409 + toast UI ; transfert OWNER explicite = plus tard |
| **4 — Audit membership** | Événements invite / accept / resend / roles / suspend / remove | **Livré** — `MembershipAudit` (`tenant-member`) |
| **5 — Permissions alignées** | Front et API sur les mêmes clés `tenant.members.*` (ou alias documenté unique) | Plus de `administration.members.write` pour une action `suspend` |
| **6 — Invite lab / org create** | Création d’org et seeds lab branchés sur `InvitationAcceptService` (plus de `lab-{id}` mort) | Accept réel en lab multi |

Puis (post ~8/10) : bulk invite CSV ; quotas sièges ; audience à l’invite.

## Vérifier

1. `node platform-host/ops/run.mjs check`
2. Lab : Administration → Membres → détail ; éditer rôles ; désactiver / réactiver ; inviter + resend
3. Après lot 2 : ouvrir le lien d’invitation reçu par e-mail
4. Chemins : `/administration/members`, `/administration/members/:id`, `/administration/roles`, `/invite/accept` (lot 2)
