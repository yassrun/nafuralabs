# CH-03-EVOL — builder et workflow : dedans ou dehors

**Type :** `EVOL`
**Cible :** BC `document-extraction`
**Qualification :** le code porte un builder et un workflow dont la SPEC ne parle pas.

## Pourquoi

Du code qu'aucun contrat ne couvre n'est ni maintenu ni supprimable : personne ne sait s'il est promis à quelqu'un. Soit la SPEC les prend, soit le code les rend.

## Aujourd'hui

`builder` et `workflow` vivent dans le BC sans ligne de SPEC.

## Attendu

**Le spec tranche pour chacun** : dans le contrat avec ses règles, ou hors du BC. Le code suit.

## Critères d'acceptation (gelés)

- **AC-1** Pour `builder` comme pour `workflow`, la SPEC dit explicitement `owns` ou `not_owns`.
- **AC-2** Ce qui est `not_owns` nomme qui s'en charge à la place.
- **AC-3** Le code aligné : rien d'exposé qui ne soit dans le contrat.
- **AC-4** La suite e2e `extraction-*` reste verte.

## Preuves attendues

Revue de SPEC pour AC-1, AC-2. Suite `extraction-*` pour AC-4.

## Hors périmètre

Refondre le moteur de lecture · les grilles · le cache
