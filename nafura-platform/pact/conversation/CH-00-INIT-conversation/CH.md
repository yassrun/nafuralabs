# CH-00-INIT — conversation

**Type :** `EVOL` (forme `INIT` — premier contrat du BC)
**Cible :** BC `conversation` (nouveau)
**Qualification :** le CADRE annonce ce contexte ; aucun contrat ne le porte. `INIT` = `EVOL` depuis l'état vide — jamais `CORRECTION`.

## Pourquoi

Un jar sans contrat n'a pas de frontière : on ne peut ni lui refuser un besoin, ni savoir ce qu'il promet. L'INIT existe pour **couper** — dire ce qui entre dans le BC et ce qui reste dehors.

## Aujourd'hui

`ai-conversation`, `ai-agent-api`, `ai-agent-runtime`, `llm-provider` — pas de `SPEC.md`, pas de `e2e/conversation/`.

## Attendu

Une `SPEC.md` d'une page (intention · owns / not_owns · données · règles) et une **baseline e2e** qui fige le comportement actuel avant qu'on y touche.

## Coupe (AC-2)

**Entrent :** `ai-conversation`, `ai-agent-api`, `ai-agent-runtime` — session, messages, tour, actions proposées. Le client web `features/ai/ai-conversation` (API + blocs) entre avec le BC.

**Dehors :** `llm-provider` → **socle**. Appeler un modèle est transverse : `document-extraction` l'appelle déjà ; un BC ne peut pas dépendre d'un autre BC. Clés et prestataire vivant → **ops**.

## Critères d'acceptation (gelés)

- **AC-1** `SPEC.md` existe et son `not_owns` porte au moins une exclusion, chacune nommant qui s'en charge.
- **AC-2** La coupe est tranchée et écrite : `ai-conversation`, `ai-agent-api`, `ai-agent-runtime` entrent ; `llm-provider` relève du **socle** (jar) ; clés / prestataire vivant relèvent d'**ops**.
- **AC-3** Une baseline e2e `conversation-*` passe sur le comportement **actuel**, sans le corriger. (`R-1`, `R-2`, `R-3`, `INV-2`)
- **AC-4** Un lecteur de la seule SPEC peut répondre : « ce besoin appartient-il à `conversation` ? »
- **AC-5** Aucune règle métier produit n'entre dans la SPEC. Aucune classe des jars qui **entrent** n'expose un type métier produit (`FACTURE`, `CHANTIER`, `DpgfNoeud`). (`INV-1`)

## Preuves attendues

Scénarios e2e (projet `nafura-platform/e2e/`, rangement interne `e2e/conversation/` optionnel) :

| Scénario | État initial | AC |
|----------|--------------|----|
| `conversation-creer-et-lister` | tenant A, une personne authentifiée | AC-3 |
| `conversation-deux-tenants` | une session chez A ; session B ensuite | AC-3 |
| `conversation-session-introuvable` | tenant A, un id de session inconnu | AC-3 |
| `conversation-messages-vides` | tenant A, une session nouvelle | AC-3 |
| `conversation-frontiere-produit` | compile : zéro type métier produit dans les jars qui entrent | AC-5 |

Les tests déjà verts des modules `ai-conversation` / `ai-agent-runtime` **peuvent** servir s'ils assertent bien les AC — l'exec le déclare. Un test écrit directement vert sans avoir été vu rouge est refusé.

**La règle de discrimination ne s'applique pas** (baseline). Substitut : le test a été vu rouge avant d'être vert.

Revue humaine pour AC-1, AC-2, AC-4.

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

Canvas : aucun — INIT de contrat / baseline API, pas de refonte d'écran.

## Hors périmètre

Déplacer le code → `CH-01-TECHNICAL-plier` · refondre le comportement · brancher un nouveau consommateur · capacité LLM et `P-CONVERSATION-*` dans le socle → `CH-09-EVOL-consommateur-conversation`
