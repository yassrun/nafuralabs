# Revue UX/UI & Feature Set — Layali Maroc

> **Date :** 16 juin 2026  
> **URL cible :** `http://localhost:5173/`  
> **Périmètre revu :** prototype `layali/mobile`, flow client, flow manager, specs `aispecs/apps/layali/*`  
> **Objectif :** pousser Layali vers la meilleure app marocaine de booking nightlife / social dining.

---

## Verdict Brut

Layali a un bon noyau métier : table, guest list, comptoir, ticket, paiement, QR, espace pro. C'est déjà plus précis qu'une simple app de listing de restaurants. Mais pour devenir **la référence au Maroc**, le prototype doit passer d'une démo de flow à une plateforme de confiance temps réel.

Aujourd'hui, l'app donne l'impression d'un bon concept produit, pas encore d'une app premium prête pour Casablanca, Marrakech, Rabat ou Tanger un samedi soir. Les plus gros freins sont : absence de photos réelles, filtres surtout cosmétiques, account incomplet, pro ops incomplet, pas de disponibilité temps réel, pas de vraie confiance paiement / annulation / entrée, pas de couche sociale ou WhatsApp, pas de vraie localisation marocaine multi-ville, pas de RTL arabe abouti.

Build vérifié : `npm run build` passe. Avertissements : CSS Ionic `:host-context` pendant minification et bundle principal lourd `~1.3 MB`.

---

## Notes Produit

| Axe | Note | Diagnostic |
|---|---:|---|
| Positionnement marché marocain | 7/10 | Le concept est très bon : nightlife + accès + pro. Il manque l'exécution locale qui rassure. |
| UX découverte | 6/10 | Home claire mais encore trop statique ; les filtres ne transforment pas vraiment les résultats. |
| Conversion booking | 7/10 | Stepper, acompte, timer, QR : bonnes bases. Manque confiance, règles claires, annulation, vraie disponibilité. |
| Premium / désirabilité | 4/10 | Les emojis et placeholders tuent le côté nightlife premium. Photos et vidéos sont non négociables. |
| Flow compte client | 4/10 | Profil mock, tickets séparés/absents du hub principal, pas de vrai gate auth. |
| Flow manager | 5/10 | Dashboard, résas, équipe, door existent, mais pas encore le back-office complet d'un venue. |
| Door check-in | 5/10 | Recherche et marquage arrivée corrigés dans le code, mais pas caméra, offline, anti-double-scan, compteur capacité. |
| Accessibilité / i18n | 5/10 | FR partiel, arabe déclaré mais pas produit, beaucoup de cartes cliquables non sémantiques. |
| Production readiness | 3/10 | Navigation state-only, pas de deep links, pas d'API réelle, scripts E2E à réaligner. |

---

## Ce Qui Marche Bien

### Le concept est localement pertinent

Le marché marocain a un vrai problème de découverte fiable : savoir où sortir ce soir, quelles sont les conditions d'entrée, combien ça coûte, s'il faut réserver, si la guest list est réelle, et quoi montrer à la porte. Layali attaque exactement ce problème.

### Les modes d'accès sont bien pensés

Les 4 modes `Table`, `Guest list`, `Comptoir`, `Ticket` couvrent bien les usages réels : dîner festif, club, rooftop, soirée spéciale, anniversaire, entrée payante, quota au bar.

### Le flow transactionnel a de bonnes bases

Le stepper 1/3, le récap, le timer, les méthodes de paiement `CMI` / `Stripe`, l'acompte et le QR donnent déjà une structure de conversion sérieuse.

### Le pro n'est pas oublié

Beaucoup d'apps échouent parce qu'elles ne servent que le client. Ici, l'espace manager existe : dashboard, équipe, liste résas, door check-in. C'est important, parce que le vrai produit se gagne aussi à l'entrée du club.

---

## Critiques UX/UI Priorité Haute

### 1. Pas de photos réelles = pas de désir

Une app de booking nightlife se vend d'abord par l'image : ambiance, foule, table, vue, DJ, terrasse, lumière, dress code. Les placeholders emoji (`📸`, `🎶`, `🎤`) font prototype et cassent la confiance premium.

**À faire :**
- photos 16:9 pour les lieux ;
- posters événement réels ;
- galerie détail lieu ;
- mini vidéo ou story verticale pour les spots premium ;
- badge "photos vérifiées par Layali".

### 2. Les filtres ne filtrent pas vraiment

Les chips changent souvent l'état visuel, mais ne réduisent pas réellement la liste. Pour un utilisateur pressé à 21h30, c'est frustrant.

