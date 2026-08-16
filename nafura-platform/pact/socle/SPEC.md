# Socle — Nafura Platform

> Contexte transverse. Pas d'objets métier, pas de transitions.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md) § Le socle.

## Intention

Porter ce que **tous** les contextes de cette app doivent respecter : le tenant courant, l'isolation, le format d'erreur. Il n'authentifie pas un produit métier et ne lit pas un fichier.

## Capacités

Chaque capacité nomme au moins un BC consommateur. Sans consommateur, elle se supprime.

| Capacité | Mode | Consommée par |
|----------|------|---------------|
| **Tenant courant** — quel tenant est en train d'agir | `LOCAL` | document-extraction, documents, impression |
| **Erreurs** — une erreur a un code et un message lisible | `LOCAL` | document-extraction, documents, impression |

## Contrats de consommation

- **Tenant courant** — un contexte lit l'identifiant de tenant ; il ne le choisit pas. Il ne voit pas un autre tenant.
- **Erreurs** — un contexte échoue avec un code stable ; il n'invente pas un canal d'erreur parallèle.

## Politiques imposées

| ID | Règle |
|----|-------|
| `POL-TENANT-ISOLATION` | Ce qui est d'un tenant n'est pas visible d'un autre. Un cache, un plan, un fichier lu : la clé porte le tenant. |
| `POL-ERREUR-CODE` | Une erreur exposée a un code. Pas un texte seul. |
| `POL-PAS-METIER-PRODUIT` | Aucune capacité du socle n'énonce un devis, un chantier, un article, une paie. |

Un BC **référence** ces IDs, il n'en recopie pas le texte. Conflit politique ↔ règle BC → la politique.

**Exceptions déclarées :** aucune.

## Catalogue de rôles

Rôles de **cette** app, pas d'un produit cliente.

| Rôle | Sens |
|------|------|
| **admin-tenant** | administrateur d'un tenant — membres, accès, réglages |
| **utilisateur** | personne qui agit dans un tenant via un produit |

Pas de rôle `estimeur`, `conducteur`, ni aucun rôle métier d'un produit.

## Matrice

| Action | BC | allow | deny |
|--------|-----|-------|------|
| `P-EXTRACTION-LANCER` | document-extraction | admin-tenant, utilisateur | — |
| `P-EXTRACTION-REVOIR` | document-extraction | admin-tenant, utilisateur | — |
| `P-DOCUMENT-JOINDRE` | documents | admin-tenant, utilisateur | — |
| `P-DOCUMENT-LIRE` | documents | admin-tenant, utilisateur | — |
| `P-DOCUMENT-RETIRER` | documents | admin-tenant, utilisateur | — |
| `P-DOCUMENT-MESURER` | documents | admin-tenant, utilisateur | — |
| `P-IMPRESSION-RENDRE` | impression | admin-tenant, utilisateur | — |
| `P-IMPRESSION-MODELE-LIRE` | impression | admin-tenant, utilisateur | — |

Le BC écrit « la transition exige `P-…` ». Il ne redéfinit pas les rôles.

## Liens

- **publie** les politiques et le tenant courant aux contextes de cette app
- **consomme** aucun voisin (CADRE : aucune app consommée)
- Canvas : aucun — pas d'écran socle dans ce Change
