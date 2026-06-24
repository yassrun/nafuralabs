# Revue UX Flow — Layali Client & Manager

> Date : 23 juin 2026  
> Périmètre : prototype `layali/mobile`, specs `aispecs/apps/layali`, brief MVP `docs/briefs/layali-v1.md`  
> Objectif : identifier les améliorations UX à prioriser pour rendre Layali plus clair, plus désirable et plus exploitable côté terrain.

## Synthèse

Layali a une bonne base produit : le prototype comprend déjà les parcours essentiels de découverte, réservation de table, guest list, comptoir, ticketing, paiement, QR, dashboard manager et check-in porte. C'est bien aligné avec le besoin marocain : savoir où sortir ce soir, comprendre les conditions d'accès, réserver ou acheter un accès, puis le faire valider rapidement à l'entrée.

Le principal enjeu UX n'est plus d'ajouter des écrans, mais de transformer la démo en expérience fiable. Côté client, l'app doit inspirer plus de désir et de confiance : photos réelles, disponibilités lisibles, règles d'entrée, paiement, annulation, accès unifié. Côté manager, l'app doit devenir un outil d'opération rapide : validation guest list, recherche porte, rôles, détail réservation, tickets, disponibilité temps réel.

## Diagnostic rapide

| Axe | État actuel | Priorité UX |
|---|---|---|
| Positionnement | Nightlife / social dining bien ciblé | Renforcer le vocabulaire local et la promesse "accès ce soir" |
| Navigation | Navigation par état React, pas de vraies URLs | Ajouter deep links publics et routes pro |
| Découverte client | Home riche mais dense, filtres partiellement cosmétiques | Rendre la recherche actionnable et orientée disponibilité |
| Conversion booking | Stepper, récap, paiement, QR présents | Ajouter confiance, règles, politiques et états réels |
| Hub client | Réservations et tickets pas encore unifiés | Créer un vrai "Mes accès" |
| Manager | Dashboard, réservations, door, events, tables existent | Ajouter actions métier et détail opérationnel |
| Door check-in | QR / référence mock, recherche fallback partielle | Prioriser vitesse, caméra, téléphone, offline, anti-double scan |
| Confiance premium | Beaucoup de placeholders et emojis | Remplacer par assets réels et signaux de vérification |

## Flow Client

### 1. Entrée et authentification

**Constat**

- Le choix Client / Manager est clair.
- Le client est forcé à se connecter avant même de découvrir l'app.
- Le flow register existe mais n'est pas assez naturellement relié au login.
- Le login mock ne montre pas encore la force du téléphone OTP marocain.

**À améliorer**

- Autoriser la découverte anonyme : home, lieux, événements, détail lieu et détail événement doivent être publics.
- Demander l'auth au moment utile : paiement, confirmation, guest list review, accès au compte.
- Faire du téléphone `+212` le chemin principal, avec OTP, WhatsApp opt-in et email secondaire.
- Ajouter une vraie passerelle "Créer un compte" depuis le login.
- Préserver le retour après login : si le client se connecte depuis un paiement, il doit revenir au paiement, pas à la home.

### 2. Home et découverte

**Constat**

- La home montre beaucoup d'éléments : hero, recherche, chips, soirées, modes d'accès, venues, activité live.
- Les chips donnent parfois l'impression de filtrer sans changer les résultats.
- Le client cherche surtout une réponse simple : "où puis-je entrer ce soir avec mon groupe et mon budget ?"

**À améliorer**

- Recentrer la home sur 3 blocs :
  - recherche "Ce soir à Casablanca" ;
  - recommandations disponibles maintenant ;
  - lieux / soirées avec mode d'accès principal.
- Rendre tous les filtres réellement fonctionnels : ville, quartier, date, budget, ambiance, mode d'accès, ouvert maintenant.
- Afficher des badges orientés décision :
  - "Table 4 pers. disponible" ;
  - "Guest list réponse sous 30 min" ;
  - "Billet obligatoire ce soir" ;
  - "Entrée possible avec QR ou téléphone".
- Rendre les hero cards cliquables vers le lieu ou l'événement mis en avant.
- Ajouter des états vides utiles : "Aucun rooftop dispo ce soir, essayer demain ou élargir le quartier".

### 3. Détail lieu

**Constat**