**Filtres indispensables au Maroc :**
- ville : Casablanca, Marrakech, Rabat, Tanger, Agadir ;
- quartier : Maarif, Corniche, Gueliz, Hivernage, Agdal ;
- ce soir / demain / weekend ;
- budget : gratuit, < 300 MAD, < 1000 MAD, table premium ;
- ambiance : rooftop, club, live band, dinner show, chicha, lounge ;
- mode : guest list, table, billet, comptoir ;
- ouvert maintenant ;
- entrée femmes / couples / groupes, à formuler avec prudence et conformité.

### 3. La home ne répond pas encore à la question principale

La question utilisateur n'est pas "quels lieux existent ?" mais :

> "Où est-ce que je peux entrer ce soir, avec mon groupe, à mon budget, sans mauvaise surprise ?"

La home doit donc pousser une réponse actionnable :
- "Disponible maintenant" ;
- "Guest list confirmée avant 21h" ;
- "Table 4 pers. encore dispo" ;
- "Billet obligatoire ce soir" ;
- "Entrée possible avec QR ou téléphone".

### 4. Trop peu de confiance sur paiement, annulation, entrée

Le flow montre un acompte et un QR, mais ne répond pas assez aux peurs marocaines réelles :
- Est-ce que le lieu va honorer ma réservation ?
- Si la porte refuse, je suis remboursé ?
- Est-ce que l'acompte compte dans la consommation ?
- Puis-je modifier l'heure ou le nombre de personnes ?
- Puis-je contacter quelqu'un sur WhatsApp ?

**À ajouter dans le récap paiement :**
- politique d'arrivée ;
- politique no-show ;
- ce qui est inclus dans l'acompte ;
- délai de validation guest list ;
- bouton WhatsApp support ;
- preuve "booking confirmé par le venue".

### 5. Le compte client n'est pas encore un vrai hub "Mes accès"

Le prototype sépare mal réservations et tickets. Pour le client, ce ne sont pas deux mondes : ce sont ses accès de ce soir.

**Remplacer par :** `Mes accès`
- réservations table ;
- guest lists ;
- comptoirs ;
- tickets ;
- statut clair : en attente, confirmé, utilisé, annulé, remboursé ;
- QR plein écran ;
- bouton itinéraire ;
- bouton appeler / WhatsApp venue ;
- partage de réservation au groupe.

### 6. L'auth est encore mock / trop légère

Le profil est accessible comme si l'utilisateur était connecté. Pour une app de booking, l'identité est centrale : téléphone, OTP, email, historique, paiement, support.

**Priorité Maroc :**
- login téléphone OTP `+212` en premier ;
- email secondaire ;
- WhatsApp opt-in ;
- langue FR / AR / EN ;
- vérification 18+ claire.

---

## Critiques Flow Client

### Discovery

Le flow actuel permet d'aller Home → Lieux → Détail → Réserver. C'est logique, mais pas encore assez rapide.

**Manques :**
- recherche texte fonctionnelle ;
- tri par popularité / disponibilité / distance ;
- carte ou au moins distance quartier ;
- résultats vides utiles ;
- skeleton/loading/error states ;
- deep links publics `/venues/:slug`, `/events/:slug`.

### Détail Lieu

Bonnes infos : rating, adresse, horaires, modes d'accès, tables, comptoir, avis.

**À améliorer :**
- photos avant tout ;
- carte Google Maps ;
- dress code ;
- âge minimum ;
- parking / valet ;
- moyens de paiement acceptés ;
- politique retard ;
- prix bouteille / minimum spend expliqué ;
- "dernière confirmation du lieu il y a X min" ;
- avis vérifiés post-booking.

### Booking Table

Le choix de table existe, mais le plan n'est pas encore un vrai plan. Les tables sont des cards.

**Pour battre le marché :**
- plan visuel de salle ;
- disponibilité live ;
- hold temporaire 5-10 minutes ;
- capacité strictement validée ;
- suggestion de table selon groupe/budget ;
- extras anniversaire : gâteau, bouteille, bouquet, message DJ ;
- split acompte entre amis.

### Guest List

Le flow est utile mais doit clarifier le contrat : guest list ne veut pas dire entrée garantie dans tous les lieux.

**À ajouter :**
- délai de validation ;
- heure limite d'arrivée ;
- nombre max groupe ;
- "réponse du venue attendue avant..." ;
- notification SMS/WhatsApp ;
- alternative si refus : billet ou table disponible.

### Tickets

Le flow billet marche conceptuellement, mais il est isolé du compte et pas assez riche.

