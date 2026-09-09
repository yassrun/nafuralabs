# Sektor — Planning unifié de chantier

Version 0.1 · Atelier du 8 septembre 2026 · Spécification fonctionnelle et UX proposée.

**Statut : document de travail détaillé, prêt à revue métier et technique.** Les décisions acquises ci-dessous proviennent de l'atelier ; les autres règles sont des propositions, et ne deviennent pas des engagements par leur présence dans ce document. Les exemples de la maquette sont fictifs. Cette livraison ne déploie pas de nouveaux comportements dans l'ERP.

## 1. Intention produit et décisions acquises

Un planning courant par chantier constitue la source commune. Des vues adaptées servent la direction, l'exécution, le client, la finance et les ressources. Une vue sélectionne et présente les informations autorisées ; elle ne crée pas un autre planning à ressaisir.

| ID | Décision issue de l'atelier |
|---|---|
| D01 | Un planning commun avec plusieurs vues selon l'usage et le destinataire. |
| D02 | Le microplanning est la déclinaison hebdomadaire du planning interne. |
| D03 | Le chef de chantier prépare sa semaine et les ressources nécessaires. |
| D04 | Aucune activité imprévue n'est créée depuis le microplanning : seuls les travaux existants peuvent y être détaillés. |
| D05 | Chaque chantier possède un calendrier spécifique : week-ends, jours fériés, horaires, shifts de nuit et exceptions. |
| D06 | Les éléments du planning comprennent des activités et des jalons, avec des natures métier. |
| D07 | Les situations de marché et les paiements attendus doivent pouvoir apparaître dans la vue financière. |
| D08 | L'expérience doit rester accessible aux équipes BTP, avec un moteur rigoureux et peu de saisies répétées. |

| D09 | L’utilisateur doit pouvoir afficher et masquer les informations à la demande et conserver ses choix dans une vue personnelle. |

Points à confirmer : validation hebdomadaire par le conducteur, autorité de publication client, gestion du report d'une tâche inachevée, conventions de calcul, pondération de l'avancement. Voir section 19.

### Résultats attendus

- Préparer une réunion client et une semaine terrain sans reconstruire les activités.
- Savoir ce qui est engagé, ce qui est actuellement prévu et ce qui est réalisé.
- Comprendre la conséquence d'un retard avant de modifier le planning.
- Relier une activité aux quantités, ressources, achats et pièces ERP utiles.
- Ne pas exposer les données internes dans un document client.

La différenciation visée face aux outils généralistes est l'intégration aux parcours Sektor et la simplicité d'usage. Il ne s'agit pas d'une promesse de supériorité de calcul sur Primavera ou Microsoft Project.

## 2. Existant audité et conséquences UX

Audit du code présent dans le workspace au 08/09/2026 ; aucune validation de la base active ni mesure de performance en production. Des modifications non liées à ce document sont déjà en cours dans le workspace, notamment sur l'autorité d'affectation.

| Existant observé | À préserver / évolution proposée |
|---|---|
| Gantt dhtmlx, sélection chantier, période, granularité, plein écran | Garder un Gantt central ; réduire les contrôles permanents ; conserver les réglages par vue. |
| Activités avec parent, zone, dates et ordre | Étendre le modèle existant ; distinguer phase, activité et jalon explicitement. |
| Dépendances FD/DD/FF/DF ; refus des cycles côté service | Préserver les relations ; ajouter décalages, calcul calendaire et simulation d'impact. |
| Rattachements à des lots/postes et quantités ; saisie d'avancement | Préserver les allocations et éviter toute double comptabilisation. |
| Déplacement et redimensionnement des barres avec confirmation | Remplacer la confirmation générique par un aperçu des dates et impacts. |
| Export actuel par `window.print()` | Ajouter une publication versionnée et un document paginé contrôlé. |
| Moyenne arithmétique des pourcentages affichée | Nommer ce calcul actuel ; passer à un agrégat avec pondération explicite. |
| Chargement de tous les chantiers actifs, puis une requête par chantier | Charger d'abord le périmètre demandé ; agrégation dédiée pour le portefeuille. |
| Certaines erreurs de chargement deviennent des listes vides | Distinguer panne, accès refusé, absence de données et filtres sans résultat. |
| Vue principale limitée au Gantt et légende de statuts | Ajouter les vues semaine, client, finance, ressources et synthèse. |
| Dates exposées au jour dans le contrat actuel | Introduire horaires/fuseau sans perdre les conventions historiques de fin incluse. |

Sources locales :

