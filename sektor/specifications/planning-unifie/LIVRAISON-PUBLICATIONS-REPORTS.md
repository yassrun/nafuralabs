# Publications client et reports — 9 septembre 2026

## Publication client

Dans la vue **Client**, le panneau repliable **Versions client** sépare la prévision courante des versions enregistrées.

- Préparer un aperçu reconstruit côté serveur à partir des lots/ouvrages vendus et des activités rattachées. Un ouvrage sans dates reste visible comme non planifié.
- Ajouter les jalons contractuels, même sans rattachement à un lot vendu. Les cases existantes de la vue permettent d’inclure les jalons techniques et les activités d’exécution.
- Comparer cet aperçu à la dernière publication : lignes ajoutées/retirées, dates, avancement, intitulés, rattachements, identité du chantier/client et périmètre sélectionné.
- DT/DG ou direction habilitée sur le périmètre : figer une version numérotée avec intitulé, date et auteur. Le serveur refuse un aperçu devenu périmé.
- Consulter/exporter le contenu figé en CSV. Le contenu est une liste explicite de champs client ; aucun montant de déboursé, marge, besoin ou affectation nominative n’est sérialisé.
- Enregistrer séparément un accord, des réserves ou un refus : date, interlocuteur, référence obligatoire de preuve et note. Chaque retour s’ajoute à l’historique ; aucun ne remplace les précédents ni le contenu publié. Les accès sont contrôlés par tenant et chantier, avec verrouillage optimiste.

La publication n’envoie rien au client. La preuve est une référence à une pièce conservée dans les documents du chantier ; ce parcours n’upload pas de fichier et ne vérifie pas de signature électronique. La délégation explicite de publication à un rôle inférieur reste à réaliser. Les filtres de lignes/colonnes de la vue courante ne réduisent pas silencieusement la publication : son aperçu définit le contenu exact.

## Report entre semaines

Dans **Ressources → Équipes et semaine**, le panneau repliable **Reporter des activités** est lié à la semaine sélectionnée et affiche les propositions du chantier.

1. Chef ou supérieur habilité sélectionne les activités non commencées démarrant cette semaine, ou le reste à faire d’activités commencées, un lundi de destination ultérieur et un motif. Pour le reste à faire, la date d’arrêté et les heures restantes sont obligatoires ; voir [la livraison correspondante](LIVRAISON-RESTE-A-FAIRE.md).
2. L’aperçu décale leurs dates de début du nombre de semaines demandé, puis recalcule le réseau avec les calendriers et les liaisons FD/DD/FF/DF. Il montre toutes les lignes modifiées, y compris les successeurs et les ajustements du calcul, avec dates avant/après et nouvelle fin du réseau.
3. Le détail indique les semaines touchées, leur état/révision au moment de l’aperçu, les réservations à recontrôler et les nouvelles dates de besoin/lancement. Les demandes d’achat existantes conservent leurs dates sources.
4. Soumettre enregistre la proposition et son aperçu sans changer les activités.
5. Un autre conducteur ou supérieur du périmètre valide/applique ou refuse avec motif. L’auteur peut retirer sa proposition. Le serveur refuse les décisions répétées, l’auto-validation et tout changement du planning ou des semaines depuis l’aperçu.
6. L’application modifie les dates atomiquement et conserve l’aperçu initial dans l’historique du report. Le mécanisme hebdomadaire existant détecte les changements et expose les états **À revalider / À soumettre à nouveau**, sans effacer les révisions antérieures.

Limites explicites : calcul au jour. Les activités commencées sans estimation du reste à faire restent ancrées ; une reprise déjà commencée nécessite une nouvelle estimation pour être déplacée. Une validation de report n’est pas une validation de disponibilité des moyens ni une approbation hebdomadaire. Le contrôle des conflits fermes reste dans la validation de semaine. Les dates des achats ne sont pas modifiées automatiquement.

## Vérification et environnement

- 67 tests backend du planning réussis, dont 7 sur les publications, 8 sur les reports et 1 sur le seuil de publication DT/DG. Couverture : projection client, immobilité des versions, preuve obligatoire, concurrence, périmètre, refus d’auto-validation, propagation des successeurs, week-end, protection du réalisé et refus d’un aperçu périmé.
- 7 contrôles frontend de comparaison de versions réussis. Build Angular et contrôle du graphe unique Angular réussis.
- Vérification réelle sur CH-2026-015 : aperçu client avec quatre activités ; aperçu du report du terrassement du 14–16 au 21–23 septembre ; proposition enregistrée, absence d’action d’auto-validation, puis retrait avec motif. La proposition QA retirée reste dans l’historique ; les dates des activités sont conservées. Aucune publication ni preuve d’accord client de test n’a été enregistrée. Publication effective et retours client : tests backend, sans essai d’écriture sur les données client.
- Le blocage de session est résolu avec le profil local existant `npm run start:erp:cursor -- --prebundle=false`, qui renouvelle la session QA auprès du backend local. Aucune modification IAM ni des droits des utilisateurs n’a été effectuée. Le frontend et le backend restent accessibles sur les ports 4200 et 8082.
- Contrôle HTTP réel : un chef de chantier non affecté à CH-2026-015 reçoit un refus 403 à la lecture des publications. Après rechargement du navigateur, la proposition retirée reste visible dans l’historique. Aucun message d’erreur navigateur sur les parcours vérifiés. Espacements et pluriels des panneaux finalisés.
- Les migrations `v1.16/001_planning_publications.sql` et `002_planning_reports.sql` sont appliquées et enregistrées comme `EXECUTED` en staging local.
- La migration globale a rencontré une migration RH antérieure non appliquée (`m-fa4684fbd6bb0c8740e67b2b`, collision `rh_postes_pkey`). Les deux migrations planning ont été exécutées par un Job Liquibase ciblé, avec les mêmes identifiants et chemin de changelog officiels. L’image lifecycle globale a ensuite été restaurée. Aucun historique RH n’a été marqué artificiellement comme exécuté. Ce problème RH reste un préalable au déploiement global.

Restent notamment : accès IAM des profils opérationnels à vérifier (refus HTTP constatés avec les identités QA chef/conducteur/DT), délégations explicites, preuve liée directement à un document, réservation d’engins et couverture quantitative des réceptions par besoin.
