# Améliorations du planning réel — 8 septembre 2026

Périmètre : écran Angular de Sektor, API des activités et calendriers, environnement local 4200/8082. Cette livraison ne termine pas toutes les fonctionnalités de la spécification cible.

## Livré

- Panneau Affichage : masquer/afficher type, début, fin, durée, prédécesseurs et liaisons. Nom toujours présent.
- Vues nommées : formulaire intégré, sauvegarde locale par utilisateur et contexte, restauration des colonnes et des liaisons. Plus de window.prompt.
- Grille et chronologie avec défilements séparés ; dates visibles par défaut. Correction du Gantt vide au chargement (marqueur initialisé avant son utilisation).
- Calendrier chantier éditable : plusieurs créneaux, week-ends, fin le lendemain, exceptions de fermeture/ouverture, fuseau et date d’effet.
- Calendrier spécifique dans l’activité, copié depuis le chantier et modifiable, avec retour à l’héritage. Persistance JSONB, contrôle des droits calendrier côté serveur.
- Fin calculée avant enregistrement par le même moteur serveur que l’écriture, avec annulation logique des aperçus obsolètes.
- Recalcul explicite de la fin lors d’une modification dans cet écran. Les anciens clients API conservent leur comportement si recalculerFin n’est pas demandé.
- Ajout et retrait des prédécesseurs FD/DD/FF/DF pour une activité enregistrée.
- Enregistrer ramène au Gantt ; Enregistrer et détailler poursuit la création. Bordereau et avancement repliés.
- Correction d’un rafraîchissement asynchrone qui écrasait la première modification du calendrier.

## Vérifications réalisées

- Compilation Angular développement réussie. Avertissement préexistant RouterLink inutilisé dans AttachementListingPage.
- 37 tests backend réussis : calendrier activité (3), calcul ouvré (13), formes/écriture activité (13), service calendrier chantier (8).
- Dans le navigateur : affichage des colonnes, enregistrement de la vue TEST UX — Dates et dépendances et restauration des prédécesseurs après masquage.
- Dans le navigateur : création TEST UX — Coulage de nuit, début 14/09/2026, lundi 22:00–06:00 le lendemain, durée 8 h, fin calculée et enregistrée au 15/09/2026. Réouverture : calendrier et dates conservés.
- Dans le navigateur : modification de 8 à 24 h → fin recalculée du 15 au 16/09/2026, puis retour à 8 h → fin au 15/09/2026.
- Dans le navigateur : liaison DD depuis TEST UX — Terrassement zone A ajoutée puis retirée avec succès.
- Migration v1.12 appliquée seule via lifecycle sur Docker Desktop staging ; les deux migrations RH en attente ont été exclues. Catalogue et image lifecycle complets restaurés ensuite. Preflight réussi.

Les deux activités TEST UX du chantier sont conservées pour démonstration. Aucune publication client ni déclaration d’avancement n’a été effectuée.

## Travail restant dans la spécification cible

- Moteur de propagation des liaisons, décalages, simulation d’impact, marges et chemin critique calculé. L’écran signale que les liaisons ne décalent pas encore les dates.
- Planification hebdomadaire, ressources et conflits, validations et auto-approbation à arbitrer.
- Vues métier client/financier connectées, snapshots contractuels et publication avec preuve.
- Choix métier A01–A03 et A05–A09 ; pas d’adoption implicite des propositions.
- Ordonnancement et calculs intrajournaliers complets : l’API actuelle expose des dates, pas des instants de début/fin.

La migration conserve les lignes existantes : calendrier_specifique NULL signifie héritage du chantier. Modifier le calendrier chantier ne recalcule pas automatiquement toutes les activités.
