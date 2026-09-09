# Planning : marché et besoins — 9 septembre 2026

## Périmètre

La vue Client reprend désormais les lots et ouvrages de nature VENDU du budget chantier. Les dates sont agrégées depuis les activités rattachées ; un ouvrage sans activité reste visible comme non planifié. Une activité liée à plusieurs postes n'est comptée qu'une fois dans son lot. L'avancement affiché est celui des ouvrages, sans moyenne implicite des activités. Cette lecture ne constitue ni une publication ni une preuve d'accord client.

Les lots se replient individuellement ou globalement. Le détail des activités liées est facultatif. Le CSV reprend les branches visibles et, lorsqu'il est activé, leur détail. Les jalons contractuels restent affichables indépendamment d'un rattachement à un ouvrage vendu ; les activités internes ne deviennent pas contractuelles parce qu'elles figurent dans le planning.

La fiche d'une activité d'exécution contient un panneau « Ressources et besoins ». Les besoins persistés comprennent le type (équipe interne, matériaux, matériel ou sous-traitance), le libellé, la quantité, l'unité, le nombre de jours avant le début où ils sont nécessaires et le délai de préparation. Les délais sont calendaires et se rapportent au début enregistré de l'activité.

Pour les matériaux et le matériel, « Préparer une demande d'achat » crée une demande BROUILLON dans Achats avec le chantier, le demandeur connecté, la date du besoin et une note de traçabilité. Le besoin conserve l'identifiant et le numéro de la demande. Les articles et prix doivent être complétés dans Achats avant soumission. L'opération ne soumet ni n'approuve la demande et ne crée pas de commande. Les droits de création d'une demande et de modification du planning sont contrôlés côté serveur.

Une seconde préparation renvoie la demande déjà liée. Un besoin lié ne peut plus être retiré par cette API. Si la date relative du besoin change, la fiche signale l'écart avec la date utilisée pour préparer la demande ; elle ne modifie pas silencieusement la pièce d'achat.

La vue Ressources donne accès aux activités recoupant les sept jours sélectionnés et à leurs besoins. Il s'agit d'une préparation, sans validation hebdomadaire.

## Limites à traiter

- Les besoins d'équipe et de sous-traitance sont enregistrés mais ne créent pas encore de demandes dans leurs modules.
- La disponibilité, la réception et le statut actuel des achats ne sont pas déduits de la présence d'un lien. La pièce source doit être consultée.
- Le budget chantier est la source de la nature VENDU ; cette nature seule n'apporte pas de preuve de signature d'un marché ou d'un avenant.
- La règle d'auto-approbation hebdomadaire reste à arbitrer. Publication client, replanification du reste à faire et charge interchantiers restent hors de cette livraison.

## Vérifications

- 20 tests backend réussis : besoins (5), moteur réseau (6), service réseau (4), réservations (5).
- 11 assertions sur l'agrégation du marché : rattachements multiples, dates, absence de planification, exclusion des coûts internes et des phases, jalon indépendant et avancement source.
- Migration v1.14 ciblée appliquée via nlops sur Docker Desktop staging ; catalogue et image lifecycle complets restaurés ensuite.
- Navigateur : arbre vendu de CH-2026-002 chargé, trois ouvrages non planifiés conservés, repli global vérifié.
- Navigateur : besoin « TEST UX — Granulats pour terrassement » enregistré sur CH-2026-015 (12 m³, nécessaire le 12/09/2026, à lancer le 07/09/2026), puis création de DA-2026-0023 en brouillon. Date, motif, quantité en note et lien vers Achats vérifiés. Aucun article, prix, commande ou validation créé. Cet artefact de test est conservé.
- Le test a révélé l'absence de libellé chantier sur la demande : la création transmet maintenant code et nom depuis le chantier du tenant. L'ouverture des anciennes demandes complète ces libellés lorsqu'ils manquent et que le chantier est accessible.
- Vérification après correction : DA-2026-0023 affiche « Chantier blocage mta6cyqm » dans son titre et son sélecteur. Retour au planning après rechargement : besoin et lien conservés. La préparation de la période du 9 au 15 septembre affiche les deux activités qui la recoupent et le besoin enregistré.
- Build Angular réussi (avertissement préexistant RouterLink d'AttachementListingPage). Les tests serveur ont été relancés avec succès après la correction des libellés.
- Preflight staging réussi ; serveur local redémarré. Le premier lancement parallèle des builds a rencontré un conflit de cache Gradle ; la reprise séquentielle sans cache a réussi.
