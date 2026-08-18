# CADRE — Nafura Platform

> Frontière de l'app. Une page. Lisible métier · IT · QA.
> Canon : [`PACT_BLUEPRINT.md`](../../PACT_BLUEPRINT.md) § Le CADRE.

## Intention

Fournir, à **plusieurs produits**, ce qu'aucun d'eux ne doit reconstruire : savoir qui est là, prévenir, commenter, conserver un fichier, lire un document, produire une page, faire décider une demande, converser avec un agent.

Cette app **chapeaute** des produits. Elle n'est le métier d'aucun.

## Périmètre

**owns**

- Savoir qui est là — personne, organisation, session
- Prévenir une personne
- Commenter un enregistrement
- Conserver un fichier
- Lire un document et en tirer une structure
- Produire une page ou un PDF à partir d'un modèle et de données
- Faire décider une demande — accepter ou refuser
- Converser avec un agent

**not_owns**

| Ce que cette app ne fait pas | Qui s'en charge |
|------------------------------|-----------------|
| Le métier d'un produit (devis, chantier, article, paie, …) | **l'app cliente** |
| Les modèles métier d'une page (facture, devis, …) | **l'app cliente** |
| Les rôles et droits métier d'un produit | **le socle de cette app cliente** |
| Voir et avancer le travail d'équipe (tickets, sprint) | **Raster** |
| Les sites vitrine et la marque | **corporate** / **MBS Studio** |

## Acteurs

| Acteur | Ce qu'il vient faire |
|--------|---------------------|
| **toi** | valider cette frontière, décider ce qui est vendable à part |
| **bâtisseur d'un produit** | brancher son app, consommer ce qui est owned ici |
| **administrateur d'un tenant** | membres, accès, réglages de cette app |
| **personne qui utilise un produit** | être prévenue, commenter, joindre un fichier, recevoir une page — via ce produit |

## Voisins

**Servies :** les produits (Sektor, et ceux à venir).

**Consommées : aucune.** Un prestataire d'hébergement n'est pas un voisin : le produit parle à cette app, pas à lui.

## Contraintes

Elles s'imposent à tous les contextes.

- **Isolation par tenant.** Ce qui est d'un tenant n'est pas visible d'un autre.
- **Le produit ne fait pas à notre place.** Il ne s'authentifie pas, ne conserve pas le fichier, n'envoie pas le courrier, n'imprime pas la page : il demande à cette app.
- **Plusieurs produits.** Un contexte de cette app n'existe pas pour un seul client.
- **Un besoin tient tout seul.** Il apporte de la valeur sans un autre besoin de cette app — seul le socle est permis.

## Vocabulaire

| Terme | Sens |
|-------|------|
| **Tenant** | organisation isolée qui utilise un produit |
| **Produit** | app cliente qui consomme cette platform |
| **Identité** | qui est la personne, dans quel tenant |
| **Notification** | un message à une personne |
| **Commentaire** | fil accroché à un enregistrement |
| **Document** | fichier conservé |
| **Extraction** | tirer une structure d'un document |
| **Impression** | page ou PDF produit à partir d'un modèle et de données |
| **Approbation** | demande à décider — accepter ou refuser |
| **Conversation** | échange avec un agent |
| **Socle** | ce qui est transverse à cette app, pas un produit |
| **Contexte** | un besoin owned ici qui tient tout seul |
| **Politique** | règle imposée à tous les contextes |

## Carte

<!-- généré — ne pas éditer -->

| Contexte | Rôle |
|----------|------|
| **socle** | tenant courant, erreurs, politiques — pas d'objets |
| **documents** | conserver un fichier |
| **document-extraction** | tirer une structure d'un document |
| **impression** | produire une page |
| **approbation** | faire décider une demande |

<!-- /généré -->