- Le détail lieu contient les infos utiles : rating, adresse, horaires, modes d'accès, règles, tables, comptoir.
- L'expérience reste trop prototype à cause des placeholders visuels.
- Certaines règles ressemblent à de la configuration interne plutôt qu'à une promesse client.

**À améliorer**

- Mettre les photos au premier plan : hero image, galerie, poster de soirée, ambiance réelle.
- Remplacer le jargon par des bénéfices :
  - "Guest list approval: MANUAL" -> "Validation par le lieu sous 30 min" ;
  - "Door fallback: phone lookup" -> "À l'entrée, votre numéro suffit si le QR ne marche pas".
- Clarifier les règles qui évitent les mauvaises surprises : dress code, âge minimum, heure limite d'arrivée, parking / valet, moyens de paiement, retard, no-show.
- Mettre un CTA primaire contextuel selon le lieu et la soirée : table, guest list, comptoir ou billet.
- Afficher une preuve de fraîcheur : "Disponibilités confirmées il y a 8 min".

### 4. Booking table, guest list et comptoir

**Constat**

- Le prototype couvre plusieurs modes d'accès, ce qui est le bon choix produit.
- Les flows se ressemblent beaucoup alors que les attentes client sont différentes.
- Le cas anniversaire est présent mais doit devenir plus opérationnel.

**À améliorer**

- Adapter chaque flow au mode d'accès :
  - table : zone, capacité, minimum spend, acompte, politique retard ;
  - guest list : délai de validation, heure limite, groupe max, alternative si refus ;
  - comptoir : zone bar, capacité légère, règles tarifaires simples ;
  - hybride : montrer clairement si un ticket est aussi obligatoire.
- Ajouter un plan de salle simple pour les tables et zones, même schématique.
- Proposer des suggestions selon groupe / budget : "meilleure option pour 4 personnes".
- Structurer l'anniversaire : nom célébré, gâteau, sparkler, bouteille, décoration, heure d'arrivée souhaitée.
- Clarifier les états de demande : brouillon, en attente, confirmée, refusée, annulée, arrivée.

### 5. Paiement et confirmation

**Constat**

- Le stepper, le récap, le timer, le choix CMI / Stripe et le QR donnent une bonne base.
- La confiance autour du paiement et de l'entrée reste insuffisante.
- Les confirmations ne semblent pas encore alimenter un historique réel.

**À améliorer**

- Expliquer exactement ce que couvre l'acompte : entrée, table, consommation, déduction sur minimum spend.
- Afficher avant paiement : frais, conditions de remboursement, no-show, modification d'heure ou de groupe.
- Ajouter un support WhatsApp visible pendant paiement et après confirmation.
- Générer un QR plein écran avec mode haute luminosité.
- Ajouter "Ajouter au calendrier", "Itinéraire", "Partager au groupe".
- Persister la réservation ou le ticket confirmé dans "Mes accès".

### 6. Tickets

**Constat**

- Le ticketing est dans le prototype et reste cohérent avec le brief MVP.
- Le ticket est trop isolé du compte client.

**À améliorer**

- Intégrer les tickets dans le hub "Mes accès".
- Afficher catégories, frais, quantité, politique de remboursement et statut d'utilisation.
- Ajouter transfert de ticket à un ami.
- Supporter tickets utilisés, remboursés, annulés, expirés.
- Côté confirmation, diriger vers "Mes accès" plutôt que vers la liste événements.

### 7. Compte client : "Mes accès"

**Constat**

- Le client ne pense pas en "réservations" vs "tickets", il pense en accès de ce soir.
- Le hub actuel ne donne pas encore une vue complète et rassurante.

**À améliorer**

- Remplacer les vues séparées par un hub unifié :
  - tables ;
  - guest lists ;
  - comptoirs ;
  - tickets ;
  - historiques.
- Mettre le prochain accès en haut avec CTA QR plein écran.
- Ajouter filtres : à venir, en attente, utilisés, passés, annulés.
- Ajouter actions utiles : WhatsApp support, itinéraire, modifier, annuler si policy le permet, partager.
- Montrer les informations critiques sans ouvrir le détail : date, heure limite d'arrivée, mode d'accès, statut, acompte payé.

## Flow Manager

### 1. Login, rôles et tenant

**Constat**

- L'entrée manager existe et le prototype ouvre une session mock.
- La session crée toujours un owner sur Sky 31.
- Les rôles de la spec ne changent pas encore le parcours.

