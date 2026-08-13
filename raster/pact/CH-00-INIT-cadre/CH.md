# CH-00-INIT — cadre

**Type :** `EVOL` (forme `INIT` — première vérité de l'app)
**Cible :** app `raster`
**Qualification :** aucune frontière écrite n'existait ; l'app n'avait qu'une « carte » listant ses BC.

## Pourquoi

La carte des BC était écrite à la main et tenait lieu de frontière. Rien ne disait ce que Raster **ne fera jamais**, donc rien ne permettait de refuser un BC.

## Aujourd'hui

Un fichier `SPEC.md` au niveau app, listant socle + work, sans périmètre opposable ni vocabulaire.

## Attendu

Un `CADRE.md` d'une page : intention · périmètre (`owns` / `not_owns`) · acteurs · voisins · contraintes · vocabulaire. La carte devient **générée**.

## Critères d'acceptation (gelés)

- **AC-1** `not_owns` contient au moins une exclusion, et chacune nomme qui s'en charge à la place.
- **AC-2** Chaque contrainte est **opposable** — on peut la contredire.
- **AC-3** Le CADRE tient en une page et ne contient ni règle métier, ni technique, ni roadmap.
- **AC-4** Un lecteur du seul CADRE peut répondre : « ce besoin appartient-il à Raster ? »

## Preuves attendues

**Revue humaine.** Pas d'e2e : il n'y a pas de parcours à prouver sur une frontière.
