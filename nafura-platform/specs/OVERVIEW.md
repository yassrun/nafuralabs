# Vue d’ensemble — specs planifiées non livrées (2026-10-08)

> Brouillon à revoir. Ordre tiré de [ROADMAP.md](../ROADMAP.md) et, pour la revue de plateforme, de l’ordre conseillé dans [revue-plateforme/00-AUDIT.md](revue-plateforme/00-AUDIT.md) (04 → 03 → 06 → 05 → 01 → 07 → 02 → 08 → 10 → 11 → 09). Seul ce qui n’est pas livré, ou ne l’est qu’en partie, est listé.

| # | Spec / chantier | Ce qui reste | Taille | Source |
|---|---|---|---|---|
| 1 | Outillage et build sans machine ni admin | Outillage hors dépôt, `bootstrap`, `toolchain`, `doctor`, daemon et caches Gradle, base du lab hors dépôt, `@angular/build` | — | [ROADMAP.md](../ROADMAP.md) § Prochains 00 |
| 2 | Verrouillage optimiste (manque n° 3) | `@Version`, réponse 409. La roadmap le place « tout de suite après 1 et 2 » | S | [ROADMAP.md](../ROADMAP.md) § Manques structurants |
| 3 | 04 — Isoler l’héritage Sektor | Rien n’est fait : marquage `@deprecated` et garde-fou contre les nouveaux imports | S | [04-heritage-sektor.md](revue-plateforme/04-heritage-sektor.md) |
| 4 | 06 — Points d’accroche du record | Lots 2 (`guard`, `blocked`), 3 (`afterTransition`) et partie transitions du lot 4 | M | [06-points-accroche-record.md](revue-plateforme/06-points-accroche-record.md) |
| 5 | 01 — Liste unique (reliquat) | Détail d’un webhook encore sur `nf-listing-flat` ; `AgentPermissionChecker` vérifie encore `administration.api-keys.write` ; critères d’acceptation non cochés | S | [01-liste-unique.md](revue-plateforme/01-liste-unique.md) |
| 6 | 08 — Champs conditionnels et calculés | Tout : `visible`, `locked`, `requiredWhen`, type `computed`, `editableFields` | S | [08-champs-conditionnels.md](revue-plateforme/08-champs-conditionnels.md) |
| 7 | 11 — Formulaires et design system | Tout (6 lots) : jetons uniques, thème Material M3, grille 1 à 4 colonnes, groupes | L | [11-formulaires-et-design-system.md](revue-plateforme/11-formulaires-et-design-system.md) |
| 8 | 09 — Marque et libellés du produit | Tout : `spec.theme`, i18n par BC, `i18n.overrides`, renommer la clé `seyrura:theme` ; dépend du lot 1 de la spec 11 | M | [09-marque-et-libelles-produit.md](revue-plateforme/09-marque-et-libelles-produit.md) |
| 9 | Notifications | Lots 1 à 6 : SMS, modèles par canal, purge de l’ancien code, retrait de `legacy.transition`, Brevo en staging et prod, digest en lab | — | [notifications.md](../docs/capabilities/notifications.md) |
| 10 | Audit | Lots 1 à 3 : couverture du BC démo, libellés i18n, puis rétention et export SIEM | — | [audit.md](../docs/capabilities/audit.md) |
| 11 | IAM | Lot 5 (permissions `tenant.members.*` alignées) et lot 6 (invitation lab branchée sur `InvitationAcceptService`) | — | [iam.md](../docs/capabilities/iam.md) |
| 12 | Listes : la suite | Vues enregistrées par l’utilisateur, rollups, `timeline`, `gallery`, `list`, regroupement à deux niveaux | — | [ROADMAP.md](../ROADMAP.md) § Prochains 0 |
| 13 | Statuts et approbations | Multi-étapes, historique des transitions dans la fiche, seuils de montant, délégation, escalade | — | [approvals.md](../docs/capabilities/approvals.md) |
| 14 | Réglages déclarés par un BC | Tout, y compris un tableau de bord sans widgets métier en dur | — | [ROADMAP.md](../ROADMAP.md) § Prochains 2 |
| 15 | Documents | Impression personnalisée (modèles, marque) ; type de document `{ domain, type }` | — | [ROADMAP.md](../ROADMAP.md) § Prochains 3 |
| 16 | Conversation IA et chat | Un seul concept de conversation, outils tirés des BCs | — | [ROADMAP.md](../ROADMAP.md) § Prochains 4 |
| 17 | Composants métier | Montants, BTP, i18n par BC, mobile, surcharge du design par produit | — | [ROADMAP.md](../ROADMAP.md) § Prochains 5 |
| 18 | Tenancy `multi` (specs 09 à 12 de la vague 3) | Console opérateur, lien d’invitation, coquille `/p/{slug}`, limite de débit, effacement, consentement, records produit | — | [09-tenancy-multi.md](manques-plateforme/09-tenancy-multi.md) |
| 19 | Sektor sur le host | Reconstruction, puis lot 3 de la spec 04 (suppression de l’héritage) | — | [ROADMAP.md](../ROADMAP.md) § Prochains 7 |
| 20 | Publication | BOM Maven, paquets npm, venue-catalog et MBS sur le host | — | [ROADMAP.md](../ROADMAP.md) § Prochains 8 |
| 21 | Document à lignes et arbre avec agrégats (manque n° 7) | Tout | L | [ROADMAP.md](../ROADMAP.md) § Manques structurants |
| 22 | Lien externe à jeton (manque n° 8) | Tout | S | [ROADMAP.md](../ROADMAP.md) § Manques structurants |
| 23 | Versions figées et éditions publiées (manque n° 5) | Tout | M | [ROADMAP.md](../ROADMAP.md) § Manques structurants |
| 24 | Mouvements immuables et délais/échéances (manques n° 4 et 6) | À faire avec le premier produit financier | M | [ROADMAP.md](../ROADMAP.md) § Manques structurants |

## Pas de rang dans la roadmap

- [08bis — Import : valeurs de référentiel](manques-plateforme/08bis-import-valeurs-referentiel.md)
- [13 — Découpage des listes](manques-plateforme/13-decoupage-listes.md) (dette front)
- Nouvelles capabilities « à concevoir » sans spec (moteur de règles, référentiels, chiffrement et données personnelles, recherche et dédoublonnage…) : [ROADMAP.md](../ROADMAP.md) § Nouvelles capabilities

## Incohérences à corriger

- **Specs livrées encore présentes :** 02, 03, 05, 07 ont tous leurs critères cochés, et la 10 est marquée livrée dans [approvals.md](../docs/capabilities/approvals.md) alors que ses cases restent décochées. La règle est de supprimer une spec une fois livrée.
- **Spec 01 :** ses critères d’acceptation ne sont pas cochés alors que ses lots 0 à 6 sont livrés.