**À ajouter :**
- QR haute luminosité ;
- transfert de ticket à un ami ;
- remboursement / annulation selon policy ;
- catégorie claire : standard, VIP, early bird ;
- frais affichés avant paiement ;
- état "utilisé" après check-in.

---

## Critiques Flow Manager / Pro

### Dashboard

Les KPIs sont utiles mais trop pauvres pour un owner marocain.

**KPIs nécessaires :**
- CA ce soir ;
- acompte encaissé ;
- billets vendus ;
- tables confirmées / arrivées / no-show ;
- capacité restante ;
- guest list pending ;
- top channels : app, WhatsApp, promoteur, walk-in ;
- alertes : 90% capacité, trop de pending, scanner offline.

### Réservations Pro

La liste existe, les filtres existent, mais il manque le contrôle métier.

**À ajouter :**
- détail réservation ;
- valider/refuser guest list ;
- appeler / WhatsApp client ;
- modifier statut : arrivé, no-show, annulé ;
- remboursement manuel ;
- notes internes porte ;
- filtre par heure d'arrivée, mode d'accès, anniversaire, table, montant payé ;
- export fin de soirée.

### Door Check-in

Le prototype permet code/phone lookup et marque `ARRIVED`. C'est bien pour une démo, insuffisant pour une porte réelle.

**Non négociable :**
- scanner caméra plein écran ;
- mode offline avec queue locale ;
- anti-double-scan ;
- feedback vert/rouge en moins de 500 ms ;
- compteur entrées/capacité ;
- wake lock ;
- recherche par nom, téléphone, référence ;
- rôle `HOST` redirigé directement vers door ;
- sons distincts accept/reject.

### Back-office Venue

La spec prévoit événements, plan de salle, tickets, avis, paramètres venue. Le prototype ne couvre pas encore assez cette partie.

**À prioriser :**
- création/édition événement ;
- configuration des tables et minima ;
- quotas guest list / comptoir ;
- fermeture vente ou guest list ;
- modération avis ;
- paramètres politiques d'entrée.

---

## Feature Set Pour Gagner Le Marché Marocain

### Must-have MVP

1. Découverte multi-ville avec vrais filtres et photos.
2. Booking table / guest list / comptoir / ticket avec disponibilité fiable.
3. Paiement CMI en MAD, Stripe en fallback, reçu clair.
4. Hub `Mes accès` avec QR, statut, itinéraire, support.
5. OTP téléphone + WhatsApp support.
6. Back-office pro pour valider, scanner, suivre CA.
7. Door check-in rapide, offline, téléphone fallback.
8. i18n FR + AR RTL + EN.

### Différenciation locale forte

1. **Concierge WhatsApp Layali** : assistance humaine ou semi-automatique pour les bookings premium.
2. **Mode groupe** : partager une sortie, confirmer invités, split acompte.
3. **Anniversaire premium** : packages gâteau, bouteille, déco, message, table recommandée.
4. **Promoteurs / codes ambassadeurs** : tracking guest list et commissions.
5. **Live availability** : "3 tables restantes", "guest list ferme dans 22 min".
6. **Trust badge venue** : taux d'honneur des réservations, temps moyen de validation.
7. **Layali Tonight Score** : score interne basé sur disponibilité, hype, avis, ventes.
8. **After-booking flow** : rappel SMS, dress code, itinéraire, QR lumineux.

### V2 / Avancé

1. Marketplace offres VIP.
2. Loyalty / points Layali.
3. Wallet crédit après remboursement.
4. Waitlist automatique.
5. Dynamic pricing sur tickets.
6. Table service / précommande bouteille.
7. CRM venue : clients réguliers, VIP, anniversaires.
8. Admin plateforme : onboarding, suspension, qualité photos, litiges.

---

## Copywriting & Langue

Le produit doit parler marocain urbain, pas SaaS générique.

**À corriger :**
- accents manquants : `Réservations`, `Soirées`, `Ce soir à Casablanca`, `Réserver` ;
- contenu mock en anglais dans les descriptions et avis ;
- `Guest list` peut rester, car c'est courant, mais expliquer en français ;
- éviter le jargon `tenant`, `quota`, `fallback`, `manual`.

**Ton recommandé :**
- clair, premium, direct ;
- français par défaut ;
- arabe disponible et sérieux, pas juste une option dans le profil ;
- quelques touches locales mais pas de Darija forcée partout.

Exemples :
- `Trouver votre accès ce soir` → `Votre accès pour ce soir`
- `Guest list rapide` → `Guest list avec réponse rapide`
- `Minimum 1500 MAD` → `Minimum de consommation : 1 500 MAD`
- `A montrer a l entree` → `À présenter à l'entrée`

---

## UI / Design System

