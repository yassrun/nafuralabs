# Approvisionnements et disponibilités — 9 septembre 2026

## Parcours livré

Dans Planning → Ressources, deux commandes séparent « Équipes et semaine » et « Achats et livraisons ». Elles évitent d'empiler le suivi achats sous toute la préparation hebdomadaire.

Le suivi achats porte sur tous les besoins matière et matériel du chantier, triés par date de lancement. Un filtre permet de ne voir que les besoins à vérifier. Chaque ligne présente l'activité, le besoin, la quantité et l'unité, la date nécessaire et la date de lancement calculée en jours calendaires. L'activité reste accessible pour compléter le besoin et préparer sa demande en brouillon.

La demande, ses commandes et leurs réceptions sont lues dans les sources Achats du tenant et du chantier. Les états ne sont pas recopiés dans le besoin. Les commandes et réceptions sont repliées par défaut, les pièces accessibles par lien. Les réceptions annulées restent identifiées comme telles. Aucun prix, motif RH ou détail des autres chantiers n'est exposé dans ces projections.

Alertes : lancement dépassé sans demande prête, demande dont l'échéance diffère du besoin actuel, commandes annulées, commande en brouillon, date de livraison manquante ou postérieure au besoin, échéance dépassée sans état « livré ». Un lien introuvable est signalé explicitement ; il ne devient pas une absence de besoin. Modifier les dates de l'activité ne modifie jamais automatiquement une pièce Achats existante.

L'accès au suivi achats exige la lecture des commandes Achats et la lecture métier du chantier. Les mutations des demandes restent dans les parcours Achats existants et conservent leurs permissions.

## Disponibilités et validation

Pour les collaborateurs de l'équipe du chantier consulté, la grille additionne les réservations effectives de la semaine sur les autres chantiers du même tenant. Elle ne retourne ni leurs noms, ni leurs identifiants, ni leurs activités. Les affectations expirées et les jours non travaillés sont exclus. Un calendrier spécifique à l'activité est pris en compte.

Le repère journalier est le maximum des capacités des calendriers concernés ; ce n'est ni une durée légale, ni une preuve d'absence de chevauchement horaire. Dépasser ce repère déclenche une alerte, sans bloquer à lui seul la validation.

Les congés approuvés, en cours ou soldés sont lus sans leur type ni leur motif. Un congé portant un nombre entier positif de jours est traité sur sa période déclarée. Une réservation sur cette période constitue un conflit pour la validation hebdomadaire ; son apparition invalide le contenu précédemment validé, dont l'historique reste conservé. Les congés fractionnaires ou dont la durée est absente restent des alertes : la source ne donne pas les heures permettant de bloquer un créneau précis. Une panne de lecture des sources n'est pas transformée en disponibilité.

## Limites restantes

- Pas encore de rattachement des lignes de réception aux quantités d'un besoin précis. Une commande livrée ne vaut pas automatiquement besoin couvert.
- Les demandes d'équipe, la réservation des engins et les engagements de sous-traitance restent à compléter dans leurs parcours respectifs.
- La charge interchantiers reste une agrégation par date locale, sans arbitrage des trajets ni des horaires de nuit entre fuseaux.
- Les congés fractionnaires ne sont pas ventilés entre les jours de leur période.
- La publication client et le report guidé entre semaines restent des blocs distincts à réaliser.

## Vérifications

36 tests backend réussis : politique métier (10), cycle hebdomadaire (13), ressources (9) et lecture des approvisionnements (4). Ils couvrent notamment les requêtes scoping tenant/chantier, la non-exposition des activités externes, les affectations expirées, les congés partiels, l'invalidation d'une semaine par un congé approuvé et la conservation des états sources. Une affectation locale expirée n'ouvre pas l'accès aux congés ou à la charge externe de l'ancien collaborateur. Les repositories sont simulés ; ce n'est pas un test de charge concurrente.

10 scénarios front réussis sur les alertes d'approvisionnement : date du jour, retard, demande approuvée, divergence de dates, livraison tardive, commande livrée, annulation, source indisponible, réception partielle et demande rejetée avant sa date de lancement.

Aucune nouvelle migration SQL nécessaire pour ce lot : les informations proviennent des tables existantes.

La compilation a révélé deux versions Angular dans la même unité de compilation : Sektor 22.1.2 et la bibliothèque partagée 22.1.5. Les douze paquets Angular concernés dans Sektor ont été alignés et verrouillés sur 22.1.5, avec mise à jour du lockfile. L'installation a utilisé `--legacy-peer-deps` en raison des contraintes préexistantes de Storybook 8, qui déclarent Angular inférieur à 20 alors que le projet utilise déjà Angular 22. Storybook n'a pas été migré dans ce lot.

Les points d'entrée secondaires Angular 22 utilisent des exports de paquet plutôt que des sous-dossiers physiques. Les alias de `tsconfig.json` fixent leurs déclarations et leur code runtime sur la copie Sektor, ainsi que les bibliothèques d'icônes et de graphiques qui importent Angular. Cela évite le chargement d'un second injecteur depuis la bibliothèque partagée, à l'origine de l'erreur NG0203 observée à l'écran. Le contrôle `node scripts/check-angular-runtime.cjs` couvre HTTP, les signaux, Material, CDK, les animations, Lucide et les graphiques depuis le dossier de la bibliothèque partagée. La coque de l'application n'a finalement aucune modification.

Le build Angular développement avec statistiques a réussi. Le graphe complet du bundle confirme une seule entrée core et aucun module Angular provenant des node_modules de la bibliothèque partagée. Le seul avertissement de template restant concerne un import RouterLink préexistant dans AttachementListingPage.

## Recette dans l'application locale

- CH-2026-015 : le besoin existant de 12 m³ de granulats affiche un lancement au 7 septembre et un besoin au 12 septembre. L'alerte de lancement dépassé est visible, le filtre « À vérifier seulement » conserve cette ligne et le lien ouvre effectivement DA-2026-0023 en brouillon, avec la même date de besoin. Le rendu de l'écran a été inspecté visuellement. Aucune demande ni commande supplémentaire n'a été créée.
- CH-2026-004 : réservation temporaire de 4 h/j sur « Coffrage R+1 » pour QA Chef Chantier. La grille affiche 0 h avant le début de l'activité puis 4 h sur les jours travaillés.
- CH-2026-016 : le même collaborateur affiche 0 h ici et 4 h ailleurs, sans exposer l'identité de l'activité ou du chantier d'origine.
- La réservation temporaire a été retirée via la saisie de 0 h. La grille de CH-2026-004 et la liste des réservations rechargées confirment le retour à l'état initial.
- Les commandes et réceptions partielles/annulées ainsi que le blocage pour congé approuvé ont été testés automatiquement ; aucune approbation d'achat ou de congé réelle n'a été effectuée pour cette recette.

Backend et frontend locaux relancés avec succès. Le précontrôle nlops et les pods d'infrastructure Docker Desktop staging ont été vérifiés. Aucun déploiement en production.
