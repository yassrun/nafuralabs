# Beauty Mobile App

Application mobile de réservation de services de beauté inspirée de la structure Layali.

## Features

### Pour les Clients 👩‍🦰
- ✅ Découverte de salons de beauté
- ✅ Visualisation des services et tarifs
- ✅ Réservation en ligne avec sélection de créneau
- ✅ Historique des réservations
- ✅ Système de fidélité (points)
- ✅ Avis clients

### Pour les Propriétaires 💼
- ✅ Connexion manager
- ✅ Dashboard avec statistiques
- ✅ Gestion des réservations
- ✅ Gestion du staff/équipe
- ✅ Gestion des services
- ✅ Gestion des avis clients

## Structure du Projet

```
products/layali/mobile/
├── src/
│   ├── App.tsx              # Composant principal avec navigation
│   ├── App.css              # Styles de l'app
│   ├── ManagerScreens.tsx   # Écrans manager/propriétaire
│   ├── prototypeData.ts     # Données mockées
│   ├── main.tsx             # Point d'entrée React
│   ├── index.css            # Styles globaux
│   ├── brand/
│   │   └── tokens.css       # Variables de design (couleurs, typo)
│   ├── assets/              # Images et ressources
│   └── public/              # Fichiers statiques
├── package.json             # Dépendances et scripts
├── vite.config.ts           # Configuration Vite
├── tsconfig.json            # Configuration TypeScript
└── index.html               # Point d'entrée HTML
```

## Dépendances

- **React 19** - UI Framework
- **Ionic React 8** - Composants mobiles
- **React Router 7** - Navigation
- **TypeScript 6** - Type safety
- **Vite 8** - Build tool
- **ESLint 10** - Linting

## Installation

```bash
cd products/beauty/mobile
npm install
```

## Démarrage

### Développement
```bash
npm run dev
```
L'app s'ouvre sur `http://localhost:5173`

### Build Production
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

## Données Mockées

Les données mockées incluent:
- **Salons**: 3 salons avec services, staff, horaires
- **Services**: Coiffure, Esthétique, Ongles, Hammam, Barbier
- **Réservations**: Historique de réservations clients
- **Avis**: Avis clients sur les salons
- **Profils**: Client et propriétaire de salon

Tous les tests se font avec des données stockées dans `src/prototypeData.ts`.

## Authentification

### Client
- Pas d'authentification requise (mode démo)
- Accès direct aux fonctionnalités

### Manager/Propriétaire
- Email: `fatima@silhouettebeauty.ma`
- Mot de passe: `demo123` (n'importe quel mot de passe accepté)

## Personnalisation

### Couleurs et Thème
Modifiez `src/brand/tokens.css` pour ajuster:
- Couleurs primaires/secondaires
- Typo
- Espacements

### Ajouter des Salons
1. Éditez `src/prototypeData.ts`
2. Ajoutez un nouvel objet à `allSalons`
3. Les services et staff sont liés aux salons

### Ajouter des Réservations
1. Modifiez `mockManagerBookings` ou `mockCustomerBookings` dans `prototypeData.ts`
2. Les dates doivent être au format ISO (`YYYY-MM-DD`)

## Prochaines Étapes

- Intégration backend API
- Authentification réelle (JWT)
- Push notifications (SMS/Email)
- Géolocalisation et filtrage par distance
- Paiement en ligne
- Synchronisation en temps réel

## Développement

### Architecture
- **App.tsx** gère la navigation d'état
- **ManagerScreens.tsx** exporte les composants manager
- **prototypeData.ts** centralise les types et données mockées
- Les écrans sont des composants React purs

### Ajouter une Nouvelle Fonctionnalité
1. Définir le type dans `prototypeData.ts`
2. Créer le composant Screen
3. Ajouter la navigation dans `App.tsx`
4. Ajouter les données mockées

## License

Proprietary - © DIVER Booking Platform
