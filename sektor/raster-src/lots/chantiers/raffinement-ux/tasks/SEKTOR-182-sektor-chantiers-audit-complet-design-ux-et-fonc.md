---
id: SEKTOR-182
status: done-agent
context: nafura
type: spec
agent_type: spec
priority: P0
assignee: agent
gate: me
tags: [sektor, ux]
---

# sektor chantiers : audit complet design, UX et fonctionnel du parcours live QA, avec anomalies priorisées et cible de raffinement

> Audit du module Chantiers réellement servi en Mode B QA le 25/08/2026.
> Le problème principal n'est pas cosmétique : l'écran mélange plusieurs modèles métier et affiche des faits faux.

## Étapes

- [x] Parcourir la liste, la fiche et ses huit onglets.
- [x] Parcourir les vues Planning, Avancements, Situations, Budget, Sous-traitance, Documents, Attachements et Journal.
- [x] Examiner la création, l'édition, l'affectation d'équipe et le rendu mobile.
- [x] Confronter les écrans au contrat produit Chantiers gelé le 23/08.
- [x] Relever les erreurs runtime et les violations d'accessibilité automatisées.

## Périmètre et limites

- Front : `http://127.0.0.1:4200`, auto-login `qa@nafuralabs.local`, tenant `qa-local`.
- API : `http://127.0.0.1:8082`.
- Jeu observé : trois chantiers, dont `CH-2026-001`.
- Viewports : bureau `1440×1000` et mobile `390×844`.
- Aucun enregistrement n'a été créé, modifié ou supprimé pendant l'audit.
- Le `ng serve` sert encore un bundle utilisable, mais sa dernière recompilation échoue sur `submit-approval-button.component.ts`. Les constats décrivent donc le bundle effectivement visible, qui peut être en retard sur le dernier source.

## Verdict

Le module n'est pas encore un espace de conduite de chantier cohérent. C'est un assemblage de :

- fiche administrative ;
- ancien modèle `Phases` ;
- nouveau planning par activités ;
- agrégats financiers venant de sources différentes ;
- écrans globaux qui perdent le contexte du chantier.

Le chantier paraît « rempli », mais il ment sur son statut, ses dates et son budget. Le parcours mensuel essentiel — quantité réalisée → attachement → situation — n'est pas lisible depuis la fiche. Il faut d'abord restaurer une seule vérité métier et une seule navigation avant tout polish visuel.

## Anomalies P0 — bloquantes ou trompeuses

### UX-FONC-01 — `EN_PREPARATION` est affiché « Prospect »

**Où :** liste, hero, édition de `CH-2026-001`.

**Constat :** l'API renvoie `status: EN_PREPARATION`; l'UI le transforme en `PROSPECT`. Un chantier déjà créé depuis une étude gagnée redevient donc visuellement un prospect.

**Impact :** le conducteur ne sait pas si le chantier est gagné, en préparation ou encore commercial. Les filtres et décisions opérationnelles sont faux.

**Cause confirmée :** `mapBackendStatusToUi()` mappe explicitement `EN_PREPARATION` vers `PROSPECT`.

**Cible :** exposer `EN_PREPARATION` comme statut de premier rang, libellé « En préparation ». Le passage à `EN_COURS` doit venir de l'ordre de service.

### UX-FONC-02 — trois montants incompatibles pour le même chantier

**Où :** liste, hero/budget, onglet Lots.

**Constat observé sur `CH-2026-001` :**

- liste : `500 K MAD` ;
- hero et synthèse : `582 600 MAD` ;
- total de l'arbre vendu : `737 106 MAD`.

Les trois valeurs sont présentées comme « Budget HT », « Budget révisé » ou « Total marché HT », sans expliquer leur relation.

**Impact :** aucune décision de marge, d'engagement ou de facturation n'est fiable. C'est une anomalie argent, pas un problème de mise en page.

**Cible :** nommer et séparer les faits : vente HT, déboursé prévu, budget révisé, engagé, réalisé, marge. Tous doivent dériver de l'arbre canonique et se réconcilier.

### UX-FONC-03 — des dates contractuelles inexistantes sont fabriquées

**Où :** liste et vue d'ensemble.

