# Report du reste à faire — 9 septembre 2026

## Comportement livré

Dans **Planning → Ressources → Équipes et semaine → Reporter des activités**, la sélection distingue les activités entières et les activités commencées. Pour ces dernières, la préparation demande une **date d’arrêté** et des **heures restantes**, saisies explicitement. Le pourcentage d’avancement ne sert pas à déduire automatiquement la durée restante.

L’aperçu affiche le début conservé, l’ancienne et la nouvelle fin, la reprise, les heures restantes, les successeurs affectés et les semaines à revoir. La proposition n’applique aucune date. Un autre conducteur ou supérieur habilité valide ou refuse ; l’auto-validation reste interdite. La proposition, son aperçu et la décision restent dans l’historique.

Le report conserve la même activité : identifiant, début enregistré, statut, avancement, durée initiale, besoins et réservations. Il ajoute une prévision de reprise et des pauses. Il ne crée pas un second besoin matériel ou une seconde réservation. Le début enregistré n’est pas une nouvelle déclaration de début réel ; il conserve la valeur existante du planning.

- La nouvelle fin est calculée avec les minutes restantes et le calendrier applicable.
- Les liaisons s’appuyant sur le début d’une activité commencée utilisent le début conservé. Celles s’appuyant sur sa fin utilisent la nouvelle fin prévue.
- Les activités terminées et celles commencées sans estimation restent ancrées. Une contrainte incompatible avec leur début/fin conservés est refusée.
- Une reprise future peut suivre le recalcul du réseau. Quand elle a déjà commencé, une nouvelle estimation est nécessaire avant de la déplacer à nouveau.
- Les pauses libèrent la charge journalière des réservations, y compris dans l’agrégation des autres chantiers. Les jours de reprise réutilisent les réservations existantes, selon le calendrier et la validité des affectations.
- Les instantanés hebdomadaires incluent les données de reprise. Les révisions antérieures sont conservées et les changements peuvent demander une nouvelle soumission/validation.

## Finition UX

La fiche affiche un encart **Reprise prévue le…**, les heures restantes et la date d’arrêté. Le début, la durée initiale, le type et le calendrier spécifique sont protégés après report ; le parcours de report sert à réviser la reprise. Une modification de libellé conserve la nouvelle fin et la prévision. Le déplacement direct de cette activité dans le Gantt est désactivé.

La colonne Durée indique les **heures restantes** pour une reprise en cours. La grille des ressources se recharge après une modification des activités ; elle ne garde plus silencieusement les anciennes charges. Les activités entièrement en pause sur la semaine sont écartées de la liste de préparation. Le panneau des besoins rappelle que les quantités et dates initiales doivent être rapprochées des besoins de reprise.

## Vérifications

- **76 tests backend planning réussis, zéro échec** : réseau mixte, début conservé, propagation de fin, contraintes incompatibles, estimation renouvelée, pauses successives, conservation des besoins/avancement, charge pendant les pauses et instantanés hebdomadaires. Les cas précédents de publication, concurrence et autorisations métier restent couverts.
- Build Angular de développement réussi ; recompilation finale des ajustements UX réussie. Avertissement préexistant de `RouterLink` inutilisé dans la liste des attachements, hors planning.
- Essai HTTP et navigateur sur **CH-2026-004**, activité explicite `TEST QA — Reprise partielle 09-09-2026` (`82bba060-f32c-4d1e-8bd7-1465a1c5e271`). Début 09/09, fin initiale 11/09, durée initiale 24 h, avancement 40 %. Proposition de 16 h restantes, reprise 14/09, fin calculée 15/09.
- Proposition `6028bfa5-e62b-46e2-bbdd-662e09086b5c` préparée avec QA DG puis validée dans le navigateur avec QA Owner. Auteurs distincts ; dates inchangées avant validation. Vérification du début, de l’avancement, de la durée initiale, des mêmes besoins et réservations après application.
- Charge vérifiée : aucune réservation de cette activité les 10–11/09 pendant la pause ; 4 h les 14–15/09 à la reprise. Essai navigateur de réservation/retrait : charge actualisée sans rechargement manuel. La réservation temporaire a été retirée ; l’activité, le besoin et le report QA restent identifiés comme tests.
- Fiche et champs conditionnels vérifiés dans le navigateur ; une sauvegarde de métadonnées ne modifie pas la prévision de reprise.

## Environnement et limites restantes

La migration `v1.17/001_planning_remainder.sql` est appliquée au staging local. Le backend local a été redémarré. Preflight réussi, PostgreSQL et services d’infrastructure disponibles ; application exécutée localement sur 4200/8082.

La migration RH antérieure `m-fa4684fbd6bb0c8740e67b2b` bloque toujours la migration globale par collision `rh_postes_pkey`. La migration planning a été exécutée via le Job Liquibase ciblé avec son identifiant et chemin officiels, puis l’image lifecycle globale a été restaurée. Aucun historique RH artificiellement validé.

Les identités QA chef, conducteur et DT ont reçu un refus HTTP d’autorisation d’accès à l’API ; le chef est pourtant affecté à ce chantier. L’essai réel utilise donc deux profils de direction déjà habilités. Les règles métier chef/conducteur sont testées, mais leur parcours complet avec IAM reste à débloquer et à vérifier. Aucun droit IAM n’a été ajouté.

La réservation d’engins, les créneaux horaires précis, le changement d’équipe limité à un segment de reprise, les délégations explicites et le rapprochement quantitatif des réceptions restent à réaliser. Les besoins et achats conservent leurs dates sources : les échéances et quantités à fournir doivent être révisées dans Achats. Le Gantt affiche encore l’enveloppe début–fin ; les pauses sont détaillées dans la reprise et prises en compte dans les charges, sans représentation segmentée des barres. Le planning ne doit donc pas être présenté comme complet à 100 %.
