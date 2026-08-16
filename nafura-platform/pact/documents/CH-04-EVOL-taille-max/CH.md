# CH-04-EVOL — taille max par fichier

**Type :** `EVOL`
**Cible :** BC `documents`
**Qualification :** la SPEC n'a pas de plafond par fichier. Muette → EVOL.

## Pourquoi

Sans plafond dur, un produit peut envoyer un fichier qui casse le cluster. Le widget (10 Mo) n'est pas un contrat.

## Aujourd'hui

Pièce : le widget refuse à 10 Mo, le serveur accepte. Original : MinIO peut renvoyer 413, pas de règle documents. Pas de `R-*`.

## Attendu

Documents refuse un fichier **au-delà de 50 Mio**. Code `PAYLOAD_TOO_LARGE`. Pas de ligne, pas d'octets. Le produit peut être plus strict, jamais plus large.

## Critères d'acceptation (gelés)

- **AC-1** Un fichier ≤ 50 Mio se joint : la liste le montre. (`R-7`)
- **AC-2** Un fichier > 50 Mio en pièce : échec `PAYLOAD_TOO_LARGE`, pas de pièce, pas d'octets.
- **AC-3** Un fichier > 50 Mio en original : même refus, pas d'original.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `documents-taille-max-accepte` | tenant A, fichier petit | AC-1 |
| `documents-taille-max-refuse-piece` | tenant A, taille déclarée > 50 Mio | AC-2 |
| `documents-taille-max-refuse-original` | tenant A, taille déclarée > 50 Mio | AC-3 |

`POL-ERREUR-CODE`.

## Hors périmètre

Quota (somme tenant) → `CH-05` · widget 10 Mo (produit) · extraction 15 Mo · seaux · impression