**Constat :** l'API renvoie `dateFinPrevue: null` et aucun ordre de service. L'UI affiche pourtant :

- fin prévue = date de début (`01/09/2026`) ;
- ordre de service = date de début (`01/09/2026`).

**Cause confirmée :** le mapper remplace une fin absente par `dateDebut`; la fiche remplace un OS absent par `dateDebut`.

**Impact :** le produit invente une échéance et un acte contractuel. Un OS ne peut jamais être déduit d'une date de démarrage.

**Cible :** afficher « Non défini » et une action adaptée. Ne jamais substituer un fait contractuel.

### UX-FONC-04 — la situation est bloquée tant qu'un marché n'existe pas

**Où :** fiche → Situations.

**Constat :** l'écran dit « créez le marché pour générer les situations » et ne propose que `Créer le marché`.

**Impact :** un chantier sur devis, bon de commande ou régie ne peut pas suivre le flux normal. Cela contredit le gel produit : sans marché, le devis validé fait foi et le palier 1 doit être facturable le jour même.

**Cible :** permettre attachement et situation depuis la référence de vente active : devis validé avant notification, marché après notification. La création du marché reste un acte séparé.

### UX-FONC-05 — deux plannings concurrents restent exposés

**Où :** fiche → `Phases` et vue globale → `Planning`.

**Constat :**

- l'onglet `Phases` propose encore ajout, import PDF et scan IA ;
- le nouveau Planning gère des activités, une WBS et un Gantt ;
- la fiche affiche les deux comme des concepts valides.

**Impact :** l'utilisateur ne sait pas où planifier. Les données peuvent diverger et l'ancien modèle continue d'être alimenté.

**Cible :** supprimer `Phases` de la fiche et de la création. Le planning optionnel doit être uniquement celui des activités. Au palier 1, il ne doit ajouter aucun champ obligatoire.

### UX-DESIGN-06 — le mobile masque les actions principales

**Où :** liste, fiche, lots, équipe, avancements, attachement.

**Constat à `390 px` :** des contrôles restent positionnés jusqu'à `522 px` alors que la page coupe le débordement horizontal. `Nouveau chantier`, les filtres, `Saisir avancement` et des champs d'attachement deviennent partiellement ou totalement inaccessibles.

**Impact :** le produit est inutilisable sur téléphone alors que la saisie terrain est une contrainte produit explicite.

**Cible :** véritable composition mobile : cartes à la place des tables, actions principales pleine largeur, filtres en drawer, onglets scrollables avec affordance, champs sur une colonne et barre d'action collante.

## Anomalies P1 — parcours cassé ou très coûteux

### UX-07 — la fiche n'expose pas la chaîne opérationnelle essentielle

La navigation locale propose `Lots`, `Phases`, `Budget`, `Situations`, `Documents`, `Photos`, mais pas `Avancement`, `Attachements` ni `Journal`. Ces fonctions vivent dans la sidebar globale et font perdre le chantier courant.

**Cible :** depuis un chantier, rendre visible le chemin `Arbre → Avancement → Attachements → Situations`. Les vues globales restent utiles pour le portefeuille, pas comme seul accès.

### UX-08 — la fiche duplique le code et le nom

Le header et le hero répètent immédiatement `CH-2026-001` et le nom. Le hero ajoute encore une ligne `CH-2026-001 ·` vide de ville.

**Impact :** beaucoup de hauteur consommée avant la première information utile.

**Cible :** un seul en-tête compact : code, nom, statut réel, client et prochaine action.

### UX-FONC-09 — l'affectation d'équipe est une impasse

Après `Ajouter`, le sélecteur Employé ne contient que `—`. Aucun message n'explique qu'aucun employé n'est disponible ni comment en créer/importer un. Le bouton de sauvegarde reste visible.

**Cible :** état bloqué explicite avec lien vers RH, ou recherche serveur qui retourne les employés affectables. Désactiver Enregistrer tant que la sélection est vide.

### UX-10 — création en cinq étapes contraire au « zéro paramétrage »

La création manuelle impose un assistant long et préremplit statut, dates et budget. Le premier écran affiche `En cours`, mais le code force finalement `PROSPECT` à la soumission.

