# 11 — Audience externe

## Objectif

Un produit sert, en plus de ses **membres** (utilisateurs internes invités dans une organisation), une **audience externe** : des personnes qui **s’inscrivent elles-mêmes**, ont leur propre shell, et ne voient que ce qui les concerne. L’audience est un attribut de l’appartenance, pas un second compte.

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
- Un seul compte, plusieurs audiences. L’audience est un attribut de l’appartenance qui existe déjà (`TenantMembership`), pas un second compte. Le sélecteur d’organisation existant est étendu à l’audience : pas de second sélecteur.
- Identité : le compte (Keycloak / lab) est créé implicitement, sans mot de passe. Vérifier ce que Keycloak offre pour la connexion par lien e-mail ; sinon un endpoint plateforme émet un jeton à usage unique, l’échange contre une session, et le compte Keycloak reste sans mot de passe. Cliquer le lien vaut vérification de l’e-mail. L’envoi du lien est limité en débit (spec 10). En lab, utilisateurs externes déclarés dans `spec.local.users` avec `audience: "external"` et le sélecteur lab habituel.
- `@OwnedBy` se pose sur le champ qui porte l’utilisateur. Sans annotation, le record n’a pas de propriétaire externe. On ne retombe jamais sur `createdBy`. Les permissions d’audience externe ne valent que sur les enregistrements dont la personne est propriétaire. Le `RecordController` applique ce filtre en liste comme en lecture et en écriture.
- Session : `GET /api/v1/me/session` renvoie l’audience de l’appartenance active ; le web choisit le shell et la route par défaut selon cette audience.

## Comportement et sécurité

- L’audience active est celle de l’appartenance choisie dans le sélecteur. Une audience externe ne voit pas les écrans membres. Ses propres données hors organisation suivent la spec 12.
- Toute route ou endpoint non déclaré pour l’audience externe lui est refusé (403), y compris les écrans de la plateforme (administration, approbations).
- Une même personne peut être membre d’une organisation et externe d’une autre : un compte, l’audience sur chaque appartenance, le sélecteur existant pour changer.
- Effacement à la demande de la personne, exposé dans son espace. Chaque entité déclare son cas : anonymiser (données partagées), supprimer (cas par défaut) ou conserver par obligation légale (gardé sans accès externe jusqu’à la fin de la durée légale).

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
- [ ] L’effacement suit la déclaration de chaque entité : anonymiser, supprimer, ou conserver sans accès externe jusqu’à la fin de la durée légale.

## Documentation

`docs/ARCHITECTURE.md` : nouvelle règle « Audiences » ; `docs/PLATFORM.md` : section « Audience externe » (manifestes, propriétaire, session) ; `docs/UI.md` : shell d’audience ; schémas.

## Décisions (2026-10-04)

- Un seul compte, plusieurs audiences. L’audience est un attribut de l’appartenance qui existe déjà. Le sélecteur d’organisation existant est étendu à l’audience, sans second sélecteur.
- `@OwnedBy` se pose sur le champ qui porte l’utilisateur. Sans annotation, le record n’a pas de propriétaire externe. On ne retombe jamais sur `createdBy`.
- À l’effacement, chaque entité déclare son cas : anonymiser (données partagées), supprimer (cas par défaut) ou conserver par obligation légale (gardé sans accès externe jusqu’à la fin de la durée légale).

## État (2026-10-04)

Livré : `audience` sur `TenantMembership` (défaut `members`), session et sélecteur existant (libellé si l’audience n’est pas `members`), filtre `RecordController` sur le champ `@OwnedBy` pour toute audience externe (aucun record sans annotation, jamais `createdBy`), annotation `@Erasure`.

Reste : exécution de l’effacement, connexion par lien e-mail, utilisateur lab d’audience externe dans la démo, shell d’audience distinct du sélecteur.
