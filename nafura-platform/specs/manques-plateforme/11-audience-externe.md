# 11 — Audience externe

## Objectif

Un produit sert, en plus de ses **membres** (utilisateurs internes invités dans une organisation), une **audience externe** : des personnes qui **s’inscrivent elles-mêmes**, n’appartiennent à aucune organisation, ont leur propre shell, et ne voient que ce qui les concerne.

## Besoin

Candidats, clients finaux, fournisseurs sur un portail, patients : ils ne sont pas membres de l’organisation et ne doivent jamais voir ses données internes. Aujourd’hui toute la plateforme suppose des membres invités.

## Existant

- Identité : `identite/identity`, `identite/iam` (invitations, `TenantInvitation`), Keycloak en cluster, utilisateurs lab en local (`spec.local.users`, `POST /api/public/lab/session`).
- Session web : `GET /api/v1/me/session`, `GET /api/v1/me/permissions` ; `platform/host-auth/`.
- Shell : `app.nafura.json` `spec.shell`, `platform/app-shell/` (une seule configuration de shell).
- Permissions : `@SecuredResource`, `@RequirePermission`, rôles `defaultRoles` des BCs.

## Contrat

- `app.nafura.json` → `spec.audiences: [{ "id": "external", "label": "Espace candidat", "signup": "implicit" | "invite", "login": "email-link", "shell": { … }, "defaultRoute": "/espace" }]`. L’audience des membres reste implicite (`members`).
  - `signup: "implicit"` (**décidé**) : aucune inscription. Le compte est créé en silence par le premier dépôt public (spec 10) avec un e-mail ; un second dépôt avec le même e-mail le retrouve (pas de doublon).
  - `login: "email-link"` (**décidé**) : connexion par lien à usage unique envoyé par e-mail (durée courte, ex. 15 min ; lien de suivi dans chaque notification). Pas de mot de passe à créer ; la personne peut en ajouter un plus tard si le fournisseur d’identité le permet.
- `bc.manifest.json` :
  - `navigation[].audience` (défaut `members`) — une entrée de menu appartient à une audience ;
  - `defaultRoles[].audience` — un rôle par défaut attribué à toute personne inscrite dans cette audience (ex. `EXTERNAL_SELF`).
- Identité : une personne externe a un compte de connexion (Keycloak / lab) **sans appartenance à une organisation**, créé implicitement, sans mot de passe. Vérifier ce que Keycloak offre pour la connexion par lien e-mail ; sinon un endpoint plateforme émet un jeton à usage unique, l’échange contre une session, et le compte Keycloak reste sans mot de passe. Cliquer le lien vaut vérification de l’e-mail. En lab, utilisateurs externes déclarés dans `spec.local.users` avec `audience: "external"` et le sélecteur lab habituel.
- Autorisation « mes données » : nouveau concept de **propriétaire** d’un enregistrement — `@OwnedBy("field")` (ou équivalent déclaratif) sur l’entité, et des permissions d’audience externe qui ne valent **que** sur les enregistrements dont la personne est propriétaire. Le `RecordController` applique ce filtre en liste comme en lecture et en écriture.
- Session : `GET /api/v1/me/session` renvoie `audience` ; le web choisit le shell et la route par défaut selon l’audience.

## Comportement et sécurité

- Une personne externe n’a jamais d’en-tête d’organisation et ne passe jamais par `TenantContextFilter` pour ses propres données (voir spec 12 pour où vivent ces données).
- Toute route ou endpoint non déclaré pour l’audience externe lui est refusé (403), y compris les écrans de la plateforme (administration, approbations).
- Un membre ne devient pas externe et inversement par simple configuration : ce sont deux comptes ou deux profils distincts — **à trancher** (voir décisions).
- Suppression de compte à la demande de la personne (droit à l’effacement) : exposée dans son espace.

## Démo

Portail fournisseur :
- Audience `external` « Portail fournisseur », inscription `invite` (un membre invite un contact fournisseur) pour la démo, `open` testée par un host-test.
- Le contact fournisseur voit **ses** demandes d’achat commandées (`ORDERED`) et peut y déposer une facture (pièce jointe, spec 04) — rien d’autre.
- Lab : `contact@supplier.local` (`audience: external`).
- `scenario-api.sh` : le contact lit ses commandes → 200 et seulement les siennes ; lit une demande d’un autre fournisseur → 404 ; appelle `/api/v1/demo/suppliers` → 403.
- host-test : `ExternalAudienceHostTest` (inscription, filtre propriétaire, refus des écrans membres).

## Critères d’acceptation

- [ ] Un dépôt public avec un e-mail inconnu crée le compte implicite ; un second dépôt avec le même e-mail le retrouve.
- [ ] Le lien reçu par e-mail connecte sans mot de passe ; un lien expiré ou déjà utilisé est refusé avec un message clair et l’option d’en recevoir un nouveau.
- [ ] Un contact invité se connecte par lien et arrive sur son portail, avec son propre menu.
- [ ] Il ne voit que ses commandes ; aucun écran membre n’est accessible, même par URL.
- [ ] Un membre ne voit pas le portail dans son menu.
- [ ] L’effacement du compte externe supprime ses données personnelles (ou les anonymise, selon la décision).

## Documentation

`docs/ARCHITECTURE.md` : nouvelle règle « Audiences » ; `docs/PLATFORM.md` : section « Audience externe » (manifestes, propriétaire, session) ; `docs/UI.md` : shell d’audience ; schémas.

## Décisions ouvertes (à trancher avant de coder)

1. **Une personne à la fois membre et externe** (un recruteur qui postule ailleurs) : un compte avec deux audiences et un sélecteur, ou deux comptes — **recommandation** : un compte, audiences multiples, sélecteur comme pour les organisations.
2. **Forme de la notion de propriétaire** : annotation sur l’entité (`@OwnedBy`) ou champ standard `ownerId` sur une classe de base — **recommandation** : annotation, pour ne pas imposer un champ à toutes les entités.
3. **Effacement** : suppression ou anonymisation des données liées (ex. candidatures déjà traitées) — **recommandation** : anonymisation des données partagées, suppression du reste.