**À améliorer**

- Implémenter les rôles UX dès le prototype :
  - `OWNER` / `ADMIN` : configuration, équipe, events, tables, réservations ;
  - `HOST` : redirection directe vers door check-in ;
  - `BAR_MANAGER` : lecture réservations / tickets, actions limitées.
- Afficher clairement le lieu géré et prévoir le multi-venue si nécessaire.
- Ajouter les états d'accès : pas de venue, demande en attente, tenant suspendu, accès refusé.
- Ne jamais mélanger espace manager et feed client après logout ou erreur de routing.

### 2. Dashboard pro

**Constat**

- Les KPIs donnent une base utile pour ce soir.
- Le dashboard ne permet pas encore de piloter la soirée.

**À améliorer**

- Rendre les KPIs cliquables vers les listes filtrées.
- Ajouter des KPIs vraiment opérationnels :
  - CA ce soir ;
  - acomptes encaissés ;
  - billets vendus ;
  - tables confirmées / arrivées / no-show ;
  - guest lists en attente ;
  - capacité restante.
- Ajouter un bloc "Actions urgentes" : demandes pending, arrivées en retard, tables à confirmer, tickets à scanner.
- Ajouter un feed temps réel : arrivée, no-show, validation, vente ticket.
- Prévoir une vue "ce soir" très lisible en lumière faible.

### 3. Réservations pro

**Constat**

- La liste et les filtres par statut existent.
- Il manque le détail et les actions terrain les plus importantes.

**À améliorer**

- Créer un écran détail réservation.
- Rendre chaque carte réservation cliquable.
- Ajouter actions selon statut :
  - approuver / refuser une guest list ;
  - marquer arrivé ;
  - marquer no-show ;
  - annuler ;
  - modifier heure / groupe ;
  - ajouter note interne.
- Ajouter recherche par nom, téléphone, référence.
- Ajouter filtres : date, mode d'accès, occasion, statut paiement, zone/table.
- Mettre l'anniversaire en badge visible dès la liste.
- Montrer ce que le host doit savoir en 2 secondes : nom, groupe, heure, mode, statut, table/zone, paiement.

### 4. Door check-in

**Constat**

- Le prototype supporte une logique de référence / QR mock et un fallback téléphone.
- Le flow doit être beaucoup plus rapide et robuste pour la porte.

**À améliorer**

- Passer en layout fullscreen sans navigation parasite.
- Ajouter scanner caméra avec feedback immédiat : vert accepté, rouge refusé, orange déjà utilisé.
- Supporter recherche fallback par nom et téléphone.
- Prévoir anti-double-scan et statut "déjà entré à HH:mm".
- Ajouter compteur live : entrés, attendus, capacité restante.
- Ajouter mode réseau dégradé : file locale de scans à synchroniser.
- Ajouter un bouton "exception manager" pour les cas terrain.
- Optimiser touch targets et contraste pour usage de nuit.

### 5. Équipe et accès

**Constat**

- L'écran demandes d'accès équipe est l'un des plus complets.
- Il reste trop isolé dans la navigation.

**À améliorer**

- Mettre "Équipe" dans la navigation pro principale pour `OWNER` / `ADMIN`.
- Afficher qui a accès à quoi, pas seulement les demandes.
- Ajouter révocation d'accès et changement de rôle.
- Ajouter journal d'audit léger : qui a approuvé, quand, quel rôle.
- Expliquer les permissions avec des libellés humains, pas seulement `HOST`, `ADMIN`, `BAR_MANAGER`.

### 6. Events, tickets et tables

**Constat**

- Events et tables existent côté manager, mais restent local-only.
- Le ticketing manager est absent alors que le ticketing client existe.

**À améliorer**

- Ajouter une liste tickets pro : ventes, check-ins, remboursements, catégories, revenus.
- Relier events manager aux events visibles côté client.
- Ajouter un statut de publication : brouillon, publié, archivé, complet.
- Pour tables : permettre éditer, désactiver, bloquer une zone, modifier minimum spend et acompte par soirée.
- Montrer l'impact client avant publication : preview de la soirée et des règles d'accès.

## Améliorations transverses

### Navigation et architecture

- Ajouter React Router ou une structure équivalente avec URLs publiques :
  - `/venues/:slug` ;
  - `/events/:slug` ;
  - `/me/accesses` ;
  - `/pro/bookings/:id` ;
  - `/pro/door`.
