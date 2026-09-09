# Essai du planning réel — CH-2026-015

Essai réalisé le 8 septembre 2026, dans le navigateur, sur la page fournie par l'utilisateur :

http://localhost:4200/chantiers/planning?chantier=2f571bfd-cba6-4f3b-b744-f854510a298c

Session affichée : QA Owner / QA Local · Siège. Chantier affiché : CH-2026-015 — Chantier blocage mta6cyqm. Ce rapport porte sur l'interface réellement testée ; il ne décrit pas la maquette et ne conclut pas à l'absence d'API derrière les contrôles manquants.

## Parcours et écritures effectuées

1. Ouverture de la page : état transitoire « Enregistrement introuvable », 0 chantier, actions désactivées ; le chantier et ses trois lignes apparaissent ensuite. Ce n'était donc pas un chantier réellement introuvable.
2. Nouvelle activité : saisie `TEST UX — Terrassement zone A`, nature Travaux, début 14/09/2026, durée 24 h, sous la phase existante `terrassement`.
3. Enregistrement réussi : le tableau passe de 3 à 4 lignes ; l'activité apparaît du 14 au 16 septembre, avec 24 h. Les dates de la phase parent deviennent également 14–16 septembre. La période affichée passe de « Ce trimestre » à « Tout » sans intervention dans ce filtre pendant la création.
4. Inspection du détail après sauvegarde : sections Travaux liés et Avancement ajoutées dans le même panneau ; pas de commande de dépendance ni de calendrier spécifique visible dans ce parcours.
5. Ouverture du calendrier chantier : tableau fixe 08:00–16:00 du lundi au vendredi, samedi/dimanche vides. Aucun champ de saisie ; actions Annuler et Enregistrer 8 h lun–ven. Fermeture par Annuler, sans changement de calendrier.
6. Clic sur Enregistrer la vue : aucune boîte de nommage ni commande de personnalisation visible après le clic ; aucune boîte de dialogue JavaScript active. Cela ne permet pas de conclure si une préférence a été écrite silencieusement.

**Une activité de test est conservée dans ce chantier.** Aucune déclaration d'avancement, aucun rattachement budgétaire et aucun changement de calendrier n'ont été effectués. Aucun élément préexistant n'a été supprimé. L'ajout sous la phase existante a entraîné la modification de ses dates dérivées.

## Constats vérifiés et corrections prioritaires

| Priorité | Constat observé | Conséquence | Correction attendue |
|---|---|---|---|
| P1 | Calendrier présenté sans champs modifiables et sauvegarde limitée à « 8 h lun–ven ». | Impossible de programmer une nuit, un week-end ou une exception depuis cet écran. | Éditeur jours/créneaux/shifts/exceptions + aperçu d'impact ; calendrier spécifique dans l'activité. |
| P1 | Création et édition observées sans choix de prédécesseur/type/décalage. | On crée des lignes datées mais on ne construit pas leur enchaînement logique dans ce parcours. | Rubrique Prédécesseurs et successeurs, liens typés, contrôle de cycles et simulation. |
| P1 | Date de fin résultante absente du formulaire ; elle n'est visible qu'après sauvegarde dans le tableau derrière le panneau. | Impossible de vérifier immédiatement la période que l'on prépare. | Début + durée avec unité jours/heures + fin calculée en direct + calendrier utilisé. |
| P1 | Aucune commande Affichage ou Chemin critique dans l'espace testé. | Impossible de choisir les colonnes, dégager la chronologie ou analyser la chaîne critique par l'interface observée. | Panneau Affichage ; criticité et marges seulement avec calcul disponible, sinon état explicite. |
| P2 | La sauvegarde laisse un panneau dense ouvert, désormais enrichi de rattachements et d'avancement. | Le parcours de construction du planning se mélange à celui du suivi d'exécution. | Résumé de création ; Ajouter la suivante ; rubriques secondaires repliées ; suivi séparé. |
| P2 | À la largeur du navigateur observée (environ 1280 px), la barre d'actions occupe plusieurs lignes et le tableau laisse peu de place au Gantt. | Intitulés tronqués et faible visibilité des barres et de leurs relations. | Largeurs ajustables, colonnes choisies, commandes regroupées, priorité à la zone de travail. |
| P2 | Enregistrer la vue ne présente ni nommage ni sélecteur de vues dans le parcours observé. | Résultat de l'action difficile à comprendre ; aucune personnalisation accessible. | Choix visibles, nom, confirmation et restitution de la vue sauvegardée. |
| P2 | Libellés « Forme — jamais un jalon d'un jour », « même drawer », « Lots hors Gantt — ils restent dans l'arbre », « Sous ». | Des notes de conception/implémentation remplacent le vocabulaire du métier. | Type d'élément ; Phase parente ; rattachement au bordereau ; aides orientées tâches. |
| P2 | État initial transitoire « Enregistrement introuvable » puis chargement réussi. | L'utilisateur peut croire à une erreur ou à une perte du chantier. | État de chargement distinct d'un vrai refus/404. |

## Parcours cible à prioriser

Créer une phase → ajouter plusieurs activités à la suite → saisir début/durée/fin calculée → définir les dépendances → choisir le calendrier → vérifier le réseau et les alertes → enregistrer la révision.

La préparation du bordereau, les quantités réalisées et les déclarations d'avancement restent accessibles, mais ne doivent pas interrompre ce parcours.

## Limites

Cet essai a vérifié une création réelle et les parcours visibles associés. Il n'a pas validé un planning complet lié, le calcul du chemin critique, les droits d'autres rôles, les exports ou des réservations de ressources. Les captures observées dans la conversation constituent les preuves visuelles de la session ; aucune modification du code applicatif n'est incluse dans cet audit.
