# CH-00-INIT — cadre

**Type :** `EVOL` (forme `INIT` — première vérité de l'app)
**Cible :** app `nafura-platform`
**Qualification :** aucune frontière écrite n'existait ; `pact/` était vide.

## Pourquoi

Sans CADRE, chaque SPEC de contexte recopie une envie de plateforme, ou absorbe le métier du premier client (Sektor). Rien ne permet de refuser un besoin.

## Aujourd'hui

Un arbre de modules (`core/`, `features/`) sans contrat de frontière. Pas de `CADRE.md`.

## Attendu

Un `CADRE.md` d'une page : intention · périmètre (`owns` / `not_owns`) · acteurs · voisins · contraintes · vocabulaire. La carte est **générée**, vide au jour 0.

## Critères d'acceptation (gelés)

- **AC-1** `not_owns` contient au moins une exclusion, et chacune nomme qui s'en charge à la place.
- **AC-2** Chaque contrainte est **opposable** — on peut la contredire.
- **AC-3** Le CADRE tient en une page et ne contient ni règle métier, ni technique, ni roadmap, ni liste de contextes écrite à la main.
- **AC-4** Un lecteur du seul CADRE peut répondre : « ce besoin appartient-il à Nafura Platform ? »

## Preuves attendues

**Revue humaine.** Pas d'e2e : il n'y a pas de parcours à prouver sur une frontière.
