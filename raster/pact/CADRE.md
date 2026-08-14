# CADRE — Raster

> Frontière de l'app. Une page. Lisible métier · IT · QA.
> Canon : [`PACT_BLUEPRINT.md`](../../PACT_BLUEPRINT.md) § Le CADRE.

## Intention

Voir et faire avancer le travail — de la capture à l'archive — **à partir des fichiers Git**, sans base de données et sans authentification. Pour une équipe de deux, humains et agents mélangés.

## Périmètre

**owns**

- La capture d'une demande brute et sa promotion en task
- Le contrat des tickets : où ils vivent, ce qu'ils portent, comment ils s'enchaînent
- Les vues dérivées : INDEX, BACKLOG, SPRINT
- L'orchestration des mains entre agents

**not_owns**

| Ce que Raster ne fait pas | Qui s'en charge |
|---------------------------|-----------------|
| Décrire ce que fait un logiciel (SPEC, CADRE, CH, canvas) | **Pact** — `pact/` n'est jamais indexé |
| Le métier BTP, la paie, la compta | les projets **Sektor**, **compta**, … |
| Authentifier, gérer des utilisateurs, des droits | personne — hors intention |
| Estimer, mesurer une vélocité, tenir un kanban | personne — écarté volontairement |

## Acteurs

| Acteur | Ce qu'il vient faire |
|--------|---------------------|
| **toi** | capturer, valider le CADRE, trancher les questions bloquantes, poser `done-me` |
| **agent** | qualifier, spécifier, exécuter, vérifier |

## Voisins

**Aucun.** Pas de plateforme consommée, pas de service externe, pas d'IAM. Tout vient des fichiers du dépôt.

## Contraintes

Elles s'imposent à tous les BC.

- **Coût d'interaction** — capture < 5 s, lecture de l'INDEX < 2 s. Ce qui coûte plus n'est pas utilisé.
- **Le fichier est la source.** Toute vue est régénérable ; perdre les vues ne perd rien.
- **Pas de base, pas d'auth.** Un dépôt Git suffit à faire tourner Raster.
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
| **Regen** | recalculer les vues depuis les fichiers |

## Carte

<!-- généré — ne pas éditer -->

| Contexte | Rôle |
|----------|------|
| **socle** | chrome : nav, capture, détail, vues générées |
| **work** | contrat des tickets : arbre, types, statuts, sprint |

<!-- /généré -->
