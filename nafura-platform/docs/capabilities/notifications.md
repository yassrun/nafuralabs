# Notifications (`cap.notifications`)

## Identité

| | |
|---|---|
| Catalogue | `cap.notifications` |
| Modules | `notification`, `notification-api` |
| Requires | `cap.access` |
| Note | **~8/10** (prefs, inbox, SSE, digest, e-mail absolu + from produit / Brevo lab) |

## État

Un seul chemin : règle métier (`notify` sur transition, mention, affectation, événements plateforme) → `NotificationRouter` → canaux retenus → `NotificationChannel`.

**Déclaration.** Le BC déclare ses événements dans `bc.manifest.json` → `notifications` : `id` (sous son préfixe), `label`, `title` (`{champ}` du record), `channels` (`in_app`, `email`, `sms`), `mandatory`. Événements plateforme (approbation, mention, affectation) : `META-INF/nafura/platform/notifications.json` du module `notification`. Capability coupée : règles ignorées, avertissement au démarrage. Événement / champ / permission invalides : échec au boot.

**Canaux.** Implémentés : `in_app`, `email`. Un canal déclaré sans implémentation est ignoré (avertissement). Rétention : défaut manifeste → organisation (coupe ou ajoute) → utilisateur (coupe sauf `mandatory` ; n’ajoute jamais).

**Préférences.** `GET|PUT /api/v1/platform/collaboration/notification-preferences` (utilisateur) ; `…/organisation` (`administration.notifications.configure`). UI : Mes paramètres → Notifications ; Paramètres organisation → Notifications. Un interrupteur = un canal ; l’utilisateur ne rallume pas un canal coupé par l’org ; `mandatory` verrouillé.

**Inbox.** `/notifications` : Non lues / Toutes / Lues, filtre `source`, pagination, libellé, temps relatif. Clic → `actionUrl` ou fiche via `HostBusinessContext.records` (`entityType` + `entityId`). Approbation en attente : membres du rôle (ou `approverId`) ; le demandeur n’est pas prévenu de sa propre demande.

**Temps réel.** `GET …/notifications/stream` (SSE). Un seul client web (`PlatformNotificationStreamService`) : ouverture à l’auth + tenant, fermeture déconnexion / changement d’org. Livraison in-app → badge cloche + préfixe liste.

**Digest.** Job `email-digest` (cron `0 0 8 * * *`, tenant-scoped). Fréquence `notifications.digestFrequency` (`none` \| `daily` \| `weekly`, défaut `daily`) via `GET|PUT /api/v1/user-settings/notifications`. `weekly` = lundi seulement. Agrège les in-app non digérées (`digested_at` NULL), mail « Vos alertes », puis marque. Sans e-mail : skip + log.

**E-mail immédiat.** `EmailChannel` : titre, résumé, lien « Ouvrir ». URLs relatives → absolues via `app.frontend-base-url` (lab : `spec.local.ports.web`). Expéditeur : `app.email.from-address` / `app.email.from-name` (défaut `noreply@nafuralabs.local` + nom produit). Lab host : Brevo si `APP_EMAIL_*` / secrets ops injectés.

**Templates transactionnels** (hors matrice événement × canal) : codes réservés `invitation` et `welcome`.

- **Résolution** : override tenant (`email_templates` même `code` + `tenant_id`) → modèle système (`tenant_id` NULL) → fallback Java `BuiltInEmailTemplates`.
- **Variables invitation** (toujours injectées) : `product.name` (manifeste), `tenant.name`, `brand.primary` / `brand.secondary` / `brand.accent` (Paramètres organisation → Apparence), `inviter.name`, `inviteLink`, `invitee.email`, `message`, `expiryDays` (`app.invitation.expiry-days`). Pas de marque produit ni « 7 jours » ni couleur en dur dans seed / BuiltIn.
- **Variables welcome** : `product.name`, `tenant.name`, `brand.*`, `user.firstName`.
- **Branding** : 3 rôles (`app.branding.primaryColor|secondaryColor|accentColor`) ; déduction IA du logo via `POST /api/v1/app-settings/branding/extract-colors` (module `llm-provider` / `cap.ai`, Gemini vision). Mêmes `brand.*` exposés aux templates d'impression. L'`accentColor` des paramètres document reste indépendant.
- **UI** : `/administration/email-templates` (édition / preview) ; le chemin invite utilise `renderByCode`.
- Pas un modèle par événement notif (roadmap lot 2).

**Dette marquée.** `AlertRule` / `Broadcast` / `Escalation` : `@Deprecated`, tables + repos sans lecteur plateforme. `platform.legacy.transition` conservé jusqu’à Sektor sur le host.

## Contrat

- BC : déclarer les événements dans le manifeste ; utiliser `notify` sur les transitions (jamais un second bus).
- Produit : ne pas réimplémenter inbox / cloche / prefs ; brancher `app.email.*` et `app.frontend-base-url` pour l’e-mail ; ne pas hardcoder la marque dans les seeds e-mail (utiliser `product.name`).
- Permissions : config org = `administration.notifications.configure` ; le reste suit les permissions des records / approvals.

## Hors scope

- Mute par conversation, groupement inbox, digest in-app.
- Escalade workflow (chantier statuts / approbations).
- Éditeur riche générique hors modèles e-mail déclarés.

## Roadmap

| Lot | Livrable | Done quand |
|---|---|---|
| 1 | Canal **SMS** + numéro de téléphone utilisateur (profil / prefs) | `sms` implémenté ; numéro stocké et utilisé ; événement déclaré `sms` livré en lab |
| 2 | **Modèles** par canal / événement (pas seulement invitation/welcome) | titre/corps (ou template id) déclarables ; rendu e-mail (et SMS si lot 1) sans hardcode Java par événement BC |
| 3 | **Purge** `AlertRule` / `Broadcast` / `Escalation` | tables + repos retirés ou migration de drop ; plus de `@Deprecated` morts |
| 4 | `platform.legacy.transition` | retiré quand Sektor est sur le host |
| 5 | **Staging / prod host** | injection Brevo / `APP_EMAIL_*` sur les déploiements host (pas seulement lab) |
| 6 | Digest lab | trigger / forçage du job digest **tenant-scoped** documenté et utilisable en lab sans attendre le cron |

Ordre indicatif : 1 → 2 pour la maturité produit ; 3–4 quand le legacy Sektor le permet ; 5 avec le déploiement ; 6 en parallèle ops lab.

## Vérifier

1. `node platform-host/ops/run.mjs check`
2. Lab : hard-refresh web après changements plateforme.
3. Préférences org/user ; inbox filtres ; cloche SSE (deux onglets, DA > 10k).
4. Digest : fréquence + exécution job ; e-mail immédiat avec lien absolu et from produit.
5. Chemins UI : `/notifications`, Mes paramètres → Notifications, Paramètres organisation → Notifications, cloche shell.
