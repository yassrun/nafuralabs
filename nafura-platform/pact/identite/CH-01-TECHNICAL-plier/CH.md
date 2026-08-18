# CH-01-TECHNICAL — plier l'arbre

**Type :** `TECHNICAL`
**Cible :** BC `identite`
**Qualification :** le contrat est posé ; le code de **ce** BC vit encore sous `core/identity` et `features/administration/iam`. Aucune règle ne change.

## Pourquoi

Un contexte Pact a un arbre (`ARCHI_BLUEPRINT`). Tant que le code de ce BC porte le nom de son ancien paquet, le prochain Change travaille dans le mauvais dossier.

## Aujourd'hui

- Backend, deux jars owned (SPEC : personne · organisation · appartenance · invitation · session · affectation d'un code de rôle) :
  - `sources/backend/core/identity/` (sources Java sous `src/main/java/ma/nafura/core/` ; FQCN `ma.nafura.platform.identity`)
  - `sources/backend/features/administration/iam/` (sources Java sous `src/main/java/ma/nafura/core/` ; FQCN `ma.nafura.platform.administration.iam` ; `IdentiteBaselineTest` ici)
- Includes `includePlatform(":platform:core:identity")` et `includePlatform(":platform:features:administration:iam")` dans `sources/backend/settings.gradle.kts`.
- `settings` / `app-settings` / `user-settings` : **pas owned** (SPEC `not_owns` — INIT : settings n'est pas « qui est là »).
- Web de ce BC : `sources/web/features/administration/iam/members/` (`members.routes.ts` · `member-listing.page.ts` · `member-detail.page.ts` · `invite-member-dialog.component.ts` · `members-api.service.ts` · `members.facade.ts`).
- Consommateurs / hors arbre (pas de ce BC) : `features/administration/iam/roles/` (catalogue de rôles — socle) ; `features/user-settings/` (profil / session / mot de passe y vivent encore) ; shell `features/administration/administration.routes.ts` ; `core/tenant` · tenant-selection.
- e2e déjà `e2e/identite/` ; Gradle des e2e `:platform:features:administration:iam` (`e2e/identite/_gradle.mjs`).

## Attendu

Le module Gradle et le web de **ce** BC vivent sous `identite`. Les packages Java, les routes HTTP et les noms de scénarios `identite-*` **ne bougent pas**.

## Coupe web (AC-2) — décidé seul

**Entre** sous `sources/web/app/identite/` : écrans + client HTTP des membres (`features/administration/iam/members/` — listing, fiche, inviter).

**Reste consommateur / hors arbre** (repointe l'import, n'entre pas) : `features/administration/iam/roles/` entier (catalogue — SPEC `not_owns` → socle) · `features/user-settings/` · shell `administration.routes.ts` · `core/tenant` · tenant-selection.

La SPEC owns l'écran admin des membres. Le catalogue de rôles n'est pas l'arbre de ce BC. Profil / session HTTP vivent encore dans `user-settings` (INIT : not_owns) — ce plier ne les déplace pas.

## Critères d'acceptation (gelés)

- **AC-1** Les modules Gradle de ce BC vivent sous `sources/backend/identite/` :
  - `identite/identity/`, inclus `:platform:identite:identity` (`projectDir` = `identite/identity`)
  - `identite/iam/`, inclus `:platform:identite:iam` (`projectDir` = `identite/iam`)
  Les anciens includes `:platform:core:identity` et `:platform:features:administration:iam` ne sont plus. Les e2e lancent `:platform:identite:iam:test` ; les dossiers sources Java internes `src/main/java/ma/nafura/core/` restent.
- **AC-2** Le web de ce BC est sous `sources/web/app/identite/` (`members.routes.ts` · `member-listing.page.ts` · `member-detail.page.ts` · `invite-member-dialog.component.ts` · `members-api.service.ts` · `members.facade.ts`). L'ancien dossier `sources/web/features/administration/iam/members/` n'est plus.
- **AC-3** Les e2e restent sous `e2e/identite/`. Les noms `test("identite-…")` sont inchangés : `identite-deux-tenants` · `identite-inviter-membre` · `identite-accepter-invitation` · `identite-retirer-membre` · `identite-frontiere-produit`.
- **AC-4** La suite e2e existante (`identite-*`) reste verte.
- **AC-5** Les FQCN Java `ma.nafura.platform.identity` (dont `AppUser` · `AppUserProvisioningService`) et `ma.nafura.platform.administration.iam` (dont `IamController` · `InvitationPublicController` · `IdentiteBaselineTest`) et les routes `/api/tenants` · `/api/public/invitations` ne changent pas.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `identite-plier-arbre` | backend `core/identity` + `features/administration/iam` · web `features/administration/iam/members` · includes `:platform:core:identity` + `:platform:features:administration:iam` · e2e déjà `e2e/identite/` | AC-1, AC-2, AC-3, AC-5 |
| suite `identite-*` | inchangée (deux tenants / inviter / accepter / retirer / frontière produit — CH-00) | AC-4 |

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT` — inchangées (pas de patch SPEC).

## Hors périmètre

Renommer les packages · aligner le dossier `ma/nafura/core/` sur les FQCN · refondre l'intérieur `api/domain/…` · toucher au comportement · extraire rôles custom / domaines / features du jar `iam` (restent dans le jar ; SPEC `not_owns`) · jars `settings` · `app-settings` · `user-settings` · `core/tenancy` · `core/authorization` · login / mot de passe (ops) · catalogue de rôles (socle) · dossier `features/administration/iam/roles/` · shell `administration.routes.ts` · autres BC (seul un `project(':platform:…')` qui nomme l'ancien include suit AC-1)