**Impact :** l'utilisateur voit un choix qui ne sera pas respecté. Ville, fin prévue et budget sont exigés avant de pouvoir ouvrir le chantier, alors que le palier 1 doit démarrer simplement.

**Cible :** création courte : identité minimale + référence de vente éventuelle. Le chantier naît `En préparation`; les informations non connues restent absentes et sont complétées progressivement.

### UX-FONC-11 — l'édition autorise des incohérences structurantes

- code chantier éditable comme un texte ordinaire ;
- client affiché comme ` — Client Walk…` dans un champ texte ;
- référence marché éditable alors qu'aucun marché n'existe ;
- statut modifiable librement, sans geste métier ni garde ;
- ville obligatoire avec une liste de plus de cent options.

**Cible :** identifiants stables en lecture seule, lookups serveur pour les FK, transitions de statut par actions métier, création/notification du marché dans son propre flux.

### UX-12 — les écrans globaux perdent le contexte

Budget, situations, documents, sous-traitance, attachements et journal sont des listings multi-chantiers. Depuis la fiche, certains liens filtrent, mais la sidebar ouvre les vues sans chantier sélectionné.

**Cible :** conserver un filtre chantier visible et réversible quand on vient de la fiche; afficher le nom/code dans le titre.

### UX-13 — le vocabulaire mélange chantier, marché et commercial

Exemples :

- `Prospect` sur un chantier gagné ;
- `Total marché HT` dans l'arbre alors qu'aucun marché n'existe ;
- référence `Marché MA-WALK…` alors que l'API ne contient pas de marché lié ;
- `Journal quotidien des travaux exécutés` pour les carnets d'attachement, en concurrence avec `Journal de chantier`.

**Cible :** appliquer le vocabulaire gelé : chantier, devis de référence, marché notifié, avancement, attachement contradictoire, situation cumulative, journal quotidien.

### UX-14 — les actions d'arbre sont opaques

Dans Lots, les actions sont `↗`, `✎`, `🗑` sans libellé visible; axe détecte au moins un bouton sans nom accessible. `Ajouter un lot`, `Ajouter un sous-lot` et `Ajouter un poste` sont au même niveau sans indiquer le parent sélectionné.

**Cible :** menu contextuel par nœud, libellés explicites, action « Ajouter sous… », nature Vendu/Interne expliquée, suppression protégée par ses conséquences.

### UX-15 — le tutoriel masque la liste et décrit déjà un modèle obsolète

Le tour `Module Chantiers` s'ouvre sur la liste, ajoute une couche visuelle et annonce « Lots / Phases / Budget / Situations / Documents ». Il consacre donc `Phases` alors que ce modèle doit disparaître.

**Cible :** retirer ce tour jusqu'au raffinement, ou le remplacer par une aide contextuelle courte centrée sur le flux réel.

## Anomalies P2 — qualité, cohérence et accessibilité

### UX-16 — traductions brutes visibles

- équipe : `common.cancel`, `common.save` ;
- édition : `chantiers.status.termine`, `chantiers.status.receptionne`, `chantiers.status.cloture`, `chantiers.status.annule`.

### UX-17 — icônes manquantes ou rendues comme du texte

Erreurs runtime pour les icônes `event` et `camera`. Des libellés techniques apparaissent dans les pages : `construction`, `event`, `activity`, `scan-line`; le centre documentaire utilise aussi l'emoji `📂`.

### UX-18 — erreurs i18n globales à chaque page

Le compilateur MessageFormat échoue sur les traductions FR et EN contenant `${tenant.logo}`. Toutes les routes auditées polluent la console.

### UX-19 — défauts d'accessibilité automatisés

Constats axe-core :

- select de statut sans nom accessible sur la liste — critique ;
- bouton sans nom dans Lots — critique ;
- progressbars sans nom — sérieux ;
- contrastes insuffisants sur tutoriel, CTA et badges `Vendu` — sérieux ;
- sauts de niveaux de titres et contenus hors landmarks — modérés.

### UX-20 — filtres et actions dupliqués

Avancements affiche deux fois `Réinitialiser` et deux fois `Saisir avancement`. Situations affiche `Nouveau` puis `Nouvelle situation`. Les empty states répètent parfois le CTA déjà présent dans le header.