- Supporter deep links, partage WhatsApp, SEO minimal pour lieux et événements.
- Ajouter un vrai comportement retour : le bouton back doit revenir à l'étape précédente, pas seulement changer d'écran.
- Masquer la bottom nav pendant les flows transactionnels : login, booking, payment, confirmation, ticket buy.

### Copywriting et localisation

- Unifier la langue principale en français pour V1, puis préparer FR / AR / EN.
- Éviter le mélange "Soirees", "Access", "Bookings", "Logout".
- Préférer le vocabulaire utilisateur :
  - "Mes accès" plutôt que "Bookings" ;
  - "Entrée validée" plutôt que "ARRIVED" ;
  - "Validation par le lieu" plutôt que "manual approval".
- Vérifier accents, sens RTL arabe, formats téléphone marocains, MAD, quartiers.

### Confiance et premium

- Remplacer les placeholders emoji par photos ou assets réalistes.
- Ajouter badges de confiance : lieu vérifié, paiement sécurisé, confirmation venue, support WhatsApp.
- Montrer politiques de remboursement / retard / no-show avant paiement.
- Ajouter avis vérifiés post-booking.
- Ne pas afficher de boutons morts dans une version test utilisateur : soit ils fonctionnent, soit ils sont masqués.

### Accessibilité

- Remplacer les cartes cliquables non sémantiques par boutons ou liens.
- Garantir des touch targets de 44px minimum.
- Ne pas utiliser la couleur seule pour les statuts.
- Ajouter `aria-live` pour succès / erreur check-in et paiement.
- Respecter `prefers-reduced-motion`.
- Tester contraste et lisibilité en mode nuit / luminosité faible.

## Roadmap UX recommandée

### P0 — Rendre le prototype testable

- Découverte anonyme jusqu'au paiement.
- Filtres réellement fonctionnels sur home / recherche / events.
- Hub client "Mes accès" unifié bookings + tickets.
- Détail réservation pro avec approve / reject guest list.
- Door check-in avec recherche téléphone / nom fiable et marquage arrivé.
- Masquer les boutons morts ou les rendre actifs.
- Corriger copy FR et libellés de navigation.

### P1 — Rendre l'expérience crédible

- Photos réelles lieux / événements.
- Règles d'entrée visibles et reformulées.
- Politiques paiement, remboursement, retard et no-show.
- Deep links publics pour lieux et événements.
- Support WhatsApp client et manager.
- KPIs manager actionnables.
- Tickets pro et statut d'utilisation.

### P2 — Rendre Layali compétitif

- Disponibilité temps réel par date / soirée.
- Plan de salle et zones visuelles.
- Transfert de ticket.
- Notifications WhatsApp / SMS.
- Offline mode door check-in.
- Multi-ville et quartiers marocains.
- FR / AR / EN complet.
- Avis vérifiés et signaux sociaux.

## Métriques à suivre

| Flow | Métrique | Pourquoi |
|---|---|---|
| Découverte | Recherche -> détail lieu | Vérifie si les résultats donnent envie |
| Détail lieu | Détail -> CTA réservation / ticket | Mesure la clarté de l'offre |
| Booking | Start -> paiement | Détecte friction de choix table / guest list |
| Paiement | Paiement -> confirmation | Mesure confiance et clarté des coûts |
| Compte | Confirmation -> QR ouvert | Vérifie si le client retrouve son accès |
| Manager | Pending guest list -> décision | Mesure efficacité opérationnelle |
| Door | Scan / recherche -> arrivé | Mesure vitesse à l'entrée |
| Support | Paiement / porte -> contact WhatsApp | Repère les moments de doute |

## Verdict

La priorité Layali doit être de rendre chaque accès compréhensible, fiable et rapide. Pour le client, cela signifie : "je sais où je peux entrer, combien ça coûte, ce que je montre à la porte et quoi faire en cas de problème". Pour le manager, cela signifie : "je vois qui arrive, qui est validé, qui a payé, quoi faire maintenant, et je peux gérer la porte sans friction".

Une V1 forte ne nécessite pas forcément beaucoup plus d'écrans. Elle nécessite surtout moins d'ambiguïté, plus de preuve, plus d'états réels, et des actions terrain qui fonctionnent vraiment.
