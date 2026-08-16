# CADRE — Raster

> Frontière de l'app. Une page. Lisible métier · IT · QA.
> Canon : [`PACT_BLUEPRINT.md`](../../PACT_BLUEPRINT.md) § Le CADRE.

## Intention

Voir et faire avancer le travail — de la capture à l'archive — **à partir des fichiers Git**. Tu ouvres une fenêtre ; des agents la déroulent en parallèle, sans toi, et s'arrêtent au bout. Pour une équipe de deux, humains et agents mélangés.

## Périmètre

**owns**

- La capture d'une demande brute et sa promotion en task
- Le contrat des tickets : où ils vivent, ce qu'ils portent, comment ils s'enchaînent
- Les vues dérivées : INDEX, BACKLOG, SPRINT
- L'orchestration des mains entre agents, **y compris plusieurs en parallèle**
- La **borne** : jusqu'où ils avancent sans toi, et où ils s'arrêtent

**not_owns**

| Ce que Raster ne fait pas | Qui s'en charge |
|---------------------------|-----------------|
| Décrire ce que fait un logiciel (SPEC, CADRE, CH, canvas) | **Pact** — `pact/` n'est jamais indexé |
| Le métier BTP, la paie, la compta | les projets **Sektor**, **compta**, … |
| Authentifier, gérer des utilisateurs, des droits | personne — hors intention |
| Estimer, mesurer une vélocité, tenir un kanban | personne — écarté volontairement |
| Fournir le modèle, les clés, le bac à sable où l'agent s'exécute | l'**environnement local** — Raster refuse de les stocker |
| Juger la qualité de ce qu'un agent a produit | l'agent **qa**, puis toi au rapport |

## Acteurs

| Acteur | Ce qu'il vient faire |
|--------|---------------------|
| **toi** | capturer, **déplacer la borne**, valider le CADRE, trancher les questions bloquantes, approuver |
| **orchestrateur** | ouvrir les lots de la fenêtre, lancer les agents, collecter les rapports, s'arrêter à la borne |
| **agent** | qualifier, spécifier, exécuter, vérifier |

## Voisins

**Aucun.** Pas de plateforme consommée, pas de service externe, pas d'IAM. Tout vient des fichiers du dépôt.

## Contraintes

Elles s'imposent à tous les BC.

- **Coût d'interaction** — capture < 5 s, lecture de l'INDEX < 2 s. Ce qui coûte plus n'est pas utilisé.
- **Le fichier est la source.** Toute vue est régénérable ; perdre les vues ne perd rien.
- **Le dépôt suffit à lire, pas à exécuter.** Aucune base, aucun compte : tout l'état vient des fichiers. Mais lancer un agent demande deux choses que Git ne porte pas — un **processus** et une **clé de modèle**. Elles vivent hors du dépôt ; Raster refuse de démarrer un agent plutôt que de les stocker.
- **Aucun agent ne dépasse la borne.** Il enchaîne les lots ouverts sans rien demander ; arrivé à la borne il s'arrête et te rend la main. Trois choses seulement l'interrompent avant : une gate, une question indécidable, un blocage externe.
- **Raster tient sans Pact.** Un projet non logiciel (compta, perso) doit pouvoir l'utiliser entièrement.

## Vocabulaire

| Terme | Sens |
|-------|------|
| **Lot** | chapeau vivant — un dossier, jamais `done` |
| **Sous-lot** | groupe de tasks — un dossier ; branché Pact, c'est un **CH** |
| **Task** | seule unité sprintable — le seul fichier ticket |
| **Inbox** | capture brute, une ligne = une demande non qualifiée |
| **Promote** | qualifier une ligne d'inbox et la rattacher à un lot |
| **Backlog** | tout le travail non engagé |
| **Sprint** | la semaine ISO à laquelle une task est engagée |
| **Roadmap** | l'ordre des lots — écrit à la main, il porte aussi ce qui n'existe pas encore |
| **Borne** | la limite de la roadmap au-delà de laquelle aucun agent n'avance ; la déplacer, c'est planifier |
| **Readiness** | calculé : un sous-lot est lançable quand rien d'ouvert ne le retient |
| **Rapport de livraison** | ce qu'un agent te doit en rendant la main — dont ce qu'il a décidé seul |
| **Regen** | recalculer les vues depuis les fichiers |

## Carte

<!-- généré — ne pas éditer -->

| Contexte | Rôle |
|----------|------|
| **socle** | chrome : nav, capture, détail, vues générées |
| **work** | contrat des tickets : arbre, types, statuts, sprint |

<!-- /généré -->
