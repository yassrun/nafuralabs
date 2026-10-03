# Architecture Nafura

> Cible et état réel. Un écart entre ce document et le code est un bug de l’un des deux.

## En une phrase

**Un produit Nafura = un `app.nafura.json` + des BCs.** La plateforme fournit tout le reste (connexion, organisations, rôles, administration, réglages, shell, documents, IA, ops). Un fichier produit qui n’est ni de la configuration ni du code métier de BC est un manque de la plateforme.

## Le dépôt

| Dossier | Rôle |
|---|---|
| `nafura-platform/` | La plateforme : `sources/backend` (Spring Boot, modules Gradle), `sources/web` (Angular, bibliothèques), `ops/` (déploiement commun), `scripts/`, `capabilities.json`, `stack.versions.properties`. |
| `platform-host/` | Le produit de référence : `app.nafura.json`, points d’entrée, `bcs/demo`. Tout nouveau produit en est une copie. |
| `sandbox/` | Vitrine des composants UI (legacy, connexion lab propre). |
| `sektor/` | ERP BTP. **Ancienne architecture** (`socle` = plateforme-bis dans le produit) ; sera reconstruit sur le host (`sektor-sur-host`). Ne pas le prendre pour modèle. |
| `venue-catalog/`, `mbs-studio/`, `corporate/` | Autres produits et vitrines, hors host pour l’instant. |
| `raster/` | Outil de pilotage (en pause). |
| `deps/` | JDK et Node du projet (versions de `stack.versions.properties`). |

## Couches

```mermaid
flowchart TB
  subgraph Produit["Produit (ex. platform-host)"]
    M["app.nafura.json"]
    BC["bcs/&lt;bc&gt;/ : bc.manifest.json + backend + web"]
  end
  subgraph Plateforme["nafura-platform"]
    HOST["host : lit les manifestes, compose, démarre"]
    CAP["capabilities (catalogue capabilities.json)"]
    CORE["core : framework, record, sécurité, organisations, rôles, seeding"]
    UI["web : shell, archétypes d’écran, composants anatomy"]
  end
  INFRA["infra partagée : PostgreSQL, Keycloak, Gotenberg, MinIO, Vault"]
  Produit --> HOST
  HOST --> CAP --> CORE
  HOST --> UI
  CORE --> INFRA
```

- **Core** (toujours présent) : `cap.foundation` (framework, record, multi-tenant, observabilité, settings), `cap.lab` (runtime du host : manifeste, organisation, seeding, mode lab), `cap.access` (rôles et permissions).
- **Capabilities** : tout le reste (`iam`, `approvals`, `documents`, `notifications`, `ai`, …). Le host les embarque **toutes**, testées ensemble ; un produit en retire par `spec.capabilities.disabled`. Il n’en ajoute jamais.
- **BC** (business context) : le métier d’un produit. Il dépend des API publiques de la plateforme, jamais d’un autre BC ni de Sektor.

## Un produit

```
<produit>/
  app.nafura.json          identité, runtime, rôles composés, ports et utilisateurs lab, déploiement
  bcs/<bc>/
    bc.manifest.json       permissions, rôles par défaut, navigation, libellé, icône, routesPrefix
    backend/               entités, RecordController, cycles de vie JSON, migrations SQL, jeux de données
    web/                   configurations d’écrans (ListingPageConfig, RecordPageConfig) ; export default
  sources/{backend,web}/   points d’entrée : identiques octet pour octet à platform-host (garde-fou)
  ops/run.mjs              appelle le lanceur commun ; ops/k8s/<env>/ : patches propres au produit
```

Le nom du produit n’existe que dans `app.nafura.json`. Le backend le lit au démarrage, Gradle et le web au build. Création : `node nafura-platform/scripts/nafura.mjs new <id> --name "<Nom>"`.

## Règles d’architecture (décisions)

1. **Configurer, pas coder.** Un BC déclare ; la plateforme lit. Pas de générateur qui copie du code dans le produit.
2. **Une seule implémentation par besoin.** Un besoin générique remonte dans la plateforme une fois, sous un seul artefact (une liste, une fiche, une sidebar, un mécanisme de rôles). Jamais de copie dans un produit.
3. **Permissions, jamais de rôles dans le code.** Un BC déclare ses permissions (`<bc>.<feature>.<ressource>.<action>`) et des rôles par défaut ; le produit compose des rôles transverses ; l’organisation crée les siens. Aucune permission implicite.
4. **Mêmes migrations partout.** Le changelog est généré depuis les modules composés ; le lab l’applique et valide les entités ; staging et prod le passent par un Job avant le déploiement.
5. **La connexion appartient à l’environnement** : lab = sélecteur d’utilisateurs sans mot de passe (interdit en prod) ; ailleurs = Keycloak partagé, un client par produit, jeton vérifié (émetteur, signature, destinataire).
6. **Organisation** : `spec.runtime.tenancy: single` (une organisation par déploiement, créée par la plateforme, propriétaires déclarés par environnement). `multi` est la cible suivante.
7. **Données initiales = fichiers du BC**, appliqués à chaque organisation à travers les règles des records (validation, cycle de vie), idempotents.
8. **Un écran = un archétype configuré** (liste, fiche, arbre, assistant, étapes). Voir [UI.md](UI.md).
9. **Lab mode** : aucun produit n’a encore de données métier en prod (sauf vitrines MBS et corporate). Schéma cible net, pas de migrations défensives.

## Environnements

| Mode | Où | Base | Connexion | Données de démo |
|---|---|---|---|---|
| `lab` | poste | PostgreSQL embarqué | utilisateurs lab | oui |
| `local-staging` | poste | PostgreSQL du staging | Keycloak staging | oui |
| `staging` | Docker Desktop k8s | infra `nafura-infra-staging` | Keycloak staging | oui |
| `prod` | VPS OVH k3s | infra `nafura-infra-prod` | Keycloak prod | jamais |

Lancement : [ops/README.md](../ops/README.md).

## État et écarts

| Sujet | État |
|---|---|
| Host, manifestes, capabilities, BC démo, rôles, connexion, seeding | livrés (`platform-host`) |
| `tenancy: multi` dans le web du host | à faire |
| Approbation par permission (au lieu d’un rôle), multi-étapes, historique | à faire |
| Réglages déclarés par BC, documents (impression, marque, import), conversation IA, tableau de bord | à faire |
| i18n par BC (libellés du BC démo en dur) | à faire |
| Sektor sur le host (supprimer `socle`, vérifications de rôles `OWNER`) | à faire |
| Publication (BOM Maven, paquets npm) à la place de `includeBuild` et des alias source | après Sektor |
| `platform/lab-auth` : seulement pour `sandbox` | à migrer |

Feuille de route : [ROADMAP.md](../ROADMAP.md).
