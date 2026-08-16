# CH-07-EVOL — unifier pièce et original

**Type :** `EVOL`
**Cible :** BC `documents`
**Qualification :** la SPEC photographie deux formes et le dit. Muette sur l'objet unique → EVOL.

## Pourquoi

Même octets, deux tas : l'usage ment, le quota (après `CH-05`) compte deux fois, le seau (`CH-06`) n'y change rien. Un fichier est un fichier.

## Aujourd'hui

Pièce : ligne + REST + `entité` + `id`, retrait dur. Original : autre ligne, service interne (extraction, produit qui garde l'id), retrait marqué. Dedup **chacun de son côté**. Usage = somme des deux côtés.

## Attendu

Un **fichier** (octets, empreinte, clé, nom, type, taille). Deux façons de le pointer :

- **pièce** — accroché à `entité` + `id` (REST inchangé)
- **tenu** — le produit / l'extraction garde l'id du fichier (`DocumentService` reste le dépôt sans accroche)

Dans un tenant, une empreinte = **un** objet, peu importe comment on a déposé. L'usage compte une fois. La dernière référence (pièce ou tenu) enlevée, les octets partent. Un autre tenant re-stocke.

Pas une API unique. Pas un écran.

## Critères d'acceptation (gelés)

- **AC-1** A dépose en tenu, puis joint les mêmes octets en pièce : un objet, usage = N.
- **AC-2** A joint en pièce, puis dépose les mêmes octets en tenu : un objet, usage = N.
- **AC-3** B dépose les mêmes octets : un objet à lui. L'usage de A inchangé.
- **AC-4** Retirer la pièce, le tenu reste : le tenu se télécharge, usage = N. Retirer le tenu ensuite : plus d'octets, usage = 0.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `documents-tenu-puis-piece` | tenant A, un fichier, tenu puis pièce | AC-1 |
| `documents-piece-puis-tenu` | tenant A, un fichier, pièce puis tenu | AC-2 |
| `documents-unifier-deux-tenants` | mêmes octets, A puis B | AC-3 |
| `documents-unifier-derniere-reference` | A, pièce + tenu, même empreinte, puis retraits | AC-4 |

`POL-TENANT-ISOLATION` · `POL-PAS-METIER-PRODUIT`. Après `CH-06`.

## Hors périmètre

Fusionner les HTTP · changer l'API extraction / Sektor · widget · templates / PDF · `archivé` sans transition · seau par produit
