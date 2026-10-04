# ROADMAP — nafura-platform

> Les chantiers dans l’ordre. Ce qui est livré est décrit dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), pas ici.

## Prochains

0. **Notifications** — livré côté backend (voir [PLATFORM.md](docs/PLATFORM.md#notifications)). Reste :
   - Écrans : préférences utilisateur (remplace la section notifications des réglages utilisateur, `emailNotifications` / `inAppNotifications` / `digestFrequency`, que rien ne lit) et préférences de l’organisation dans Paramètres.
   - SMS : fournisseur et numéro de l’utilisateur (`AppUser` n’en a pas).
   - Modèles de message par canal (hors manifeste) ; lien absolu dans l’e-mail (aujourd’hui relatif).
   - Dette : `AlertRule` / `Broadcast` / `Escalation` sans usage, digest (`EmailDigestJob` vide), adresse d’expédition `noreply@seyrura.com` par défaut, événement `platform.legacy.transition` (Sektor, destinataires par rôle) à supprimer avec Sektor sur le host.
1. **Statuts et approbations** — approbateur désigné par permission (plus par rôle), approbations multi-étapes, historique des transitions, notifications aux approbateurs.
2. **Réglages** — réglages déclarés par un BC (manifeste), rendus par l’écran Paramètres ; tableau de bord sans widgets métier en dur.
3. **Documents** — impression personnalisée (modèles, marque de l’organisation ; le lab n’a pas Gotenberg). L’import d’une fiche depuis un endpoint du BC est livré (`RecordPageConfig.import`). Reste le type de document `{ domain, type }` : aujourd’hui il vit en base (`DocTypeController`), pas dans un seed de référence — ne pas inventer un second format.
4. **Conversation IA et chat** — un seul concept de conversation, outils tirés des BCs.
5. **Composants métier** — montants, BTP ; i18n par BC ; écrans utilisables sur mobile ; surcharge du design par produit.
6. **Tenancy `multi`** dans le web du host ; seeding à la création d’une organisation.
7. **Sektor sur le host** — `app.nafura.json` + BCs Sektor, suppression de `socle`, plus de vérification de rôle ; e2e Sektor verts.
8. **Publication** — BOM Maven et paquets npm à la place de `includeBuild` et des alias source ; venue-catalog et MBS sur le host.