- [Page actuelle](../../sources/web/app/chantiers/planning/chantiers-planning.page.html)
- [Interaction Gantt](../../sources/web/app/chantiers/planning/chantiers-planning.page.ts)
- [Facade et agrégats](../../sources/web/app/chantiers/planning/services/planning.facade.ts)
- [Contrat activités](../../sources/web/app/chantiers/services/activite-api.service.ts)
- [Service activités et contrôles](../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/ActiviteChantierService.java)
- [Politique d'affectation en cours dans le workspace](../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/ChantierAffectationPolicy.java)

Les fonctions absentes de ces parcours sont à concevoir/intégrer ; ce constat ne prétend pas qu'aucun module Sektor ne possède une brique réutilisable.

## 3. Modèle métier commun

### 3.1 Structure

`Entreprise → Chantier → Phase / sous-phase → Activité ou jalon`.

- Une phase regroupe ; elle ne porte pas de quantité exécutée autonome. Son début est le minimum des débuts enfants, sa fin le maximum des fins enfants.
- Une activité représente du travail, consomme une durée et peut porter des besoins en ressources.
- Un jalon représente un événement à un instant, sans durée et sans charge de ressources.
- Lot/poste budgétaire, zone et nature sont des dimensions distinctes de la hiérarchie du planning. On ne transforme pas automatiquement chaque poste du bordereau en activité.
- Une activité peut couvrir plusieurs rattachements quantitatifs, selon les règles existantes. Les agrégats n'additionnent jamais des unités incompatibles.
- Interdire cycles hiérarchiques, parent d'un autre chantier et liens de dépendance vers soi-même.
- En première version, les dépendances de calcul relient les feuilles du même chantier. Les contraintes interchantiers sont des alertes de ressources, pas des dépendances implicites.

### 3.2 Champs

| Famille | Champs et règle |
|---|---|
| Identité | ID stable, code lisible, chantier, parent, intitulé, forme (phase/activité/jalon). |
| Classification | Nature configurable, zone, rattachements lots/postes, tags facultatifs. |
| Responsabilité | Responsable du suivi, équipe pressentie ; distincts des affectations qui confèrent des droits. |
| Ordonnancement | Début/fin prévus, durée en minutes ouvrées, calendrier/version, mode calculé ou dates contraintes. |
| Relations | Prédécesseur, successeur, type, décalage, unité/calendrier du décalage. |
| Engagement | Référence approuvée associée ; contrainte contractuelle et pièce source si nécessaire. |
| Exécution | Début/fin réels, quantités validées, avancement, date de situation des données, reste à faire. |
| Visibilité | Éligibilité à la publication client, libellé client facultatif, classification des données. |
| Traçabilité | Auteur, horodatage, version de ligne, motif de modification et provenance. |

Création progressive : intitulé + forme + position ; pour une activité, début et durée ou dates explicites ; les autres rubriques restent repliées. Un élément incomplet peut rester en brouillon mais n'entre pas dans un planning publié sans ses informations obligatoires.

### 3.3 Natures initiales

Préparation/installation ; études/validation ; approvisionnement ; travaux ; contrôle/essai ; réception/clôture. Natures de jalons : technique, contractuel, financier.

Une nature est une classification, pas une permission. Les valeurs peuvent être désactivées sans supprimer l'historique. Les caractéristiques sensibles d'un jalon financier ne sont accessibles qu'aux utilisateurs autorisés.

### 3.4 Statuts distincts

- Exécution activité : non démarrée, en cours, terminée, annulée (motif obligatoire).
- Alerte calculée : en retard, bloquée par prérequis, conflit de ressources, échéance menacée. Une activité peut cumuler plusieurs alertes.
- Jalon : à venir, atteint, annulé ; « en retard » est dérivé d'une date dépassée sans réalisation.
- Publication et semaine ont leurs propres circuits de validation ; ils ne changent pas le statut d'exécution d'une activité.

## 4. Calendriers, shifts et durée

### 4.1 Calendrier du chantier

Fuseau IANA explicite, par défaut celui du chantier/entreprise, par exemple `Africa/Casablanca`. Ne pas coder un décalage UTC fixe. La semaine peut comporter n'importe quels jours travaillés.

Un jour contient zéro à plusieurs créneaux non chevauchants ; les pauses non travaillées sont exclues. Un shift « lundi 22:00 → mardi 06:00 » est rattaché à sa date de début et occupe réellement les deux dates. La réservation de ressources vérifie les deux portions.

Proposition de priorité : exception datée > règle de jour férié > semaine type. Une exception de fermeture sur une date locale ferme les portions de shifts de cette date, y compris un shift commencé la veille. Une ouverture exceptionnelle doit être explicite. Les fériés sont configurés/importés avec provenance et restent modifiables par une personne autorisée ; aucune liste légale n'est présumée dans le prototype.

Versions avec date d'effet. Modifier le calendrier simule les impacts sur le reste à faire, jamais sur les heures réelles ou une référence publiée. Interdire les créneaux de durée nulle, les chevauchements et la validation d'un calendrier sans plage ouvrée pour une activité à calculer.

### 4.2 Disponibilité des ressources

Le chantier peut être ouvert alors qu'une équipe ou un engin est indisponible. Créneau réservable = ouverture applicable au travail ∩ disponibilité de la ressource ∩ durée de son affectation au chantier, moins réservations existantes et indisponibilités connues.

Le droit d'affecter une personne à un chantier est distinct de sa réservation horaire sur une activité. Préparer une semaine ne permet pas de contourner la politique d'affectation.

### 4.3 Calcul

- Stocker les durées opérationnelles en minutes ouvrées ; afficher heures ou jours avec la convention visible (ex. « 1 j = 8 h »), jamais implicite.
- Mode calculé : début admissible + durée donnent la fin ; déplacer le début conserve la durée et propage dans une simulation.
- Mode contraint : une date fixée porte un motif. Signaler les incompatibilités au lieu de déplacer la contrainte silencieusement.
- Une activité de durée positive peut être interrompue par des périodes non ouvrées sans devenir plusieurs activités ; elle reçoit plusieurs créneaux hebdomadaires.
- Les délais contractuels/financiers distinguent jours calendaires, jours ouvrés selon un calendrier choisi et date fixe. Ne pas leur appliquer automatiquement le calendrier chantier.
- Proposition pour les décalages de dépendance : heures/jours ouvrés du calendrier du successeur par défaut, alternative calendaire explicite ; valeur conservée dans la relation.
- En V1, décalages positifs ou nuls ; préserver et signaler un décalage négatif importé plutôt que le convertir sans avertissement.
- Un jalon contractuel peut tomber un jour non travaillé : conserver la date et signaler la contrainte, sans la déplacer.

## 5. Dépendances, impact et référence

FD : le successeur commence après la fin du prédécesseur. DD : après son début. FF : finit après sa fin. DF : finit après son début (option avancée). L'interface présente d'abord des phrases, avec les codes en aide secondaire.

Le serveur est autorité de calcul. Il effectue validation, tri topologique, calcul des dates au plus tôt, dates au plus tard/marges par rapport à la cible choisie et identification des chemins critiques. Un planning non entièrement relié signale les activités isolées ; il n'affiche pas une certitude trompeuse sur la livraison. Un chemin critique temporel n'est pas une garantie de disponibilité des ressources.

### Modification type

1. L'utilisateur déplace une barre ou modifie les dates dans le panneau.
2. Sektor prépare une simulation à partir de la version courante.
3. Un panneau montre avant/après, activités impactées, décalage des jalons, conflits, hypothèses et pièces concernées.
4. L'utilisateur autorisé applique avec un motif ; sinon il enregistre une proposition destinée au valideur.
5. Le serveur recontrôle droits, version et disponibilités dans une transaction. En conflit concurrent, aucune écriture partielle : proposer de recalculer.
6. La référence approuvée reste inchangée. Une nouvelle référence exige le circuit explicite de publication/approbation.

Annuler avant application ne change rien. Après application, « annuler cette révision » est une nouvelle révision contrôlée, pas un effacement du journal. Les activités terminées conservent leurs dates réelles ; une correction du réalisé est tracée et autorisée séparément.

## 6. Vues et navigation

### 6.1 Cadre commun

Route proposée : `/chantiers/planning?chantier=<id>&vue=execution`. Conserver l'ancienne route et son paramètre `chantier`. Les paramètres de vue ne confèrent aucun accès.

En-tête : fil d'Ariane → chantier → « Planning » ; état de la version et date de mise à jour. Navigation locale : Synthèse, Exécution, Ma semaine, Client, Financier, Ressources. Calendrier accessible depuis le contexte, pas une sixième barre de filtres.

Actions globales limitées : Calendrier, Versions ; actions métier dans leur vue. L'assistant IA reste fermé par défaut dans cet espace dense et s'ouvre sur demande, sans créer un panneau permanent à côté du détail d'activité.

Filtres : période, lot/zone, nature, responsable, statut, niveau de détail. Afficher les filtres actifs et leur portée. Sauvegarde personnelle ou partagée d'une vue : nom, filtres, colonnes, regroupement, tri et échelle. Réévaluer les permissions à chaque ouverture/export.

**Panneau Affichage** : effets immédiats sur la présentation. Colonnes optionnelles (dates, durée, prédécesseurs, marge, responsable, avancement, zone), chronologie, référence, liaisons, criticité, légende, repère de date, codes et catégories de lignes. L’intitulé reste visible pour identifier les éléments. Les colonnes par défaut ne sont pas obligatoires.

Préréglages Essentiel, Analyse du réseau, Tableau seul ; réinitialisation et enregistrement personnel. Masquer ne supprime aucune donnée, ne change pas le réseau de calcul et ne modifie aucune publication figée. Les préférences de chronologie/liaisons sont conservées même quand leurs éléments sont cachés. La maquette couvre Exécution ; les colonnes spécifiques des autres vues suivront la même logique.

### 6.2 Synthèse

Montrer la livraison contractuelle, la prévision actuelle, la date des données d'avancement et les principales échéances. Présenter les décisions nécessaires avec lien vers la cause. Pas de moyenne anonyme ni de score de santé inventé.

Le portefeuille multi-chantiers est une synthèse en lecture avec accès aux chantiers autorisés et aux conflits communs ; la création exige un chantier explicite.

### 6.3 Exécution

Table arborescente à gauche ; chronologie synchronisée à droite ; noms toujours accessibles. **Colonnes visibles par défaut : activité/code, début, fin, durée, prédécesseurs et marge totale.** Responsable, avancement, quantité/reste, nature et zone sont ajoutables ; le responsable reste accessible dans le détail. Les dates ne doivent pas être cachées uniquement dans un tiroir. L'année est toujours identifiable ; une activité sur plusieurs années affiche l'année dans chaque date. Un jalon affiche la même date au début et à la fin, avec durée zéro. Une phase affiche des dates dérivées et une durée agrégée clairement définie ou un tiret, jamais une durée manuelle contradictoire.

La cellule Prédécesseurs affiche les codes des activités, types et décalages : `A03 · DD +4 j`, `A04 · FD`. Elle accepte plusieurs liens ; cliquer ouvre le nom complet du prédécesseur, le type en toutes lettres, le délai, son calendrier et les successeurs. L'édition des relations doit proposer l'activité existante, le type FD/DD/FF/DF et un décalage ; elle déclenche une simulation et le contrôle des cycles avant application.

Une barre « Afficher » propose trois commandes indépendantes : **Comparer à la référence**, **Liaisons logiques**, **Chemin critique**. Les préférences font partie des vues enregistrées.

- Liaisons logiques : flèches entre les extrémités correspondant au type (début ou fin). Le libellé textuel du tableau est l'alternative accessible aux flèches. Les liens masqués par un filtre sont signalés ; ouvrir le détail permet de retrouver le prédécesseur.
- Chemin critique : colorer les activités et les liaisons critiques, ajouter « Critique » et afficher la marge totale. Le rouge seul ne suffit pas. Une activité simplement en retard ou une ressource en conflit n'est pas automatiquement critique.
- Afficher la cible analysée, la date/version du dernier calcul et la convention de marge. Définir si l'analyse porte sur la fin prévisionnelle ou une échéance imposée. Une marge négative est affichée telle quelle avec l'écart à la cible, pas arrondie à zéro.
- Le calcul utilise le réseau complet autorisé du chantier avant les filtres de présentation. Un filtre ne recrée pas un autre chemin critique ; proposer de réafficher la chaîne complète si des éléments sont cachés.
- Si calcul absent, incomplet ou périmé : « Calcul requis » avec la raison et l'action Recalculer si autorisée. Ne pas afficher de marges fictives dans l'ERP. Si plusieurs chemins critiques existent, les afficher tous ou proposer une sélection explicite de chaîne/cible.

Barre pleine = prévision ; trait fin gris = référence sélectionnée ; losange = jalon ; alerte textuelle et pictogramme accompagnent les couleurs. Les phases se replient. Une échelle jour/semaine/mois change la présentation, jamais les données.

Un clic sélectionne et ouvre le détail ; édition explicite ou double clic. Le clavier permet d'accéder au même parcours. Le déplacement d'une barre n'écrit pas immédiatement. La création propose Activité, Jalon ou Phase ; jamais de jalon factice de durée un jour.

### 6.4 Ma semaine

Vue principale du chef : grille lundi–dimanche, avec tous les jours et shifts réellement ouverts. Afficher les dates complètes, le statut de préparation et les équipes. Les jours fermés restent visibles et non réservables.

Le bouton « Préparer la semaine » propose exclusivement les activités existantes non terminées du chantier. Une activité hors de sa fenêtre prévue peut être sélectionnée pour proposer un ajustement, mais son créneau reste bloqué à la validation tant que la révision nécessaire n'est pas approuvée.

Chaque créneau référence : activité, date/shift, début/fin, zone, équipe/personnes ou engin, quantité/unité par rattachement si nécessaire, commentaire opérationnel. Plusieurs créneaux partagent le même ID d'activité. Les quantités planifiées ne sont pas du réalisé.

Proposition de workflow : brouillon → soumise → validée → clôturée ; retour en correction avec motif ; modification d'une semaine validée produit une révision. Le chef prépare, le conducteur valide, les supérieurs compétents peuvent intervenir selon leur périmètre. L'auto-approbation doit être décidée explicitement, pas déduite du titre DG.

Clôture : rapprocher objectifs et quantités réalisées validées. Le reliquat reste attaché à l'activité initiale. Aucun report automatique validé ni duplication : proposer la reprise dans la semaine suivante et contrôler les dates/ressources. La règle d'approbation du report est à arbitrer.

### 6.5 Client

Deux états distincts : aperçu de travail et publication figée. La vue est une sélection avec regroupement, libellés client et niveau de détail ; elle ne se limite pas aux seuls jalons contractuels.

Prévisualiser exactement le destinataire : pas de coûts internes, noms privés, commentaires internes, conflits RH ou liens ERP internes. Les dépendances vers un élément masqué sont omises du document ou reformulées en jalon public choisi, sans révéler son contenu.

Publication : choisir périmètre, période, destinataire, référence comparée, titre et numéro de révision → prévisualiser → contrôler → figer. Contenu, dates, auteur, horodatage, référence, filtres et colonnes sont capturés ; l'évolution du chantier ne modifie pas le document.

Proposition de statuts : brouillon, publiée pour transmission, transmise, approuvée, refusée, remplacée. Publier ne veut pas dire transmettre, et transmettre ne vaut pas approbation. En V1, enregistrer la preuve/date d'accord manuellement avec droit dédié. Un accord porte sur une version précise.

Export PDF : format paysage A4/A3, répétition des en-têtes, pagination, légende, dates complètes, indice de révision et numéro de page. Prévoir un aperçu des coupures de périodes ; pas de capture écran étirée. Aucun envoi email automatique dans le périmètre initial.

### 6.6 Financier

Deux lectures : échéancier et trésorerie par période. Colonnes minimales : événement, source, échéance due, date prévue, montant, devise, réel encaissé/décaissé, solde, état. Filtrer entrées/sorties et situation/marché/fournisseur selon droits.

Chaîne d'une situation : préparation (activité) → dépôt → validation attendue → échéance de paiement → encaissement prévu → règlements réels. Dates dues et estimées sont distinctes ; une dépendance prévisionnelle ne modifie jamais le marché.

Source de vérité : montant de situation validée dans le module métier, règlements dans finance/trésorerie. Les jalons financiers portent une référence stable à ces objets. Une prévision saisie avant création de la situation est marquée « estimation » et rapprochée explicitement à la source ensuite, sans doublon.

Paiements partiels : échéance 480 000 MAD, encaissements réels 120 000 MAD → solde 360 000 MAD. Le reste peut être ventilé en plusieurs prévisions dont la somme ne dépasse pas le solde ; ne jamais compter à la fois le total initial et les versements. Retenues, avances, taxes et déductions viennent du marché/situation ; afficher la base HT/TTC/net à payer. Ne pas additionner des devises sans conversion, taux et date explicites.

La trésorerie affiche prévisions et réels séparés. Un montant encaissé ne détermine pas l'avancement physique, et un pourcentage exécuté ne crée pas automatiquement un droit à paiement.

### 6.7 Ressources

Vue équipes et engins par jour/shift, avec capacité, charge réservée, indisponibilités et activités liées. Distinguer besoin non affecté, proposition et réservation validée.

Une équipe possède une capacité explicite en personnes/heures ; les membres partagés entre équipes sont contrôlés pour éviter un double emploi. Un engin non partageable ne peut pas recevoir deux réservations qui se chevauchent. Les périodes sont demi-ouvertes [début, fin[ : 08–12 et 12–16 ne se chevauchent pas.

Conflit externe au périmètre : « Engin déjà réservé » et contact habilité, sans révéler un chantier inaccessible. Proposer un autre créneau ou une autre ressource autorisée ; ne pas déplacer silencieusement les réservations d'autrui.

## 7. Avancement et agrégats

- Avec quantité homogène : avancement = réalisé validé / quantité prévue, avec indication de la date de situation. Conserver le réalisé brut même en dépassement ; présenter le dépassement plutôt que supprimer l'information.
- Une activité à plusieurs postes/unités requiert des pondérations explicites (heures prévues ou poids approuvés). Ne pas additionner m³ et tonnes. Les pondérations ne varient pas au gré du filtre.
- Sans quantité : déclaration de pourcentage ou étapes pondérées, selon un mode choisi et tracé. Un jalon est atteint/non atteint, sans pourcentage arbitraire.
- Phase : moyenne pondérée des feuilles selon une base choisie et versionnée ; exclure phases intermédiaires/jalons du dénominateur pour éviter le double comptage.
- Si la base manque : afficher « Pondération à définir » ou un indicateur clairement nommé « activités terminées / total » ; pas de faux avancement global.
- Les déclarations brouillon apparaissent distinctement ; elles ne deviennent pas du réalisé validé par simple ouverture de la vue.
- Reste à faire et rendement réel peuvent aider la prévision, mais une estimation produite par le système est proposée avec son hypothèse, pas appliquée silencieusement.

## 8. Responsabilités et permissions proposées

Le rôle ouvre des capacités, le périmètre et l'affectation active les restreignent. Ne pas coder un droit général « modifier le planning » pour toutes les opérations. Réutiliser les conventions IAM existantes lors de l'implémentation ; les noms ci-dessous sont des capacités métier, pas des clés finales.

| Capacité | Chef chantier | Conducteur | DT | DG | DAF |
|---|---|---|---|---|---|
| Lire exécution | Son chantier | Ses chantiers | Périmètre supervisé | Entreprise | Lecture autorisée |
| Préparer semaine | Oui | Oui | Oui | Oui | Non par défaut |
| Modifier planning courant | Proposer | Oui dans périmètre | Oui | Oui | Non par défaut |
| Valider semaine | Non proposé | Oui | Oui | Oui | Non |
| Modifier calendrier | Proposer | Proposer | Oui proposé | Oui | Non |
| Publier / approuver référence | Non | Proposer | Oui proposé | Oui | Non |
| Modifier prévisions financières | Non | Selon délégation | Selon délégation | Oui | Oui |
| Saisir un paiement réel | Non | Non | Non par simple hiérarchie | Selon permission finance | Selon permission finance |

Chef d'équipe : consulter les tâches assignées et déclarer du réalisé selon droits. Ingénieur : consulter/mettre à jour les activités techniques déléguées. Magasinier : disponibilité/livraison autorisée ; pointeur : pointage. Les droits techniques ADMIN ne doivent pas devenir implicitement une signature métier.

La hiérarchie de commandement sur les affectations n'accorde pas automatiquement les permissions RH, paie ou comptabilité. Autoriser la planification d'une ressource n'autorise pas son recrutement ni son affectation à un autre chantier.

Capacités à séparer : lire, créer/éditer structure, simuler, appliquer révision, préparer/valider semaine, corriger réel, administrer calendrier, lire/modifier finance, publier, enregistrer accord, exporter, gérer vues partagées.

## 9. Parcours UX détaillés

### P01 — Initialiser

Depuis le chantier : ouvrir Planning → vérifier calendrier → créer/importer phases et activités en brouillon → rattacher zones/postes → définir dépendances → calculer → traiter les blocages → soumettre la référence. L'import d'un modèle ne valide ni quantités ni ressources automatiquement.

### P02 — Préparer la semaine

Ouvrir Ma semaine → choisir semaine → Préparer → sélectionner activités existantes → répartir objectifs et ressources → consulter les conflits → sauvegarder brouillon → soumettre. L'écran conserve les saisies en cas d'erreur réseau ; la validation exige une reconnexion et le contrôle serveur.

### P03 — Décaler

Sélectionner activité → modifier début/durée → Simuler → lire impacts → appliquer/proposer. Fermer la simulation laisse le planning intact. Une référence contractuelle dépassée est signalée en tant qu'écart, jamais réécrite.

### P04 — Préparer réunion client

Vue Client → choisir niveau et activités publiques → vérifier les libellés → comparer référence/courant si souhaité → aperçu exact → publier une révision → exporter/transmettre séparément → enregistrer la réponse.

### P05 — Anticiper la trésorerie

Vue Financier → ouvrir situation source → vérifier montant et échéance → saisir la date estimée ou ventiler le solde → visualiser la période impactée. Un paiement réel arrive du module finance et remplace uniquement la portion prévisionnelle rapprochée.

### P06 — Modifier les horaires

Calendrier → choisir semaine type ou exception → éditer → simuler activités et réservations affectées → motif et date d'effet → appliquer selon droits. Préserver références et réalisé. Les semaines déjà validées touchées sont signalées pour révision.

## 10. Composants et comportement d'interface

| Composant | Comportement |
|---|---|
| Barre de contexte | Chantier, titre, état de révision ; pas de gros indicateurs décoratifs. |
| Navigation des vues | Même chantier et sélection conservés si pertinents ; filtres propres à chaque vue. |
| Barre d'outils locale | Recherche, filtres, comparaison ; une action primaire selon la vue. |
| Gantt/table | Défilement synchronisé, lignes virtualisées, en-têtes figés, colonnes redimensionnables. |
| Détail d'activité | Tiroir latéral : résumé, dates/liens, quantités, ressources, historique ; fermer restitue le focus. |
| Panneau d'impact | Changements avant/après, liste des conflits, motif et action appliquer/proposer. |
| Calendrier | Semaine type lisible, créneaux jour/nuit, exceptions datées, effet sur les calculs. |
| Publication | Aperçu séparé des réglages, identification claire de la version et de son destinataire. |
| Assistant | À la demande, contexte courant explicite, propositions traçables ; ne masque pas les actions métier. |

Design : reprendre le bleu Sektor, les composants Anatomy, la typographie existante, les surfaces sobres et des bordures discrètes. Couleurs de statut accompagnées de mots. Supprimer les dégradés/ombres décoratives dans la grille pour améliorer la lecture des barres.

Sur grand écran, la chronologie est dominante. À moins de 1100 px, la navigation globale se replie et le détail passe en superposition. Sur mobile, Ma semaine devient une liste par jour ; Exécution propose une table/liste accessible plutôt qu'un Gantt miniature illisible.

Accessibilité : contrôles nommés, navigation clavier, focus visible, fermeture Échap, retour du focus, alternatives au glisser-déposer, annonces des erreurs, contraste lisible, réduction des animations. Localisation FR/EN/AR et prise en charge RTL prévues dans l'intégration, sans textes métier codés en dur.

## 11. États, erreurs et robustesse

| Situation | Réponse attendue |
|---|---|
| Premier planning vide | « Construire le planning » ; calendrier et modèle facultatif ; pas de message technique. |
| Aucun résultat filtré | Afficher filtres et « Effacer les filtres » ; ne pas proposer de recréer les données. |
| Chargement | Squelette sobre, conserver le contexte ; empêcher une écriture sur des données inconnues. |
| Échec partiel portefeuille | Identifier les chantiers indisponibles, ne pas les assimiler à zéro activité. |
| Accès refusé | Explication concise et retour à un périmètre autorisé ; aucun détail sensible. |
| Conflit de version | Montrer qu'une autre personne a modifié ; conserver le brouillon et proposer recalcul. |
| Calendrier incomplet | Bloquer le calcul/passage en validation et ouvrir la correction pertinente. |
| Ressource indisponible | Localiser le conflit, proposer autre affectation/créneau ; préserver le brouillon. |
| Référence absente | Afficher « Aucune référence approuvée » ; pas de retard contractuel supposé. |
| Finance non reliée | « Source à rapprocher » ; estimation séparée des montants validés. |
| Réseau perdu | Conserver la saisie en session ; aucune fausse confirmation d'enregistrement. |

## 12. Données et architecture proposées

Étendre le domaine activités existant. Ne pas créer un second moteur de tâches concurrent.

| Entité / projection | Contenu |
|---|---|
| PlanningChantier | Chantier, version courante, date de situation, calendrier par défaut. |
| ElementPlanning | Extension activité : forme, nature, responsabilité, planification, contraintes. |
| DependancePlanning | Extension précédence : type, décalage et convention. |
| CalendrierVersion | Fuseau, créneaux hebdomadaires, règles et exceptions, date d'effet. |
| SemainePreparation | Chantier, semaine, statut, version, auteur/valideur. |
| CreneauExecution | Activité existante, horaire/shift, quantité, ressources ; aucun nouveau travail autonome. |
| ReservationRessource | Ressource, intervalle, capacité consommée, source et état. |
| ReferencePlanning | Instantané immuable, portée, date/auteur, statut d'approbation. |
| PublicationPlanning | Contenu visible figé, référence, destinataire, fichier, preuve et révision. |
| VuePlanning | Paramètres de présentation, propriétaire et partage autorisé. |
| EvenementFinancier | Projection/source référencée + prévisions ventilées ; pas de copie éditable des règlements. |
| RevisionPlanning | Proposition/commit, version de base, changements, motif, auteur. |

Contrats applicatifs à concevoir (noms indicatifs, non implémentés) :

- Lire un planning par chantier/période/vue avec capacités autorisées et numéro de version.
- Simuler une révision : version de base + changements → dates recalculées + violations + impacts + hypothèses.
- Appliquer la simulation : identité de simulation + version + motif ; revalidation transactionnelle et idempotence.
- Lire/modifier/simuler un calendrier versionné.
- Créer/modifier/soumettre/valider une semaine et réserver les ressources de manière atomique.
- Lire une disponibilité sur un périmètre avec masquage des détails non autorisés.
- Prévisualiser/publier/exporter une version ; enregistrer l'accord séparément.
- Lire la projection financière et rapprocher une estimation de sa source.

Chaque endpoint filtre tenant + chantier + capacité métier côté serveur. L'auteur provient de la session, jamais d'un champ libre envoyé par le navigateur. Recontrôler les permissions lors d'un export asynchrone et de son téléchargement.

Événements entrants (contrats à préciser) : avancement validé/corrigé, affectation modifiée, indisponibilité, commande/livraison, situation validée, règlement rapproché. Traitement idempotent par ID/version de source ; indiquer date de synchronisation et échec éventuel. Pas de boucle de mise à jour planning ↔ module source.

## 13. Intelligence assistée, périmètre borné

Propositions initiales : expliquer le retard d'un jalon, résumer les écarts pour une réunion, suggérer la répartition d'activités existantes pour la semaine.

L'assistant reçoit uniquement les données autorisées, identifie les sources/versions et sépare constat, hypothèse et proposition. Il ne crée pas d'imprévu depuis Ma semaine, ne valide pas une semaine, ne publie pas un document et ne modifie pas un calendrier sans le circuit métier explicite. Aucun chiffre inventé si une source manque.

Le moteur de calcul et les validations sont déterministes ; l'IA explique ou prépare une demande, elle ne remplace pas le contrôle de contraintes.

## 14. Migration de l'existant

1. Inventorier données actuelles et usages du Gantt ; sauvegarder une référence de migration avec date/source.
2. Préserver IDs, liens, zones, allocations, quantités et déclarations.
3. Classer les parents existants après revue : ne pas convertir automatiquement un parent productif en phase et perdre ses quantités.
4. Ajouter un calendrier historique explicite pour reproduire les anciennes dates ; ne pas supposer lundi–vendredi ni convertir en shifts de nuit.
5. Convertir date de fin incluse historique vers intervalle de calcul sans décaler la date visible. Écrire des tests sur les fins de mois et nuits.
6. Laisser nature, durée ouvrée ou pondération « à qualifier » lorsqu'elles ne peuvent pas être déduites. Ne pas recalculer massivement au premier affichage.
7. Introduire simulation, puis application avec contrôle de version ; compatibilité de l'ancienne route.
8. Activer les nouvelles vues progressivement ; garder une possibilité de revenir à la vue historique pendant le pilote, sans deux sources d'écriture concurrentes.

Aucune référence de migration n'est présentée comme une approbation client. Les publications n'existant pas historiquement ne sont pas reconstituées comme des accords.

## 15. Critères d'acceptation

| ID | Scénario vérifiable |
|---|---|
| AC01 | Modifier un intitulé courant le reflète dans les vues autorisées, pas dans une publication déjà figée. |
| AC02 | Un chef ne peut créer aucune activité autonome depuis Ma semaine, y compris par appel direct au parcours hebdomadaire. |
| AC03 | Deux créneaux hebdomadaires référencent la même activité ; son total prévu n'est pas doublé. |
| AC04 | Une activité vendredi de 8 h finit vendredi ; 16 h finit samedi si ouvert et lundi si week-end fermé, à calendrier égal par ailleurs. |
| AC05 | Un shift lundi 22 h–mardi 06 h consomme 8 h en dehors d'un changement de fuseau ; une réservation mardi 02 h est détectée en conflit. |
| AC06 | Une fermeture exceptionnelle retire ses heures des calculs futurs ; la référence et les dates réelles restent inchangées. |
| AC07 | À une transition de fuseau, instants et durées sont cohérents avec la politique de temps réel retenue ; aucun horaire inexistant accepté silencieusement. |
| AC08 | A→B→C puis C→A est refusé ; aucune modification partielle enregistrée. |
| AC09 | Une simulation montre les successeurs affectés ; Annuler laisse dates et versions inchangées. |
| AC10 | Un jalon contractuel dépassé demeure à sa date de référence et porte un écart prévisionnel. |
| AC11 | Une équipe/engin déjà réservé ne peut être validé deux fois au même créneau au-delà de sa capacité. |
| AC12 | Deux validations concurrentes sur le même engin produisent au plus une réservation valide ; l'autre conserve un brouillon à corriger. |
| AC13 | Un utilisateur d'un autre chantier ne peut lire ni modifier ses activités, semaines, sources ou exports. |
| AC14 | Une semaine validée modifiée conserve son ancienne version et exige une révision selon la politique choisie. |
| AC15 | Une tâche inachevée produit un reliquat rattaché, sans création automatique d'imprévu. |
| AC16 | Prévision 480 000, règlement 120 000 : le reste est 360 000 ; totaux de trésorerie sans double comptage. |
| AC17 | Modifier la date estimée d'encaissement ne modifie ni l'échéance contractuelle ni le règlement réel. |
| AC18 | Une publication client ne contient aucun montant interne, commentaire privé ou identifiant source non autorisé, y compris dans le PDF. |
| AC19 | Publier ne marque pas « approuvé » ; l'accord est rattaché à une version et une preuve. |
| AC20 | Des activités en m³ et tonnes ne sont jamais additionnées ; l'agrégat requiert une pondération documentée. |
| AC21 | Une erreur API n'affiche pas « 0 activité » ; Réessayer conserve chantier et filtres. |
| AC22 | Même édition accessible au clavier et par formulaire que par glisser-déposer ; focus restitué après fermeture. |
| AC23 | À 390 px, Ma semaine est exploitable en liste ; les contrôles essentiels ne débordent pas de l'écran. |
| AC24 | Les filtres client/recherche ne changent pas les calculs de marge ou d'avancement global de la source. |
| AC25 | Migration : IDs, allocations et dates visibles historiques inchangés avant recalcul explicitement accepté. |
| AC26 | Un événement source reçu deux fois n'ajoute pas deux paiements ni deux déclarations de quantité. |
| AC27 | Les dates de début et fin, durée et prédécesseurs sont lisibles directement dans la vue Exécution, sans ouvrir chaque activité. |
| AC28 | Une activité avec deux prédécesseurs expose les deux relations et leurs décalages ; le détail montre les noms et successeurs. |
| AC29 | Liaisons logiques affiche/masque les flèches sans modifier les relations ; une liaison DD relie les débuts, une FD la fin au début. |
| AC30 | Chemin critique colore activités et liens concernés, expose marges, cible et fraîcheur du calcul ; un conflit de ressource seul ne suffit pas. |
| AC31 | Une vue filtrée conserve la criticité calculée sur le réseau complet et signale les prédécesseurs masqués ; un calcul périmé n'est pas présenté comme actuel. |

## 16. Objectifs de qualité proposés

Cibles à mesurer pendant le pilote : première vue utilisable en moins de 2 s au p95 pour 1 000 activités sur poste/réseau de référence à définir ; simulation en moins de 3 s au p95 pour 1 000 activités/3 000 liens ; interactions de filtre locales sans gel visible. Ce sont des objectifs, pas des résultats de benchmark.

Ne charger ni tous les détails ni tous les chantiers pour ouvrir un chantier. Virtualiser les lignes. Afficher état/progression pour les gros exports. Requêtes annulables ou réponses ignorées si le contexte a changé.

Mesurer aussi l'usage : temps pour préparer une semaine, nombre de ressaisies, temps pour produire un document client, conflits détectés avant validation, erreurs de compréhension entre réel/prévu/référence. Fixer les seuils métier après observation des utilisateurs pilotes.

## 17. Livraison et priorités

| Lot | Contenu | Dépendances / sortie |
|---|---|---|
| L1 — Fondations | Formes/natures, modèle de durée, calendrier, droits, migration, erreurs, vues sauvegardées | Conventions métier tranchées ; historique préservé. |
| L2 — Exécution fiable | Gantt/table, dépendances, simulation, marges, versions courantes et référence | L1 + moteur serveur vérifié. |
| L3 — Semaine et ressources | Créneaux, disponibilités, conflits, préparation/validation, reliquats | L1/L2 + réutilisation affectations/RH/parc. |
| L4 — Client | Sélection, aperçu, publication figée, export, preuve d'accord | L2 + règles de confidentialité. |
| L5 — Financier | Sources situations/règlements, échéances, prévisions/solde, trésorerie | Contrats marchés/finance validés ; jamais de double saisie du réel. |
| L6 — Assistance | Explication et propositions IA, portefeuille enrichi, rendement | Sources fiables et autorisations testées. |

Première version métier complète visée : L1 à L5, déployés progressivement sur chantier pilote. Différer nivellement automatique des ressources, optimisation probabiliste, scénarios multiples lourds, portail externe et parité d'import/export XER/MSP. Ne pas annoncer ces compatibilités sans essais ni décision de bibliothèque/licence.

## 18. Maquette et portée

Ouvrir `prototype.html` dans un navigateur. Maquette autonome, données fictives, sans API ni écriture ERP. Elle sert à discuter l'organisation et les parcours, pas à démontrer un moteur d'ordonnancement.

Parcours matérialisés : navigation des six vues ; sélection/détail d'activité ; filtrage et sauvegarde de vues ; dates/durée/prédécesseurs/marge dans le tableau ; flèches de dépendance ; activation du chemin critique illustratif ; détail des relations ; comparaison référence ; simulation illustrative puis application locale ; préparation d'un créneau depuis une activité existante ; calendrier et exception ; aperçu/publication client locale figée ; échéancier et détail financier ; conflit de ressources.

La réinitialisation de la page rétablit les données d'exemple. La maquette ne simule pas les permissions réelles, la réservation transactionnelle, le PDF final, les événements ERP, le multilingue ni le calcul complet FD/DD/FF/DF. Les comportements illustratifs sont signalés dans l'interface.

## 19. Décisions à prendre à la prochaine séance

| ID | Question | Proposition pour commencer |
|---|---|---|
| A01 | Qui valide une semaine et peut-il valider sa propre préparation ? | Conducteur ou supérieur du périmètre ; auto-approbation à décider explicitement. |
| A02 | Qui autorise un report sur la semaine suivante ? | Chef propose ; conducteur valide si impact dates/ressources ou semaine déjà approuvée. |
| A03 | Qui publie et enregistre l'accord client ? | DT/DG ou délégation explicite avec preuve. |
| A04 | Le calendrier peut-il varier selon une activité ? | Oui — demandé explicitement : bouton chantier et bouton dans chaque activité. Héritage par défaut, calendrier spécifique facultatif, retour à l’héritage. Délégations et approbations métier restent à préciser. |
| A05 | Comment compter les jours et les nuits avec changement de fuseau ? | Minutes réelles pour capacité, affichage local ; jour ouvré équivalent explicite. |
| A06 | Quelle pondération pour l'avancement global ? | Heures prévues si fiables, sinon poids métier approuvés ; pas de moyenne silencieuse. |
| A07 | Quelle base monétaire dans la trésorerie ? | Net à encaisser/décaisser issu des sources ; préciser taxes, retenues et devises par marché. |
| A08 | Faut-il saisir les personnes ou uniquement l'équipe dans Ma semaine ? | Équipe + capacité en premier, détail nominatif lorsque nécessaire au contrôle. |
| A09 | Quel comportement en surcharge ? | Brouillon autorisé avec alerte, validation bloquée pour les conflits fermes. |

## 20. Références externes de principe

Les versions de référence sont une pratique déjà présente dans [Microsoft Project](https://support.microsoft.com/en-us/project/create-or-update-a-baseline-or-an-interim-plan-in-project-desktop) et [Primavera P6](https://www.oracle.com/construction-engineering/primavera-p6/). Ces références soutiennent le choix de conserver une comparaison approuvée ; elles ne servent pas à prétendre que les concurrents n'ont pas les autres fonctions proposées.
