# BC conversation — échanger avec un agent

> Ce qui est **vrai maintenant**. Pas de futur ici.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md). CADRE : [`../../CADRE.md`](../../CADRE.md).

## Intention

Porter l'**échange avec un agent** pour un produit. Cette app tient la session et le tour ; le produit pose la question dans son métier. Elle n'appelle pas le modèle, n'extrait pas, ne fait pas décider une demande.

## Ce que ça fait

- Ouvre une **session** pour la personne courante dans le tenant courant, attachée à un produit
- Reçoit un message, rend un **tour** : intention (lire / naviguer / agir), blocs, liens
- Si l'intention est d'agir : propose des **actions** ; la personne approuve, refuse, ou exécute
- Liste les sessions de la personne courante dans le tenant courant ; rend l'historique des **messages**
- Un tour en lecture peut interroger en SELECT ; le tenant est injecté ; pas d'écriture par cette voie

## Limites

**owns** — session, message, tour (intention, blocs, liens), run, action proposée (approuver / refuser / exécuter)

**Coupe des jars.** Entrent : `ai-conversation`, `ai-agent-api`, `ai-agent-runtime`. `llm-provider` n'entre pas.

**not_owns**

| Ce que conversation ne fait pas | Qui s'en charge |
|---------------------------------|-----------------|
| Appeler un modèle de langage (`llm-provider`) | **socle** |
| Clés et prestataire vivant du modèle | **ops** |
| Le métier d'un produit (devis, chantier, article, paie, …) | **le produit** |
| Faire décider une demande (accepter / refuser un enregistrement) | **approbation** (non spécifié) |
| Conserver un fichier | **documents** |
| Tirer une structure d'un document | **document-extraction** |
| Commenter | **commentaire** (non spécifié) |
| Prévenir | **notification** (non spécifié) |
| Savoir qui est là | **identité** (non spécifié) ; tenant courant → **socle** |
| Chrome du shell produit (panneau, bouton) | **socle** |

## Intervenants

- **bâtisseur d'un produit** — branche l'échange, reçoit session et tour
- **personne qui utilise un produit** — parle à l'agent via ce produit
- **administrateur d'un tenant** — mêmes actions dans son tenant

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Session** | produit + personne + tenant + titre | portée **personne courante** dans le **tenant courant** ; créée active |
| **Message** | rôle (`USER` \| `ASSISTANT` \| `SYSTEM` \| `TOOL`) + contenu | appartient à une session ; tokens et coût éventuels |
| **Tour** | intention `READ` \| `NAVIGATE` \| `ACTION` + blocs + liens | un tour d'une session de la personne courante |
| **Run** | exécution d'un tour qui agit | accroché à la session ; même tenant, même personne |
| **Action** | outil + arguments opaques + statut | proposée sur un run ; approuver / refuser / exécuter dans la même portée |

Les noms de tables vus en lecture sont **opaques** (découverts, pas un catalogue de cette app). `CHANTIER` est un mot du produit.

## États

**Session** — créée `ACTIVE`.

**Action**

```
proposée | en attente d'approbation → approuvée | refusée
approuvée | proposée (sans approbation requise) → exécutée | échouée
```

Refusée ou exécutée : plus de changement.

**Run**

```
proposé | en attente d'approbation | terminé | échoué
```

## Règles

- **INV-1** Cette app ne connaît aucun objet métier d'un produit. Pas de type `FACTURE`, `CHANTIER`, `DpgfNoeud`.
- **INV-2** Session, message, run et action portent le tenant (`POL-TENANT-ISOLATION`).
- **R-1** Lister et lire une session : seulement la personne courante dans le tenant courant. Un id inconnu : pas trouvé (404). Une session de la personne courante chez un autre tenant : interdit (403) — pas la même erreur.
- **R-2** Tenant B ne liste pas les sessions de A. Lire / tour / actions de A depuis B échoue.
- **R-3** Une session nouvelle n'a pas de message. Elle n'a pas d'action tant qu'aucun tour n'en a proposé.
- **R-4** Agir : proposer, puis approuver ou refuser, puis exécuter si approuvée (ou proposée sans approbation requise).
- **R-5** La voie SELECT n'écrit pas. Le filtre tenant est injecté ; la personne ne le choisit pas.

Soumis à `POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT`.

## Liens

- **publie** session, messages, tour (intention, blocs, liens) et actions au produit
- **consomme** socle (tenant courant, erreurs) et appeler un modèle (`llm-provider`, socle)
- Canvas : aucun — pas d'écran dans cet INIT
