# Images de Catégories

Ce dossier contient les images associées à chaque catégorie de BLANs.

## Structure

Placez vos fichiers d'images `.png` dans ce dossier. Les noms de fichiers doivent correspondre aux catégories suivantes :

- `Cinema.png` - Pour la catégorie Culture/Cinema
- `Coffee.png` - Pour la catégorie Coffee/Café
- `Drinks  Rooftop  Lounge.png` - Pour la catégorie Party/Drinks (note: 2 espaces)
- `Food  Restaurants.png` - Pour la catégorie Food/Restaurants (note: 2 espaces)
- `Games.png` - Pour la catégorie Games
- `Gym  Fitness.png` - Pour la catégorie Sport/Fitness (note: 2 espaces)
- `Outdoor  Nature.png` - Pour la catégorie Nature/Outdoor (note: 2 espaces)
- `Party  Night Out.png` - Pour la catégorie Party Night Out (note: 2 espaces)
- `Study  Work.png` - Pour la catégorie Study/Work (note: 2 espaces)

## Mapping des Catégories

Le mapping entre les noms de catégories (depuis le backend) et les fichiers d'images est géré dans `lib/core/utils/category_image_helper.dart`.

Si vous ajoutez de nouvelles catégories ou modifiez les noms, mettez à jour le fichier `category_image_helper.dart`.

## Utilisation

Les images sont automatiquement utilisées dans :
- Les cards de BLANs (`BlBlanCard`)
- Les formulaires de création de BLAN
- Les images par défaut des catégories

Le widget `BlCachedImage` détecte automatiquement si l'image est un asset local (commence par `assets/`) ou une URL réseau.

