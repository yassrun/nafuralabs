# Cycle hebdomadaire — 9 septembre 2026

Cette première livraison est complétée par [le suivi des approvisionnements et des disponibilités](LIVRAISON-APPROVISIONNEMENTS-RESSOURCES.md), qui ajoute les congés approuvés et la charge interchantiers aux contrôles décrits ci-dessous.

## Fonctionnement implémenté

La vue Ressources contient la préparation et la validation de la semaine. La sélection d'une date se ramène au lundi ; la période couvre le lundi au dimanche. Le contenu comprend toutes les activités d'exécution recoupant cette période, leurs dates, durées, calendriers, besoins et réservations.

Le chef de chantier ou un conducteur/supérieur habilité prépare et soumet. Le conducteur ou supérieur habilité décide. Les contrôles s'exécutent sur le serveur, dans le tenant et le périmètre chantier. Une personne ayant participé à la préparation ne peut ni valider ni rejeter la semaine, même après changement de préparateur ou de révision.

États : non préparée, brouillon, soumise, validée, à corriger. Une modification des données sources signale une semaine soumise comme à soumettre à nouveau, et une semaine validée comme à revalider. L'ancienne décision et son contenu restent conservés. Le réalisé (statut et pourcentage d'avancement) est distinct du contenu prévisionnel et ne réécrit pas une révision validée.

Les commandes portent la version de la semaine et l'empreinte des données consultées. Une modification concurrente impose une actualisation. La soumission et la validation refusent une préparation dont les activités ou moyens ont changé. Nouvelle révision et retour pour correction exigent un motif. Une semaine vide peut être préparée mais ne peut pas être soumise.

Une affectation absente, inactive ou hors dates sur un jour travaillé de la semaine constitue un conflit confirmé : brouillon et soumission restent possibles, validation bloquée. Les surcharges locales indicatives ne bloquent pas. Les absences RH et charges interchantiers ne sont pas encore intégrées à cette décision.

Le panneau permet de consulter le contenu enregistré et l'historique des actions : révision, action, identifiant de l'auteur, date, note et contenu figé. Les détails secondaires sont repliés pour limiter l'encombrement.

## Limites explicites

- La préparation porte sur les activités déjà enregistrées ; elle n'est pas encore un éditeur de créneaux ou d'objectifs journaliers indépendant.
- Les changements dans les activités et moyens sont détectés à la lecture et lors des commandes. La décision historique n'est pas effacée.
- Pas encore de commande dédiée de report comparant en un seul écran la semaine d'origine et celle de destination. Le déplacement des activités invalide les révisions concernées lors de leur lecture.
- Pas de notification externe ni d'approbation client générée par la soumission hebdomadaire.
- Le contrôle des comptes contributeurs est conservateur : tous les contributeurs de cette semaine, y compris les révisions antérieures, sont exclus de sa décision.
- La modification d'un calendrier chantier entraîne une nouvelle vérification, même si la version modifiée concerne une autre période.

## Validation automatisée

22 tests réussis : 12 pour le cycle hebdomadaire et 10 pour la politique de droits. Scénarios : décision par une autre personne, refus d'auto-validation malgré changement de préparateur, conservation des anciennes dates, refus des commandes obsolètes, modification des besoins, motif de correction, séparation du réalisé, lundi obligatoire, semaine vide, refus métier, affectation indisponible, séparation entre tenants et stabilité de la sérialisation de l'horodatage.

Les tests de service utilisent des repositories simulés. Les commandes sont transactionnelles avec isolation sérialisable ; une version JPA et une contrainte unique tenant/chantier/lundi protègent la persistance. Cela ne remplace pas un test de charge concurrente sur PostgreSQL.

Migration v1.15 ciblée appliquée via nlops dans Docker Desktop staging. Les douze colonnes de la table ont été vérifiées en lecture dans PostgreSQL. Build Angular développement réussi.

La première vérification réelle a détecté une incrémentation parasite de version après écriture de l'historique : le changement de fuseau lors du retour JSON d'un OffsetDateTime rendait l'entité de nouveau modifiée. L'horodatage utilise désormais Instant en UTC ; un test d'aller-retour JSON vérifie son égalité.

## Vérification dans l'application

Après reconstruction et relance du serveur corrigé, le parcours réel a réussi sur CH-2026-015, semaine du 14 septembre 2026 : enregistrement du brouillon, soumission, nouvelle révision avec motif, puis actualisation. L'écran retrouve le brouillon en révision 2 et les trois événements historiques. PostgreSQL confirme cet état et une version stable à 4 après lecture. Le compte préparateur voit le message d'exclusion de la décision et aucun bouton de validation. La validation positive par une autre personne est couverte par les tests automatisés ; elle n'a pas été effectuée avec un second compte dans l'interface.

Le brouillon nommé « TEST UX » est conservé sur ce chantier de test. Aucune approbation client ni notification externe n'a été envoyée. Le rendu du panneau a été contrôlé visuellement, avec contenu enregistré et historique repliés.

Les images locales complètes ont été reconstruites après la migration ciblée et le précontrôle nlops a réussi. Backend local relancé avec succès ; frontend disponible sur le port 4200. Le serveur Angular utilise temporairement `--prebundle=false` pour éviter un doublon de modules Angular rencontré dans le cache de développement, sans changement de la configuration du projet.
