# 10 — Pages publiques

## Objectif

Un BC peut exposer des écrans **consultables sans connexion** (catalogue, offres, page de présentation), alimentés par des endpoints publics en lecture seule, avec le même archétype de liste et de fiche en lecture.

## Besoin

Offres d’emploi, catalogue produits, annuaire : la première page qu’un visiteur voit, et le point d’entrée de l’inscription (spec 11).

## Existant

- Backend : `core/authorization/.../SecurityConfig.java` — `PublicEndpointRegistry` (règles `permitAll` par motif et méthode) et `securityProperties.getPublicEndpoints()` ; `PublicAwareBearerTokenResolver` (ignore un jeton sur un endpoint public) ; `TenantContextFilter` saute les chemins configurés.
- Convention existante : `/api/public/**` (déjà exclu du jeton par `hostAuthInterceptor`).
- Web : `platform/host/provide-nafura-host.ts` (routes, garde `hostAuthGuard`), `platform/host-auth/host-auth.guard.ts`, shell `platform/app-shell/`.

## Contrat

- `bc.manifest.json` → `spec.public: { "routes": ["/catalogue", "/catalogue/:id"], "endpoints": ["GET /api/public/<bc>/items/**"] }` — déclaration explicite, validée par le schéma ; un endpoint public doit commencer par `/api/public/<bc>/`.
- Backend : un BC déclare un contrôleur de lecture publique, ex. `class PublicItemController extends PublicRecordController<Item>` (nouveau, dans `framework/record`) : liste paginée et lecture seulement, **projection explicite** des champs exposés (jamais l’entité entière), filtre obligatoire « publiable » (ex. `published = true`) déclaré par le contrôleur.
- Le registre `PublicEndpointRegistry` est alimenté par les manifestes au démarrage (pas de liste manuelle dans la configuration Spring).
- Le mode d’un endpoint public se déclare sur l’annotation existante `@PublicEndpoint` : `scope = AGGREGATED | ORGANISATION`. On ne crée pas d’annotation nouvelle. La démo montre le catalogue agrégé.
- Dans l’URL, l’organisation apparaît par un slug (`/p/{slug}/…`), jamais par son UUID. En `single`, le slug est celui de l’organisation du déploiement.
- Web : routes publiques rendues dans un **shell public** (en-tête simple avec marque du produit et bouton « Se connecter »), sans `hostAuthGuard` ; mêmes archétypes de liste et de fiche en lecture seule (`RecordPageConfig` sans `permissions.update`).

### Projection

`@PublicField` est une liste explicite : un champ n’est public que s’il porte l’annotation, et tout est masqué par défaut. Le record confidentiel est une condition au niveau du record, distincte des champs. Elle s’applique partout où l’enregistrement sort vers un public non membre (pages publiques, audience externe de la spec 11).

### Dépôt public (écriture sans connexion)

Un BC peut déclarer **un** endpoint public d’écriture par ressource, pour un dépôt simple (formulaire de contact, candidature) : `spec.public.submissions: ["POST /api/public/<bc>/<ressource>"]`.

- Corps limité aux champs déclarés ; fichiers joints contrôlés (type MIME réel, pas seulement l’extension ; taille max ; un fichier).
- Protection anti-robot (défi côté serveur, ex. jeton à usage unique délivré par la page publique + piège invisible), limitation de débit par IP **et** par e-mail sur le dépôt public. La même limite s’applique à l’envoi du lien e-mail (spec 11).
- Le consentement (case obligatoire, texte et version enregistrés avec horodatage) est une donnée exigée par la déclaration, refusée si absente (422).
- La réponse ne révèle rien sur l’existence d’un compte ou d’un enregistrement pour cet e-mail.
- Traitement lourd (lecture de document, spec 08) **après** l’enregistrement, en tâche de fond : le dépôt réussit même si l’extraction échoue.
- Lien avec la spec 11 : le dépôt crée ou retrouve le compte implicite de l’e-mail.

## Sécurité

- Lecture seule hors dépôts déclarés, champs projetés explicitement, pagination plafonnée, limitation de débit par IP.
- Aucune donnée personnelle exposée par défaut : test qui échoue si une projection publique contient un champ d’audit (`createdBy`, …).

## Démo

- Articles : champ `published` ; page publique `/catalogue` (liste) et `/catalogue/:id` (fiche en lecture) ; seeds avec des articles publiés et non publiés.
- `scenario-api.sh` : `GET /api/public/demo/items` sans jeton → 200, uniquement les publiés, sans champs d’audit ; `GET /api/v1/demo/items` sans jeton → 401.
- Article « confidentiel » : son fournisseur est remplacé par un libellé générique en public.
- Dépôt public : « Demander un devis » sur la fiche publique d’un article (e-mail + PDF facultatif + consentement) → crée une demande côté organisation ; sans consentement → 422 ; 20 dépôts en rafale → 429.

## Critères d’acceptation

- [ ] `/catalogue` s’ouvre dans une fenêtre privée, sans connexion.
- [ ] Un article non publié n’apparaît ni en liste ni par son id (404).
- [ ] Le bouton « Se connecter » mène à la connexion puis à l’application.
- [ ] Un endpoint public non déclaré dans le manifeste n’est pas ouvert.

## Documentation

`docs/PLATFORM.md` : section « Pages publiques » ; `docs/UI.md` : ligne « Page publique » ; schéma `bc.manifest`.

## Décisions (2026-10-04)

- Le mode se déclare sur `@PublicEndpoint`, l’annotation existante : `scope = AGGREGATED | ORGANISATION`. On ne crée pas d’annotation nouvelle. La démo montre le catalogue agrégé.
- Dans l’URL, l’organisation apparaît par un slug (`/p/{slug}/…`), jamais par son UUID.
- `@PublicField` est une liste explicite : un champ n’est public que s’il porte l’annotation, et tout est masqué par défaut. Le record confidentiel est une condition au niveau du record, distincte des champs.
- L’inscription implicite et le lien e-mail (spec 11) sont gardés. Une limite de débit s’applique au dépôt public et à l’envoi du lien.

## État (2026-10-04)

Livré : `scope` sur `@PublicEndpoint`, `@PublicField` et `@Confidential`, ouverture seulement des chemins déclarés dans `spec.public`, catalogue démo `GET /api/public/demo/items` (publiés, article confidentiel retiré, non publié en 404, API privée en 401).

Reste : coquille web `/catalogue` et `/p/{slug}` (pas d’archétype public), dépôt public, inscription implicite, limite de débit sur le dépôt et sur l’envoi du lien. Le filtre de slug `ORGANISATION` n’est pas branché : la démo est `AGGREGATED`.
