# ROADMAP — nafura-platform

> Les chantiers dans l’ordre. Ce qui est livré est décrit dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), pas ici.

## Prochains

00. **Outillage et build sans machine ni admin** — **en premier** : le lab ne démarre plus (dépôt en intégrité basse, JDK dans le dépôt) et reste lent. Contrat et écarts : [ops/README.md](ops/README.md) § Outillage. Ordre : outillage hors dépôt + `bootstrap` + `toolchain` + `doctor` → daemon et caches Gradle → base du lab hors dépôt et `stop` → `@angular/build`. Pas de Docker ni de dev container (postes clients sans Docker).
0 quinquies. **Revue de la plateforme (2026-10-07)** — doublons, extensibilité, habillage produit : [specs/revue-plateforme/00-AUDIT.md](specs/revue-plateforme/00-AUDIT.md) (specs 01 à 10, à affecter).
0. **Notifications** — état ~8/10 + suite : [docs/capabilities/notifications.md](docs/capabilities/notifications.md) § Roadmap.
0 bis. **Audit** — état ~8/10 + suite : [docs/capabilities/audit.md](docs/capabilities/audit.md) § Roadmap.
0 ter. **IAM / Membres** — état ~8/10 : [docs/capabilities/iam.md](docs/capabilities/iam.md) § Roadmap (archétypes host livrés ; reste alignement permissions + invite lab).
0 quater. **IA / Fournisseurs** — livré ~8/10 (BYOK, catalogue, quotas, privacy, RBAC/audit, UI) : [docs/capabilities/ai.md](docs/capabilities/ai.md). Préalable utile à Conversation IA.
0. **Listes : la suite** — le socle est livré (descripteur du record, grammaire de filtre, vues, filtres proposés : [PLATFORM.md](docs/PLATFORM.md), [UI.md](docs/UI.md)). Clés d’API, webhooks, séquences, impression, e-mail, workflows, membres et rôles livrés ; `LegacyListingPageComponent` supprimé. Plus tard : vues enregistrées par l’utilisateur, rollups, `timeline`, `gallery`, `list`, regroupement à deux niveaux.
1. **Statuts et approbations** — approbations multi-étapes, historique des transitions (approbateur par permission + notif livrés : [capabilities/approvals.md](docs/capabilities/approvals.md)). Ensuite : seuils de montant, délégation, escalade.
2. **Réglages** — réglages déclarés par un BC (manifeste), rendus par l’écran Paramètres ; tableau de bord sans widgets métier en dur.
3. **Documents** — impression personnalisée (modèles, marque de l’organisation ; le lab n’a pas Gotenberg). L’import d’une fiche depuis un endpoint du BC est livré (`RecordPageConfig.import`). Reste le type de document `{ domain, type }` : aujourd’hui il vit en base (`DocTypeController`), pas dans un seed de référence — ne pas inventer un second format.
4. **Conversation IA et chat** — un seul concept de conversation, outils tirés des BCs. Runtime / admin fournisseurs : [docs/capabilities/ai.md](docs/capabilities/ai.md).
5. **Composants métier** — montants, BTP ; i18n par BC ; écrans utilisables sur mobile ; surcharge du design par produit.
6. **Tenancy `multi`** — API, isolation, sélecteur et seeding à la création : livrés (voir [PLATFORM.md](docs/PLATFORM.md#connexion-et-organisation)). Reste la console opérateur (écrans Organisations et Utilisateurs), le lien d’invitation branché sur `InvitationAcceptService`, la coquille publique, le débit, l’effacement et le consentement de partage.
7. **Sektor sur le host** — `app.nafura.json` + BCs Sektor, suppression de `socle`, plus de vérification de rôle ; e2e Sektor verts. Puis suppression de l’héritage isolé ([spec 04](specs/revue-plateforme/04-heritage-sektor.md) lot 3) : pages `lib/anatomy/pages` marquées, `ErpEntityTransitionEvent` / `ErpNotificationPublisher` / `ErpDomainNotificationListener`.
8. **Publication** — BOM Maven et paquets npm à la place de `includeBuild` et des alias source ; venue-catalog et MBS sur le host.

## Manques structurants

> Exercice Sektor → core banking → CMS (2026-10-08). Concepts qu’une banque ou un CMS demanderont aussi. Chacun devient une spec (`specs/`) quand il est affecté. **1, 2 et 3 sont livrés** ([ARCHITECTURE.md](docs/ARCHITECTURE.md)).

| # | Concept | Ordre |
|---|---|---|
| 1 | Contrat entre BCs (`provides` / `requires`, jamais le code) | livré |
| 2 | Périmètre de données (rôle limité à un nœud) | livré |
| 3 | Verrouillage optimiste (`@Version`, 409) | livré |
| 7 | Document à lignes et arbre avec agrégats | ensuite — **L** |
| 8 | Lien externe à jeton (objet, hash, expiration, usage unique, révocation) | **S** |
| 5 | Versions figées et éditions publiées | **M** |
| 4 | Mouvements immuables → soldes, réservations ; record immuable (contre-passation) | avec le premier produit financier — **M** |
| 6 | Délais et échéances (passage d’état, escalade, rappel) | avec le premier produit financier — **M** |

À ajouter aux capabilities déjà prévues : approbation (seuils, délégation, escalade) ; fiabilité des intégrations (fichiers à format fixe, SFTP, reprise, actions de masse asynchrones avec compte rendu) ; référentiels (quantité avec unité, taux de change) ; grand livre construit sur le n° 4 ; tiers unique à plusieurs rôles (capability ou modèle, à décider) ; banque (bitemporalité, journée comptable, archivage et partitionnement).

## Nouvelles capabilities (à concevoir)

> Recensées le 2026-10-06 à partir des besoins de Talents Boosters (recrutement), Sektor (BTP) et de deux produits envisagés : un système de gestion de cartes (CMS, type PowerCARD de HPS) et un core banking. Chacune devient une capability du catalogue (`capabilities.json`, `docs/capabilities/<id>.md`, test `testWithout-<cap>`) au moment de sa conception. Ordre : d’abord ce qui sert plusieurs produits.

### Communes (tous produits) — en premier

1. **Moteur de règles** — règles déclaratives (JSON) évaluées à la volée, résultat expliqué règle par règle ; le scoring à critères pondérés en est un cas (matching Talents Boosters, comparaison de devis Sektor, éligibilité et limites bancaires, fraude).
2. **Référentiels** — taxonomies hiérarchiques, synonymes, portée produit ou organisation, import/export, **paramétrage versionné à date d’effet**, quantité avec unité, taux de change (postes types et compétences, référentiels articles et activités Sektor, produits bancaires).
3. **Chiffrement et données personnelles** — champs chiffrés au repos, clés dans Vault (HSM ensuite), masquage à l’affichage ; consentement versionné, export, effacement ou anonymisation, durées de conservation, registre des traitements (loi 09-08).
4. **Recherche et dédoublonnage** — plein texte, facettes, recherche sémantique, détection et fusion des doublons (vivier de candidats, articles et fournisseurs).
5. **Contrôles renforcés** — renforcer `approvals` (double validation : jamais le même utilisateur, sur toute modification déclarée sensible) et `audit` (journal scellé, non modifiable, conservation longue).
6. **Fiabilité des intégrations** — idempotence des opérations, outbox d’événements, reprise ; échanges de fichiers (formats fixes, SFTP) ; actions de masse côté serveur, asynchrones, avec compte rendu par record ; API publique (clés, quotas, OAuth client credentials, documentation).

### Ciblées

- **Agenda et créneaux** — entretiens (Talents Boosters, option B), planning de chantier.
- **Messagerie avec des externes** — recruteur ↔ candidat (option A), fournisseurs.
- **SMS et authentification forte** — OTP, ré-authentification avant une opération sensible (Keycloak le permet, rien n’est branché).
- **Signature électronique**, **paiement** (passerelle derrière `subscriptions`), **connecteurs entrants** (`webhooks` ne fait que sortir), **traduction du contenu**.

### Financières (CMS cartes, core banking)

- **Grand livre** — écritures en partie double immuables, soldes, multi-devises. Construit sur les mouvements immuables (manque structurant n° 4).
- **Tiers unique, plusieurs rôles** — un même tiers client, fournisseur, candidat ou client bancaire. Capability ou modèle à suivre : à décider.
- **Banque** — bitemporalité (date comptable, date de valeur, situation à une date passée), journée comptable et traitement de fin de journée, archivage et partitionnement.
- **Moteur de produits et de tarification** — produits paramétrables (frais, taux, plafonds, échéances), intérêts et commissions.
- **KYC**, **lutte anti-blanchiment** (listes de sanctions, scénarios, déclarations), **fraude** (scoring temps réel, file d’investigation).
- **Rapprochement** — lettrage automatique entre deux sources, gestion des écarts.
- **Traitements de fin de journée** — orchestration, ordre, reprise et rejeu (au-delà de `jobs`).
- **Messagerie financière** (ISO 8583, ISO 20022, SWIFT), **reporting réglementaire** (Bank Al-Maghrib), **tokenisation PCI-DSS**.

Limite à garder en tête : la plateforme couvre le **back-office** de ces produits (paramétrage, KYC, cycle de vie des cartes, réclamations, double validation, reporting). Le **moteur transactionnel** (autorisation carte en temps réel, ledger à forte cohérence, haute disponibilité, certifications) est un composant dédié, à concevoir à part et piloté par la plateforme.
