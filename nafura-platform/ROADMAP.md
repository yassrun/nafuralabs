# ROADMAP — nafura-platform

> Les chantiers dans l’ordre. Ce qui est livré est décrit dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), pas ici.

## Prochains

0. **Notifications** — prefs + inbox : [14](specs/manques-plateforme/14-notifications-preferences.md) (livré). Suite vers ~8/10 : [15](specs/manques-plateforme/15-notifications-suite.md) (SSE branché, digest réel, e-mail absolu + from). Puis : SMS, modèles par canal, dette `AlertRule`/`Broadcast`/`Escalation`, `platform.legacy.transition` avec Sektor sur le host.
0. **Listes : la suite** — le socle est livré (descripteur du record, grammaire de filtre, vues, filtres proposés : [PLATFORM.md](docs/PLATFORM.md), [UI.md](docs/UI.md)). Reste :
   - Écrans d’administration sur des contrôleurs non-record (clés d’API, webhooks, séquences de numérotation) : passer en `RecordController` (entités sur `TenantEntity` : colonnes `created_by` / `updated_by` ; permissions `…read/write` → `…read/create/update/delete` ; clé et secret jamais sérialisés ; création de clé et révocation surchargées ; statut « expiré » calculé), puis supprimer `LegacyListingPageComponent`.
   - Archétype « config-driven » (`lib/anatomy` `ListingPageConfig`, 7 écrans plateforme) : migrer vers `nf-listing-page`, un seul type de liste.
   - Plus tard : vues enregistrées par l’utilisateur, rollups, `timeline`, `gallery`, `list`, regroupement à deux niveaux.
1. **Statuts et approbations** — approbateur désigné par permission (plus par rôle), approbations multi-étapes, historique des transitions, notifications aux approbateurs.
2. **Réglages** — réglages déclarés par un BC (manifeste), rendus par l’écran Paramètres ; tableau de bord sans widgets métier en dur.
3. **Documents** — impression personnalisée (modèles, marque de l’organisation ; le lab n’a pas Gotenberg). L’import d’une fiche depuis un endpoint du BC est livré (`RecordPageConfig.import`). Reste le type de document `{ domain, type }` : aujourd’hui il vit en base (`DocTypeController`), pas dans un seed de référence — ne pas inventer un second format.
4. **Conversation IA et chat** — un seul concept de conversation, outils tirés des BCs.
5. **Composants métier** — montants, BTP ; i18n par BC ; écrans utilisables sur mobile ; surcharge du design par produit.
6. **Tenancy `multi`** — API, isolation, sélecteur et seeding à la création : livrés (voir [PLATFORM.md](docs/PLATFORM.md#connexion-et-organisation)). Reste la console opérateur (écrans Organisations et Utilisateurs), le lien d’invitation branché sur `InvitationAcceptService`, la coquille publique, le débit, l’effacement et le consentement de partage.
7. **Sektor sur le host** — `app.nafura.json` + BCs Sektor, suppression de `socle`, plus de vérification de rôle ; e2e Sektor verts.
8. **Publication** — BOM Maven et paquets npm à la place de `includeBuild` et des alias source ; venue-catalog et MBS sur le host.