### Points positifs

La palette Majorelle + terre cuite est pertinente : premium, marocaine, pas cliché. Le fond crème est lisible en mobile, les surfaces sont cohérentes, les CTAs Ionic marchent bien.

### À améliorer

- remplacer emojis par Ionicons ou assets visuels ;
- standardiser les boutons : primaire, secondaire, danger, lien ;
- rendre les cartes cliquables accessibles via `<button>` / `<a>` ;
- ajouter focus states visibles partout ;
- renforcer contrastes des textes secondaires ;
- éviter trop de surfaces blanches similaires ;
- définir composants : `VenueCard`, `EventCard`, `AccessPassCard`, `StatusBadge`, `PriceSummary`, `TrustPanel`.

---

## Accessibilité & Inclusivité

Priorité non négociable si l'app est utilisée en sortie, dans le bruit, avec faible luminosité.

À corriger :
- cartes avec `onClick` non accessibles clavier ;
- icônes emoji sans label métier ;
- QR doit avoir mode haute luminosité ;
- scanner porte doit fonctionner en contraste fort ;
- statuts pas uniquement par couleur ;
- `prefers-reduced-motion` existe, bon point ;
- arabe RTL doit être testé avec vraie police compatible.

---

## Gaps Techniques Qui Impactent L'UX

1. Navigation en state React uniquement : pas de deep links, refresh fragile, SEO impossible.
2. Données mock : pas de loading/error/empty réalistes partout.
3. Pas de temps réel : disponibilité tables/tickets peut mentir.
4. Pas de backend auth/payment/check-in : confiance encore simulée.
5. Bundle principal lourd : risque performance mobile.
6. Scripts E2E désalignés : `manager-flow-walkthrough` attend encore un écran de choix manager supprimé ; `flow-walkthrough` a crashé côté navigateur dans l'environnement agent.
7. Build OK mais warnings CSS Ionic `:host-context` à surveiller.

---

## Roadmap Priorisée

### Sprint 1 — Confiance & Conversion (3-5 jours)

1. Ajouter vraies photos/posters.
2. Créer `Mes accès` qui unifie réservations + tickets.
3. Gate auth réel côté UI : non connecté → login OTP.
4. Corriger copy FR complète + accents.
5. Rendre les filtres réellement fonctionnels.
6. Ajouter trust panel paiement / annulation / entrée.

### Sprint 2 — Produit Marocain (1 semaine)

1. OTP téléphone `+212` et WhatsApp support.
2. Multi-ville + quartiers.
3. Détail lieu enrichi : dress code, parking, map, policies.
4. Anniversaire packages.
5. Notifications SMS/WhatsApp guest list.
6. Partage réservation au groupe.

### Sprint 3 — Pro Ops (1-2 semaines)

1. Détail réservation pro + actions.
2. Validation/refus guest list.
3. Scanner caméra fullscreen.
4. Compteur capacité + offline queue.
5. Tickets list pro + CA.
6. Paramètres venue simples : horaires, photos, politiques.

### Sprint 4 — Production Ready (2-4 semaines)

1. React Router avec URLs publiques.
2. API réelle ou mock server contractuel.
3. Paiement CMI intégré.
4. Realtime tables/tickets/check-in.
5. i18n FR/AR/EN avec RTL.
6. E2E CI à jour.
7. Monitoring erreurs et analytics funnel.

---

## Les 10 Décisions Produit À Prendre

1. Layali est-il d'abord une app nightlife premium ou social dining large ?
2. Est-ce que la guest list est garantie ou seulement une demande ?
3. Qui supporte le client si la porte refuse : Layali ou le venue ?
4. Quelle politique de remboursement standard ?
5. WhatsApp est-il un canal officiel dès V1 ?
6. Les venues peuvent-elles modifier une réservation confirmée ?
7. Le modèle économique vient-il des commissions tickets, acomptes, SaaS pro, promoteurs, ou mix ?
8. Faut-il accepter cash at door ou forcer paiement digital ?
9. Faut-il une modération stricte des photos/venues avant publication ?
10. Le lancement doit-il se concentrer sur Casablanca seulement ou Casa + Marrakech ?

---

## Conclusion

Layali peut devenir une app très forte au Maroc si elle assume une promesse simple : **réserver son accès à une bonne soirée sans stress, et donner au venue les outils pour honorer cette promesse à la porte**.

La priorité n'est pas d'ajouter beaucoup plus d'écrans. La priorité est de rendre les écrans existants crédibles : vraies photos, filtres réels, disponibilité fiable, paiement clair, QR solide, support WhatsApp, et back-office pro qui fonctionne le soir même.
