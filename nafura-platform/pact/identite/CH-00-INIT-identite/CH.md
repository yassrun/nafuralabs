# CH-00-INIT — identite

**Type :** `EVOL` (forme `INIT` — premier contrat du BC)
**Cible :** BC `identite` (nouveau)
**Qualification :** le CADRE annonce ce contexte ; aucun contrat ne le porte. Le code vit dans `core/identity`, `iam`, `settings`.

## Pourquoi

Un jar sans contrat n'a pas de frontière : on ne peut ni lui refuser un besoin, ni savoir ce qu'il promet. L'INIT existe pour **couper** — dire ce qui entre dans le BC et ce qui reste dehors.

## Aujourd'hui

`core/identity`, `iam`, `settings` — pas de `SPEC.md`, pas de `e2e/identite/`. `app-settings` et `user-settings` à trancher avec.

## Attendu

Une `SPEC.md` d'une page (intention · owns / not_owns · données · règles) et une **baseline e2e** qui fige le comportement actuel avant qu'on y touche.

Ce que l'INIT coupe : les trois jars d'un coup. **Pas de 2ᵉ lot iam.** `settings` n'est pas « qui est là » → `not_owns`.

## Critères d'acceptation (gelés)

- **AC-1** `SPEC.md` existe et son `not_owns` porte au moins une exclusion, chacune nommant qui s'en charge.
- **AC-2** La coupe est tranchée : membres / invitation / organisation **entrent** (jar `iam` inclus). **Pas de 2ᵉ lot iam.** `settings`, `app-settings`, rôles custom / catalogue de permissions, IdP, domaines / features : `not_owns`, chacun avec qui s'en charge.
- **AC-3** Une baseline e2e `identite-*` passe sur le comportement **actuel**, sans le corriger.
- **AC-4** Un lecteur de la seule SPEC peut répondre : « ce besoin appartient-il à `identite` ? »
- **AC-5** Aucune règle métier produit n'entre dans la SPEC. (`INV-1`, `POL-PAS-METIER-PRODUIT`)

## Preuves attendues

`e2e/identite/` — baseline verte pour AC-3. Revue humaine pour AC-1, AC-2, AC-4, AC-5.

| Scénario | État initial | AC |
|----------|--------------|----|
| `identite-deux-tenants` | deux tenants A et B, chacun avec un admin membre ; A a un membre M (email unique à A) | AC-3 (`R-1`, `R-7`, `POL-TENANT-ISOLATION`) |
| `identite-inviter-membre` | tenant A, admin ; email `invitee-a@example.test` pas encore membre de A ; un code de rôle qui existe pour A | AC-3 (`R-2`) |
| `identite-accepter-invitation` | appartenance invitée pour cet email chez A, jeton valide ; IdP non branché (lab) | AC-3 (`R-3`) |
| `identite-retirer-membre` | un membre (invité ou actif) chez A | AC-3 (`R-5`) |
| `identite-frontiere-produit` | compile : zéro type métier produit dans identite | AC-3, AC-5 (`INV-1`) |

**La règle de discrimination ne s'applique pas** (baseline). Substitut : chaque test a été **vu rouge** avant d'être vert. Un test écrit directement vert est refusé.

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

Actions nommées dans la SPEC : `P-IDENTITE-LIRE` · `P-IDENTITE-GERER`. Absentes de la matrice → `socle/CH-07-EVOL-consommateur-identite`. L'e2e assert le comportement, pas la chaîne `P-…`.

Canvas : [`../ux/membres-tenant-wireframe.canvas.tsx`](../ux/membres-tenant-wireframe.canvas.tsx)

## Hors périmètre

Déplacer le code → `CH-01-TECHNICAL-plier` · refondre le comportement · brancher un nouveau consommateur · patcher le socle (matrice, consommateurs) · brancher l'IdP · envoyer le courrier
