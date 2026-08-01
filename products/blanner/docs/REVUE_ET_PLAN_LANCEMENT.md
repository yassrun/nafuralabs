# Blanner — revue produit et plan de mise en marché

> **Date** : 01/08/2026 · **Branche** : `Lastone` · **Commit de référence** : `9711836`
> **Périmètre** : `products/blanner/blanner_flutter` (91 fichiers Dart) et `products/blanner/blanner-backend` (~100 fichiers Java)
> **Méthode** : lecture du code, `docs/NAFORA_CURRENT_STATE.md`, `docs/cockpit/`, données ANRT 2024-2025 et Bank Al-Maghrib S1 2026

---

## Sommaire

1. [Verdict](#1-verdict)
2. [Application Flutter](#2-application-flutter)
3. [Backend Spring Boot](#3-backend-spring-boot)
4. [Design et UX](#4-design-et-ux)
5. [Positionnement marché](#5-positionnement-marché)
6. [Plan de finalisation](#6-plan-de-finalisation)
7. [Actions immédiates](#7-actions-immédiates)

---

## 1. Verdict

| Indicateur | Valeur |
|---|---|
| Chemin parcouru vers un lancement public | **~35 %** |
| Endpoints client couverts par le backend | **11 / 11** |
| Lignes d'authentification, côté app comme serveur | **0** |
| Charge estimée à temps plein | **~4 mois** |

### Le backend existe, et il est meilleur que prévu

Retrouvé sur `Lastone` : une application Spring Boot structurée sous `com.blanner`, avec dix
entités JPA, onze changelogs Liquibase en mode `ddl-auto: validate`, une séparation entité / DTO /
mapper propre, la pagination gérée côté serveur et une documentation OpenAPI. Les onze endpoints
appelés par le client Flutter existent tous et correspondent au contrat attendu.

Cela supprime le risque majeur du diagnostic initial et fait passer l'estimation de cinq mois à
environ quatre. Le chantier n'est plus « construire un produit » mais « sécuriser, compléter et
déployer un produit qui tourne déjà ».

### Le nouveau blocage numéro un : il n'y a aucune sécurité

`SecurityConfig` déclare `anyRequest().permitAll()` avec le commentaire *« Allow all requests for
testing »*, la protection CSRF désactivée et `@CrossOrigin(origins = "*")` sur chaque contrôleur.
Comme l'identité de l'utilisateur transite en paramètre `userId`, n'importe qui peut lire, créer
ou modifier au nom de n'importe qui. Les identifiants de la base sont par ailleurs en clair dans
`application.yml`, désormais committé. En l'état, ce service ne peut pas être exposé sur Internet
une seule minute.

### Préparation par domaine

| Domaine | Avant découverte du backend | Après |
|---|---:|---:|
| Parcours cœur (feed / créer / rejoindre) | 55 % | **60 %** |
| Backend et modèle de données | 0 % | **55 %** |
| Design system | 55 % | 55 % |
| Localisation FR / AR / darija | 25 % | 25 % |
| Conformité stores (bundle, icônes) | 15 % | 15 % |
| Infra, déploiement, analytics | 0 % | **10 %** |
| Messagerie et notifications | 5 % | 5 % |
| Authentification et comptes | 5 % | 5 % |
| Trust & Safety / modération | 0 % | 0 % |
| Go-to-market | 0 % | 0 % |

*Appréciation qualitative issue de la lecture du code, pas une mesure instrumentée.*

---

## 2. Application Flutter

Avec le backend lancé en local sur le port 8080 et un émulateur Android, un parcours complet
existe. Il s'arrête net dès qu'on sort du chemin balisé.

| Fonction | État | Ce qui manque concrètement |
|---|---|---|
| Splash et chargement des catégories | Partiel | Erreur API masquée derrière un spinner, timeout brut de 5 s, pas de restauration de session |
| Connexion | **Factice** | Deux boutons « Alex Johnson » et « Sarah Martinez ». Aucun OTP, aucun jeton, aucune persistance, aucune inscription, aucune déconnexion |
| Feed d'exploration | Fonctionnel | Recherche en TODO, pagination codée côté provider mais jamais appelée, géolocalisation jamais transmise alors que le serveur accepte `lat` et `lng`, premier BLAN affiché deux fois |
| Créer un BLAN (4 étapes) | Fonctionnel | La partie la plus aboutie, branchée sur Google Places via le serveur. Mais quartiers de San Francisco codés en dur et coordonnées à `0.0` en mode zone |
| Rejoindre un BLAN | Partiel | L'envoi de la demande passe par l'API, mais aucun écran de détail et aucune annulation possible |
| Mes BLANs | Partiel | Les trois listes viennent du serveur, mais accepter ou refuser une demande est un `Future.delayed(300ms)` sur des données Alice et Bob en dur — et il n'existe aucun endpoint serveur pour le faire |
| Détail d'un BLAN et chat | **Cassé** | `Navigator.pushNamed('/blan-details')` et `'/blan-chat'` pointent vers des routes absentes du routeur : erreur au tap |
| Messagerie | **Écran vide** | Une icône et « No messages yet ». Aucun provider, aucune API — et aucune table côté serveur non plus |
| Profil | Lecture seule | Ni édition, ni photo, ni déconnexion, ni réglages, ni choix de langue, alors que `UserController` expose de quoi le faire |

### Dette visible dans le code

- **~15 fichiers morts, ~2 500 lignes.** Une migration v1 vers v2 inachevée laisse cohabiter
  `my_blans_page` et `my_blans_page_v2`, `compact_blan_card` et sa v2, `step_time_location`,
  `step_location_options` et `step_location_time`.
- **Un fichier de 913 lignes.** `step_location_time.dart` concentre l'UI date, heure, trois modes
  de lieu, les sélecteurs, la validation et le défilement.
- **Un seul test.** `test/widget_test.dart` contient `expect(true, isTrue)`.
- **README obsolète.** Il décrit une authentification Firebase et un dossier `features/auth/` qui
  n'existent ni l'un ni l'autre — aucune dépendance Firebase dans `pubspec.yaml`.
- **14 TODO** répartis dans le code.

### Configuration réseau non paramétrable

`ApiConfig.baseUrl` est une constante pointant sur `http://10.0.2.2:8080/api`, l'adresse de boucle
de l'émulateur Android. Les URL du simulateur iOS et de l'appareil physique sont en commentaire, à
décommenter à la main. Il n'y a ni `--dart-define`, ni flavors, ni fichier d'environnement :
produire un binaire de recette ou de production impose aujourd'hui de modifier le code source.
C'est une demi-journée de travail, mais c'est un prérequis absolu à toute distribution.

---

## 3. Backend Spring Boot

Situé dans `products/blanner/blanner-backend`, committé le 01/08/2026.

### Ce qui est bien fait

- **Discipline de migration.** Onze changelogs Liquibase numérotés, du schéma aux catégories
  initiales, avec Hibernate en `ddl-auto: validate`. C'est le bon réflexe et c'est rare à ce stade.
- **Modèle riche.** Dix entités — `Blan`, `BlanLocation`, `BlanTime`, `User`, `Participation`,
  `Reaction`, `Comment`, `Place`, `PlaceType`, `Category` — et quatorze énumérations métier.
- **Architecture lisible.** Séparation entité / DTO / mapper, pagination Spring côté serveur,
  OpenAPI et Swagger exposés, validation Jakarta sur les corps de requête.
- **Google Places passe par le serveur.** La clé d'API est lue depuis `GOOGLE_PLACES_API_KEY` et
  ne descend jamais dans l'application mobile. C'est le bon choix, et il est trop souvent raté.

### Correspondance avec le client

`BlanController` expose exactement ce que le client appelle : `/api/blans/feed`, `/created`,
`/participating`, `/requests`, la création, puis `/{id}/like` et `/{id}/save`. Mêmes paramètres,
même pagination. `CategoryController`, `PlacesController` et `ParticipationController` couvrent le
reste. Les onze endpoints du client ont bien une contrepartie serveur.

> **Réserve** : la correspondance exacte des valeurs d'énumération entre le JSON envoyé par Flutter
> et les enums Java n'a pas été vérifiée ligne à ligne. C'est la première chose à tester, car un
> écart y produit des erreurs 400 silencieuses.

### Problèmes relevés

| Problème | Où | Conséquence |
|---|---|---|
| Aucune authentification, tout est ouvert | `SecurityConfig.java` | `anyRequest().permitAll()`, CSRF désactivé, CORS en `*`. Combiné au `userId` passé en paramètre, c'est une usurpation d'identité triviale sur tous les endpoints |
| Identifiants de base en clair et committés | `application.yml` | `blanner_user` / `blanner_password` en dur dans le dépôt. À sortir vers Vault, déjà en place pour les autres produits |
| Like et save ne connaissent pas l'utilisateur | `BlanController.toggleLike` / `toggleSave` | Les deux méthodes ne prennent qu'un `@PathVariable UUID id`, sans `userId`. Le `userLiked` renvoyé au client ne peut donc pas être propre à chaque utilisateur |
| Accepter ou refuser une demande n'existe pas | `ParticipationController.java` | Le contrôleur n'expose que la création. L'organisateur ne peut pas gérer son groupe — d'où le mock côté Flutter |
| Aucune table de messages | Schéma Liquibase | Il y a une entité `Comment`, mais aucune conversation ni message. Le chat est à construire des deux côtés |
| Aucune modération ni signalement | Schéma Liquibase | Ni signalement, ni blocage, ni suspension, ni journal. Indispensable pour une app qui fait se rencontrer des inconnus |
| Deux tests seulement | `src/test/java` | `CategoryServiceTest` et `PlacesServiceTest`. Rien sur les blans, les participations ni les réactions |

### L'intégration au monorepo n'est pas faite

Le commit s'appelle « integrate product into monorepo », mais le `settings.gradle.kts` à la racine
ne contient aucune entrée `blanner` : le backend reste un build Gradle autonome, invisible du
graphe du monorepo. Il n'y a pas non plus de `Dockerfile`, pas de dossier `deploy/k8s`, et Blanner
n'apparaît pas dans la matrice d'applications de `nlops.sh`. Le code est versionné au bon endroit,
mais rien n'est encore déployable — à comparer avec `products/sektor-btp/` qui dispose de son
Dockerfile, de ses bases et de ses overlays staging et production.

---

## 4. Design et UX

Les jetons existent et sont majoritairement respectés — c'est mieux que la plupart des MVP. Ce qui
manque, c'est la couche au-dessus : les composants métier et les états.

### Ce qui est en place

- Palette cohérente autour d'un violet `#5D5FEF`, secondaire rose `#FF8FA3`, accent turquoise
  `#00B8A9`, plus les tons sémantiques succès, avertissement et erreur.
- Échelle typographique complète en Plus Jakarta Sans, avec Playfair Display réservé au logo.
  Échelles d'espacement (4 à 32) et de rayons (8, 16, 28).
- Material 3, thème centralisé, sept composants réutilisables.
- Les neuf illustrations de catégories sont de vrais visuels, pas des emplacements réservés.

### Ce qui manque

- **Aucun mode sombre.** Le thème force `Brightness.light` et l'UI lit `BlannerColors` en direct
  plutôt que `Theme.of(context)`. L'ajouter demandera une reprise complète, pas un simple ajout.
- **Aucun état désactivé, aucune élévation, aucun ton d'information.** Les bordures sont
  improvisées au cas par cas en `textSecondary.withValues(alpha: 0.2)`.
- **Environ 89 contournements de jetons** répartis sur 32 fichiers : `Colors.orange / blue / red /
  grey` pour les statuts de participation, `fontSize: 10` sur les badges,
  `BorderRadius.circular(4)` répété sept fois dans le shimmer.
- **Zéro `Semantics`** dans toute l'application. Aucune cible tactile vérifiée, aucun contraste
  audité.

### Six patrons réimplémentés au lieu d'être factorisés

Le dossier `shared/widgets/` ne contient qu'un `.gitkeep`. Chaque écran refait sa propre version.

| Patron | Implémentations | Détail |
|---|---:|---|
| Carte BLAN | 6 | `BlBlanCard`, `BlHeroCard`, `MyBlanCard`, `CompactBlanCard`, `CompactBlanCardV2`, `_ActivityBlanCard` |
| Onglets | 3 | `MyBlansTabs`, `MyBlansMainTabs`, `_ActivityFilters` |
| Puces de filtre | 3 | `BlFilterChips`, plus `FilterChip` et `ChoiceChip` dans le tunnel de création |
| État vide | 6 | Dupliqué dans chaque page et chaque onglet |
| Feuille modale | 2 | Aucun composant de design system, tout est refait sur place |
| Barre supérieure | 2 | `BlTopBar` sur le feed, `AppBar` brute ailleurs |

### Ce qui bloque une publication sur les stores

| Élément | Valeur actuelle | Impact |
|---|---|---|
| Identifiant de bundle | `com.example.blanner_app` | Rejet automatique par Apple et Google |
| Icônes d'application | Icônes Flutter par défaut | Aucune configuration `flutter_launcher_icons` |
| Écran de démarrage natif | Fond uni côté Android, image Flutter côté iOS | Aucun `flutter_native_splash` |
| Nom affiché Android | `blanner_app` | Nom technique en snake_case visible par l'utilisateur |
| Métadonnées web | Bleu Flutter `#0175C2`, « A new Flutter project. » | Aucune identité de marque |
| Description du paquet | `"A new Flutter project."` | Valeur générée par défaut jamais modifiée |

### Sur le soin apporté aux détails

Le tunnel de création est animé et travaillé : transitions entre étapes, apparition progressive du
bloc horaire, défilement automatique. Ailleurs, il n'y a ni retour haptique, ni transition
partagée, ni squelette animé — le « shimmer » est un rectangle gris fixe, sans animation. Pour une
application grand public qui doit se propager par bouche-à-oreille, ce niveau de finition ne suffit
pas.

---

## 5. Positionnement marché

### Le marché est là, la fenêtre est ouverte

| Indicateur | Valeur | Source |
|---|---|---|
| Internautes marocains | 31,5 M | ANRT, enquête TIC 2024-2025 |
| Pénétration smartphone en milieu urbain | ~100 % | ANRT |
| Portefeuilles mobiles actifs | 18 M | Bank Al-Maghrib, mi-2026 |
| Croissance des paiements mobiles | +85 % au S1 2026 | Bank Al-Maghrib |

### Contre qui Blanner se bat vraiment

Il n'y a pas de leader local sur ce créneau. Ce n'est pas une bonne nouvelle en soi : l'absence de
concurrent signifie surtout que personne n'a encore résolu le problème d'amorçage.

| Acteur | Position au Maroc | Faille exploitable |
|---|---|---|
| **WhatsApp et Instagram** | Le concurrent réel. C'est là que se décident la quasi-totalité des sorties aujourd'hui | Ne permet de sortir qu'avec les gens déjà connus, et l'organisation se perd dans le fil de discussion |
| Facebook Events | Encore utilisé pour les événements publics et les commerces | Orienté événement de masse, aucune notion de petit groupe, audience vieillissante |
| Meetup | Présent à Casablanca, mais niche expatriés, entrepreneurs et échange linguistique | Anglophone, payant pour l'organisateur, culturellement décalé, très faible densité |
| Applications de rencontre | Forte adoption, mais usage discret et socialement stigmatisé | Intention explicitement romantique — exactement le positionnement à ne pas occuper |
| Partybloom, Timeleft, Tibly | Équivalents européens, aucune présence marocaine | Peuvent débarquer, mais ne comprendront ni la darija ni les codes sociaux locaux |

### ⚠️ Le risque de positionnement est écrit dans le code, des deux côtés

Trois choix produit se combinent de façon dangereuse, et ils sont confirmés côté serveur par les
énumérations `GroupSize`, `GenderPreference` et `BillPolicy` :

- La taille de groupe propose `PLUS_ONE`, libellé *« Just me and you (2 people) »*.
- La préférence de genre propose `MALE_ONLY` et `FEMALE_ONLY`.
- La politique d'addition propose *« I invite »* et *« Be invited »*.

Mis bout à bout, cela décrit **un tête-à-tête entre inconnus, filtré par genre, où l'un paie pour
l'autre**. Au Maroc, ce n'est pas une application de sorties : c'est lu immédiatement comme une
application de rencontre transactionnelle. Les conséquences s'enchaînent — les femmes ne
s'inscrivent pas, l'app se déséquilibre, la recommandation en famille devient impossible, la presse
s'en empare, et l'exposition réglementaire augmente.

**C'est l'arbitrage le plus important de tout ce document.** Il coûte deux jours de travail
produit, plus une migration Liquibase — pas deux mois.

#### Option A — sortir et élargir son cercle *(recommandé)*

Groupes de trois personnes minimum par défaut. L'activité passe avant les personnes. Pas de filtre
de genre public. Pas de « je t'invite ». Vérification du numéro obligatoire.

Marché adressable large, socialement acceptable, recommandable en famille, monétisable par les
lieux. C'est aussi le seul positionnement compatible avec une croissance par bouche-à-oreille.

#### Option B — assumer le tête-à-tête

C'est alors une application de rencontre. Il faut la construire comme telle : modération lourde et
permanente, vérification par selfie, abonnement payant, acquisition payante, communication
maîtrisée. Marché plus étroit, coût de modération bien supérieur, risque social et réglementaire
plus élevé — face à une concurrence internationale déjà installée et très bien financée.

### La proposition de valeur à défendre

> **« Chno l-blan ? » — la réponse, en trois taps.**

Le nom est le meilleur actif du projet. *Blan* est un mot utilisé tous les jours, dans toutes les
classes sociales, sans traduction. Aucune application internationale ne pourra le revendiquer.

Or le produit ne tient pas cette promesse : l'interface est en anglais sauf le tunnel de création,
les utilisateurs de démonstration habitent San Francisco, les quartiers proposés sont Downtown et
Midtown. Seuls les fichiers de traduction française mentionnent Maarif et Gauthier. L'écart entre
l'actif de marque et le produit livré est aujourd'hui total.

### Amorçage : viser étroit, pas large

Le risque mortel d'une application de sorties est un feed vide. La densité locale prime sur la
couverture nationale. Les onze catégories actuelles sont un piège : elles diluent le peu de
liquidité disponible.

| Dimension | À l'ouverture | Plutôt que |
|---|---|---|
| Ville | Casablanca uniquement | Maroc entier |
| Quartiers | Maarif, Gauthier, Racine | Toute la ville |
| Catégories | Café / coworking et sport | Onze catégories |
| Âge | 18 à 30 ans | Grand public |
| Langue | Darija en caractères latins d'abord, puis français et arabe | Anglais |
| Amorçage | 200 à 300 membres recrutés à la main | Acquisition payante |

### Monétisation, dans l'ordre

La disposition à payer du consommateur marocain sur une app sociale est proche de zéro. La valeur
est capturable du côté de l'offre : cafés, terrains de padel, salles de sport et espaces de
coworking ont un vrai problème de remplissage en semaine.

| Phase | Levier | Pourquoi cet ordre |
|---|---|---|
| 1 — Zéro monétisation | Gratuit, sans publicité | Toute friction tue la liquidité avant même qu'elle n'existe |
| 2 — Lieux partenaires | Mise en avant payante, groupes envoyés en semaine | Budget existant, valeur mesurable, contrat récurrent. L'entité `Place` existe déjà côté serveur, la brique technique est à moitié posée |
| 3 — Réservation et acompte | Maroc Pay (QR interbancaire) et cartes CMI | Padel, karting, escape game : l'acte d'achat existe déjà. Maroc Pay coûte 0,5 à 1,5 % contre 1,5 à 2,5 % pour la carte, et ne demande aucun compte bancaire |
| 4 — Abonnement | Visibilité accrue, filtres avancés, création illimitée | Ne se vend que si la densité rend l'app indispensable |

---

## 6. Plan de finalisation

### Ce que la découverte du backend change

Le plan initial consacrait quatre à six semaines au risque « backend introuvable ». Ce risque
disparaît : le cœur métier est écrit, le schéma est migré proprement et le contrat client est
respecté. La charge passe d'environ vingt-et-une à environ dix-sept semaines. En revanche, deux
chantiers deviennent plus lourds que prévu, parce qu'ils doivent désormais être menés des deux
côtés à la fois : **l'authentification et la messagerie**.

### Phase 0 — trancher, avant d'écrire une ligne *(1 semaine)*

Aucune de ces questions n'est technique.

| Décision | Options | Conséquence si elle n'est pas prise |
|---|---|---|
| **Positionnement A ou B** | Sorties de groupe · rencontre assumée | Le produit continue d'envoyer des signaux contradictoires et perd l'audience féminine. Décide aussi du sort de trois énumérations serveur |
| Intégration au monorepo | Enregistrer dans `settings.gradle.kts` et passer par `nlops` · rester autonome | Ni intégration continue, ni image Docker, ni déploiement, ni secrets Vault |
| Blanner passe-t-il de P3 à P0 ? | Oui, avec un budget · non, on gèle proprement | Le projet s'étire sur un an et se fait dépasser |

### Phase 1 — sécuriser et déployer l'existant *(4 semaines)*

- [ ] Authentification par **OTP SMS** de bout en bout — le numéro de téléphone est la seule
      identité universelle au Maroc. Table de comptes, émission et rafraîchissement de JWT côté
      Spring, écran d'inscription et session persistée côté Flutter.
- [ ] Remplacer `anyRequest().permitAll()` par une vraie chaîne de filtres, et surtout arrêter de
      lire `userId` dans la requête : l'identité doit venir du jeton, sinon l'usurpation reste
      triviale.
- [ ] Sortir les identifiants de base de `application.yml` vers Vault, qui sert déjà les autres
      produits, et restreindre le CORS aux origines réelles.
- [ ] Corriger `toggleLike` et `toggleSave`, qui ne reçoivent aucun `userId` et ne peuvent donc
      pas porter un état par utilisateur.
- [ ] Enregistrer le backend dans `settings.gradle.kts`, écrire le `Dockerfile`, les manifestes
      k8s base et les overlays staging et production, sur le modèle de `sektor-btp`.
- [ ] Configuration multi-environnements côté Flutter par `--dart-define`, avec flavors dev,
      recette et production.
- [ ] Conformité **loi 09-08** et déclaration **CNDP** : consentement, politique de
      confidentialité, suppression du compte, localisation des données.
- [ ] Intégration continue des deux côtés, et tests d'intégration sur les onze endpoints pour
      vérifier la correspondance exacte des énumérations.

### Phase 2 — compléter les parcours ouverts *(5 semaines)*

- [ ] **Messagerie de groupe par BLAN** : tables et endpoints côté serveur, puis écran et temps
      réel côté Flutter. Le fil s'ouvre à l'acceptation de la demande. C'est le cœur social et il
      n'existe aujourd'hui d'aucun côté.
- [ ] **Accepter et refuser une demande** : `ParticipationController` n'expose que la création,
      l'organisateur ne peut pas gérer son groupe.
- [ ] **Écran de détail d'un BLAN** — la brique autour de laquelle tout gravite, et la cible des
      deux routes actuellement cassées.
- [ ] Notifications push : demande reçue, demande acceptée, rappel deux heures avant, nouveau
      message.
- [ ] Recherche côté serveur, défilement infini côté client, géolocalisation réelle avec demande
      de permission — le feed accepte déjà `lat` et `lng`, le client ne les envoie jamais.
- [ ] Envoi de photos de profil et de couverture, stockage objet, édition du profil, déconnexion,
      réglages.
- [ ] Liens profonds et partage vers WhatsApp — le principal canal de croissance au Maroc.
- [ ] Supprimer les ~15 fichiers morts, découper `step_location_time.dart`, aligner le README sur
      la réalité.

### Phase 3 — confiance et sécurité *(3 semaines)*

Une condition d'existence, pas une option.

- [ ] Appliquer l'arbitrage de positionnement aux énumérations `GroupSize`, `GenderPreference` et
      `BillPolicy`, avec la migration Liquibase correspondante.
- [ ] Vérification obligatoire du numéro, badge de vérification, selfie facultatif pour un niveau
      supérieur.
- [ ] Tables et endpoints de signalement et de blocage, blocage réciproque appliqué au feed et aux
      participations.
- [ ] Back-office de modération : file d'attente, suspension, suppression, journal des actions.
- [ ] Règles de la communauté rédigées en français, arabe et darija, acceptées à l'inscription.
- [ ] Sécurité des rencontres : lieux publics recommandés par défaut, partage de position avec un
      proche, bouton d'alerte.
- [ ] Note de fiabilité après la sortie — présence confirmée plutôt que note de la personne.

### Phase 4 — marque et marché *(3 semaines, en parallèle)*

- [ ] Localiser l'intégralité de l'interface. Aujourd'hui seul le tunnel de création utilise
      `AppLocalizations` : tout le reste est de l'anglais en dur.
- [ ] Ajouter la darija en caractères latins comme langue par défaut, puis le français et l'arabe
      avec prise en charge du sens droite-à-gauche.
- [ ] Remplacer les données de démonstration américaines par du contenu casablancais réel — y
      compris le changelog des catégories initiales côté serveur : quartiers, lieux, prénoms,
      tarifs en dirhams.
- [ ] Identifiant de bundle, icônes, écran de démarrage natif, nom affiché, captures et fiches
      store.
- [ ] Analytics et suivi d'erreurs des deux côtés — aujourd'hui il n'existe aucun moyen de savoir
      ce que font les utilisateurs.
- [ ] Page d'atterrissage et présence Instagram et TikTok, en réutilisant la chaîne Next.js déjà
      en place pour les autres produits Nafura.

### Phase 5 — lancement *(4 semaines puis ouverture progressive)*

La densité avant le volume.

- [ ] Bêta fermée sur invitation, 200 à 300 personnes à Casablanca, recrutées à la main.
- [ ] Amorcer manuellement 10 à 15 BLANs par semaine sur Maarif, Gauthier et Racine — un feed vide
      est un échec définitif.
- [ ] Recruter 20 à 30 ambassadeurs sur les campus et dans les espaces de coworking, avec un
      objectif nominatif de sorties organisées.
- [ ] Signer 10 à 15 lieux partenaires avant l'ouverture publique, pour valider la monétisation de
      la phase 2 en amont.
- [ ] **Critère de passage à l'ouverture publique** : 40 % des membres participent à au moins un
      BLAN sous 14 jours, et la part de femmes dépasse 35 %.
- [ ] Ouverture à Casablanca, puis Rabat et Marrakech seulement une fois ce seuil tenu deux mois
      consécutifs.

### Charge par phase

| Phase | Plan initial | Plan révisé |
|---|---:|---:|
| P0 Décisions | 1 sem. | 1 sem. |
| P1 Fondations | 4 sem. | 4 sem. |
| P2 Complétude | 6 sem. | 5 sem. |
| P3 Confiance | 3 sem. | 3 sem. |
| P4 Marque | 3 sem. | 3 sem. |
| P5 Lancement | 4 sem. | 4 sem. |
| **Total séquentiel** | **21 sem.** *(+ 4 à 6 sem. de réécriture backend)* | **20 sem.** |
| **Total avec recouvrement P4/P5** | — | **~17 sem. ≈ 4 mois** |

### La contrainte de capacité reste entière

Le cockpit place Sektor BTP en P0 avec 70 % de l'effort go-to-market, et Blanner en P3 « park ».
Quatre mois à temps plein ne sont pas compatibles avec un effort résiduel : bouleverser un marché
n'est pas une activité de troisième priorité. Le backend retrouvé rend le projet crédible, il ne le
rend pas gratuit.

---

## 7. Actions immédiates

1. **Lancer le backend contre la base et faire tourner les onze endpoints depuis l'app**, pour
   vérifier la correspondance exacte des énumérations. C'est une demi-journée et cela valide, ou
   invalide, tout le reste du plan.
2. **Trancher le positionnement**, puis retirer `PLUS_ONE`, `MALE_ONLY`, `FEMALE_ONLY` et
   `HOST_INVITES` des deux côtés si l'option A est retenue.
3. **Sortir les identifiants de base de `application.yml`** maintenant qu'il est committé, et
   décider si Blanner mérite un vrai budget.

---

## Limites de cette revue

- Les scores de préparation sont une appréciation qualitative issue de la lecture du code, pas une
  mesure instrumentée.
- L'audit backend porte sur les contrôleurs, la configuration, le schéma Liquibase et les entités.
  L'analyse ligne à ligne des services n'a pas été menée à son terme.
- La correspondance exacte des valeurs d'énumération entre le client Flutter et les enums Java n'a
  pas été vérifiée — c'est l'action immédiate n° 1.
- Aucun test d'exécution n'a été réalisé : l'application n'a pas été lancée contre le backend.