### UX-21 — densité et hiérarchie visuelle faibles

Les tables affichent beaucoup de colonnes vides ou `—`, de petits badges et des actions serrées. Sur la fiche, les huit onglets ont le même poids alors que les usages sont très inégaux. Les actions principales sont rejetées tout en bas (`Retour`, `Modifier`) au lieu d'accompagner le contexte.

### UX-22 — états vides peu actionnables

`Aucun contrat correspondant`, `Aucun événement`, `Aucun attachement` n'expliquent ni prérequis ni prochaine étape métier. Le cas Équipe est particulièrement bloquant car aucune ressource n'est sélectionnable.

## Ce qui fonctionne dans le parcours observé

- Les treize routes auditées répondent et l'auto-login QA fonctionne.
- Les onglets de fiche conservent leur état dans `?tab=`.
- Le bouton Planning depuis une fiche transmet bien le chantier en query param.
- Le nouveau Gantt affiche les activités et distingue le chantier des activités.
- Les écrans ont globalement un titre, des états vides et une action principale.
- Aucune réponse HTTP 4xx/5xx n'a été relevée pendant le simple parcours en lecture.

## Cible de raffinement recommandée

### 1. Une seule fiche chantier

En-tête compact :

- code + nom ;
- statut réel ;
- client / référence de vente active ;
- avancement en quantité et pourcentage dérivé ;
- prochaine action métier.

Navigation locale :

1. Vue d'ensemble
2. Arbre
3. Avancement
4. Attachements
5. Situations
6. Budget et marge
7. Équipe
8. Journal
9. Documents et photos

Le Planning est un mode optionnel activable, jamais un passage obligé. `Phases` disparaît.

### 2. Une seule vérité par fait

- statut : `EN_PREPARATION` reste `En préparation`;
- vente : devis ou marché selon notification;
- budget : arbre décomposé;
- fin prévue : absente tant qu'elle n'est pas connue;
- OS : événement contractuel explicite;
- avancement : quantité faite, pourcentage calculé.

### 3. Un parcours terrain direct

Sur mobile, la page d'accueil d'un chantier doit permettre en trois gestes :

1. choisir un nœud ou une activité;
2. saisir quantité + date;
3. joindre éventuellement une photo.

L'attachement lit ensuite la période; la situation lit les attachements validés.

### 4. Un portefeuille séparé

Les vues globales Budget, Situations, Sous-traitance et Documents restent dans le pilotage, avec drill-down. Elles ne remplacent pas les parcours contextualisés de la fiche.

## Ordre de correction

1. Corriger les mensonges de données : statut, dates, OS et montants.
2. Débloquer situation sans marché et rendre visible la chaîne du palier 1.
3. Supprimer `Phases` et unifier sur activités.
4. Recomposer la fiche et la navigation contextualisée.
5. Refaire les surfaces terrain en mobile-first.
6. Corriger traductions, icônes, noms accessibles et contrastes.
7. Retirer ou réécrire le tutoriel.

## Preuves exécutées

- Parcours Playwright headless Edge des 13 routes Chantiers.
- Clic réel des 8 onglets de `CH-2026-001`.
- Ouverture du formulaire d'affectation Équipe.
- Inspection création et édition sans soumission.
- Comparaison API `/api/v1/chantiers` avec la liste et la fiche.
- Mesure d'overflow à `390×844`.
- axe-core sur liste, fiche, lots, planning et nouvel attachement.
- Lecture des erreurs console et du terminal `ng serve`.

## Journal

```
25/08 13:08  posée
25/08 13:16  audit live QA terminé · 22 anomalies priorisées
25/08 13:09  status → doing
25/08 13:10  status → done-agent
```

## Rapport de livraison

Audit livré dans cette Task.

Preuves : parcours navigateur, API, responsive et axe-core.

Décidé seul : hiérarchie P0/P1/P2 et proposition de navigation cible, toutes dérivées des gels produit existants.

Écart : aucun test destructif des créations/sauvegardes; le bundle servi peut être antérieur au dernier source car la recompilation Angular échoue actuellement.