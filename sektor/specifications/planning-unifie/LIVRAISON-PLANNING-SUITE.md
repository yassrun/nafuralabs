# Suite du planning Sektor — 9 septembre 2026

Complète `LIVRAISON-UX-REELLE.md`. Périmètre : développement local, aucune publication en production.

## Comportements implémentés

### Dépendances, dates et chemin critique

Le bouton « Simuler les liaisons et le chemin critique » calcule le réseau complet du chantier sélectionné, indépendamment des filtres d'affichage. Il présente les dates actuelles et proposées, les marges en jours ouvrés et les activités critiques. Une case permet de les repérer en rouge sur le Gantt courant. Les barres gardent leurs dates enregistrées tant que les propositions ne sont pas appliquées.

Le moteur accepte FD, DD, FF et DF, les calendriers du chantier et les calendriers spécifiques, les jalons de durée nulle, les branches parallèles et les jours non travaillés. Les phases sont des regroupements et ne peuvent être extrémités de ces liaisons. Les cycles sont refusés.

Le calcul est à la journée : la fin d'une activité est incluse et une liaison FD reprend au prochain jour travaillé. Les débuts saisis constituent des dates au plus tôt. Il ne calcule pas les décalages horaires entre postes de nuit. Les activités ayant du réalisé sont refusées plutôt que déplacées ; le calcul du reste à faire est un complément distinct.

« Appliquer les dates proposées » requiert les droits de modification du planning. Le serveur recalcule et contrôle l'empreinte des données : une modification depuis l'aperçu entraîne un conflit et impose une nouvelle simulation. La transaction d'application est sérialisable. Aucune propagation silencieuse lors de la modification d'une liaison.

### Vues issues du même planning

- **Exécution** : Gantt, colonnes et liaisons affichables/masquables, calendrier et édition des activités.
- **Client** : jalons contractuels, avec cases pour inclure les jalons techniques et les activités d'exécution. Prévision courante, sans prétendre à un accord client.
- **Financier** : jalons financiers prévus, situations du chantier et échéances des factures liées à ces situations. Net TTC, encaissé et reste sont lus dans les pièces sources. Aucun total multidevise, aucune assimilation de l'échéance à un paiement effectif.
- **Ressources** : réservation d'heures par jour sur les activités, à partir des collaborateurs déjà affectés au chantier. Matrice de sept jours comparant réservations et capacité du calendrier chantier. Saisir zéro retire une réservation.

Les trois vues métier sont exportables en CSV, avec leur contexte et leurs limites. Le filtre de la vue client est repris dans l'export. Les cellules textuelles pouvant être interprétées comme des formules sont neutralisées.

Les réservations persistent dans `chantier_activites.planning_allocations`. Une réservation positive exige une affectation active couvrant toute la période de l'activité. Les surcharges sont indicatives et locales au chantier ; elles ne valent pas contrôle des absences RH, des engins ou des autres chantiers, ni approbation de la semaine.

## Vérification automatisée

52 tests backend réussis : calendrier et écriture (37), moteur réseau (6), service réseau (4), réservations (5). Couverture des quatre types de liaison, week-ends, marges d'une branche, cycles, aperçu sans écriture, application, empreinte obsolète, réalisé, droits, remplacement/retrait de réservation, affectation partielle, séparation des chantiers et surcharge.

Migration v1.13 ciblée appliquée via `nlops migrate` sur Docker Desktop staging. Elle ajoute seulement la colonne JSONB nullable ; les migrations d'autres chantiers de développement ne sont pas incluses.

Build Angular final réussi, avec l'avertissement préexistant RouterLink inutilisé dans AttachementListingPage. Catalogue complet (212 migrations) et image lifecycle restaurés après la migration ciblée. Preflight réussi ; backend local redémarré sur 8082.

## Vérification dans le navigateur

- CH-2026-015 : simulation du chantier, marge nulle du terrassement et repérage rouge vérifié dans le Gantt ; aucune largeur de page supérieure au viewport de 963 px.
- Liaison FD ajoutée entre les deux activités TEST UX : terrassement du 14 au 16 septembre, coulage proposé puis appliqué au 17 septembre. Réouverture de la fiche confirmant les dates enregistrées. Liaison retirée ensuite, coulage rétabli du 14 au 15 septembre ; contrôle en base confirmé.
- Vue client : inclusion des activités d'exécution, lecture des quatre activités et de leurs dates. Retour au Gantt après changement de vue fonctionnel.
- Vue financière : chargement sans erreur, états vides du chantier vérifiés. Le tenant QA ne possède pas de situation liée à une facture : un scénario financier renseigné n'a donc pas été vérifié dans le navigateur.
- CH-2026-004, chantier QA disposant d'une équipe : réservation de 10 h/j sur Coffrage R+1 pour QA Chef Chantier, affichage de 10 / 8 h et des alertes Surcharge. Bouton d'export CSV actionné. Réservation retirée par saisie de zéro ; tableau remis à zéro et liste persistée vide confirmée en base. Le contenu du fichier téléchargé n'a pas été contrôlé séparément.
- Retour au chantier initial CH-2026-015 après les vérifications. Aucune affectation d'équipe, facture ou approbation créée par ces tests.

## Compléments de la spécification cible

Les décisions A01–A03 et A05–A09 ne sont pas adoptées implicitement. Restent notamment : workflow hebdomadaire avec approbation, publication client/version contractuelle et preuve, charges RH interchantiers/absences et engins, décalages de liaison, reste à faire et ordonnancement intrajournalier, trésorerie exhaustive intégrant décaissements et devises. Ces fonctions ne sont pas présentées comme livrées par les nouvelles vues.

## Désencombrement visuel — 9 septembre 2026

Barre compacte : période, échelle, Aujourd’hui, Affichage, Ajouter. Le sélecteur de chantier, les vues enregistrées, le calendrier, les exports et les filtres secondaires sont repliés. Le menu Ajouter regroupe activité, jalon et phase. Les badges permanents sont remplacés par le nombre de lignes et les retards éventuels. Accès à la fiche chantier depuis les onglets.

Tout replier / Tout développer ajoutés. Les flèches ne déclenchent plus l’ouverture de la fiche ; les branches gardent leur état lors d’un changement d’échelle et d’un nouveau rendu pendant la visite.

Build Angular réussi. Vérification navigateur : repli global, conservation après passage à l’échelle Mois, développement global, repli individuel, ouverture/fermeture d’Affichage, accès au calendrier et aux trois choix Ajouter. Aucun changement de données métier. Le Gantt commence vers 320 px sur le viewport de vérification, avec une barre principale sur une seule ligne.

## Alignement sur les composants NF

La barre utilise maintenant nf-action-bar et les boutons NF. Simuler est accessible dans cette barre ; Actions regroupe calendrier, enregistrement de vue, PDF et plein écran. Ajouter utilise un menu Material accessible. Les colonnes passent par le véritable nf-listing-controls, avec son menu et son indicateur de colonnes masquées. Le bouton filtre ouvre les réglages complémentaires.

Extension compatible du composant partagé : showSearch vaut true par défaut ; le planning le désactive car ce contrôle ne propose pas de recherche. Les listings existants gardent leur recherche.

Build Angular réussi. Vérifications navigateur : menu NF des colonnes, masquage puis restauration de Fin dans le Gantt, accès au calendrier et au formulaire de sauvegarde depuis Actions. Aucune donnée métier modifiée.
