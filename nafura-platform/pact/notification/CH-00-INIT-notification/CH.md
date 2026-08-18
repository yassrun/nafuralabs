# CH-00-INIT — notification

**Type :** `EVOL (forme `INIT` — premier contrat du BC)`
**Cible :** BC `notification` (nouveau)
**Qualification :** le CADRE annonce ce contexte ; aucun contrat ne le porte. Le code vit dans `features/collaboration/notification`.

## Pourquoi

Un jar sans contrat n'a pas de frontière : on ne peut ni lui refuser un besoin, ni savoir ce qu'il promet. L'INIT existe pour **couper** — dire ce qui entre dans le BC et ce qui reste dehors.

## Aujourd'hui

`features/collaboration/notification` — pas de `SPEC.md`, pas de `e2e/notification/`.

## Attendu

Une `SPEC.md` d'une page (intention · owns / not_owns · données · règles) et une **baseline e2e** qui fige le comportement actuel avant qu'on y touche.

## Coupe (AC-2) — décidé seul

**Notifier, pas transporter.** Le BC possède le message à une personne (boîte, lu / non lu, préférence de canaux). Le canal (e-mail, push) appartient à **ops** — comme Gotenberg pour impression. Le jar parle encore à Brevo ; le déplacement est `CH-01-TECHNICAL-plier`.

## Critères d'acceptation (gelés)

- **AC-1** `SPEC.md` existe et son `not_owns` porte au moins une exclusion, chacune nommant qui s'en charge.
- **AC-2** La coupe est tranchée et écrite : notifier ou transporter — le canal (e-mail, push) appartient-il au BC ou à ops.
- **AC-3** Une baseline e2e `notification-*` passe sur le comportement **actuel**, sans le corriger.
- **AC-4** Un lecteur de la seule SPEC peut répondre : « ce besoin appartient-il à `notification` ? »
- **AC-5** Aucune règle métier produit n'entre dans la SPEC.

## Preuves attendues

Scénarios e2e (projet `nafura-platform/e2e/`, pas par BC) — AC-3. Revue humaine pour AC-1, AC-2, AC-4, AC-5.

| Scénario | État initial | Règle |
|----------|--------------|-------|
| `notification-deposer-et-lister` | tenant A, personne P, un message (titre + corps) déposé pour P | liste le montre, non lu (`R-1`, `R-3`) |
| `notification-deux-tenants` | message déposé pour P chez A ; B ensuite | B ne le liste pas (`INV-2`, `POL-TENANT-ISOLATION`) |
| `notification-marquer-lue` | une non lue chez P dans A | après marque : lue, compteur descend (`R-2`) |
| `notification-autre-destinataire` | tenant A, personnes P et Q, message déposé pour P | Q ne le liste pas (`R-1`) |

Pas d'e2e sur l'envoi Brevo / push : le canal n'est pas de ce BC (`INV-3`). Pas d'e2e « frontière jar propre » : le jar contient encore de l'ERP — hors contrat, `CH-01-TECHNICAL-plier`.

**La règle de discrimination ne s'applique pas** (baseline). Substitut : le test a été vu rouge avant d'être vert.

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

## Hors périmètre

Déplacer le code → `CH-01-TECHNICAL-plier` · refondre le comportement · brancher un nouveau consommateur

## Constat d'écart

**2026-08-17** — Après PLT-110 (`done-me`). SPEC inchangée : les 4 tests verts confirment `R-1` · `R-2` · `R-3` (déposer / lister) · `INV-2` ; aucun n'a montré que la SPEC avait mal deviné. Coupe canal → ops (`INV-3`) hors preuve e2e, volontaire — pas une divergence. Pas de dette de contrat.
