# ROADMAP — nafura-platform

> Les chantiers dans l’ordre. Ce qui est livré est décrit dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), pas ici.

## Prochains

1. **Statuts et approbations** — approbateur désigné par permission (plus par rôle), approbations multi-étapes, historique des transitions, notifications aux approbateurs.
2. **Réglages** — réglages déclarés par un BC (manifeste), rendus par l’écran Paramètres ; tableau de bord sans widgets métier en dur.
3. **Documents** — impression personnalisée (modèles, marque de l’organisation), import « magique » (lecture de grilles dans `document-extraction`).
4. **Conversation IA et chat** — un seul concept de conversation, outils tirés des BCs.
5. **Composants métier** — montants, BTP ; i18n par BC ; écrans utilisables sur mobile ; surcharge du design par produit.
6. **Tenancy `multi`** dans le web du host ; seeding à la création d’une organisation.
7. **Sektor sur le host** — `app.nafura.json` + BCs Sektor, suppression de `socle`, plus de vérification de rôle ; e2e Sektor verts.
8. **Publication** — BOM Maven et paquets npm à la place de `includeBuild` et des alias source ; venue-catalog et MBS sur le host.
