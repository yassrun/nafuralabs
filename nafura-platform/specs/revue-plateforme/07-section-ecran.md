# 07 — Section d'écran dans une fiche ou une liste

> Revue 2026-10-07, axe extensibilité (web). Taille **M** (front). Aucune dépendance. Utilisée par [02](02-fiche-unique.md).

## Objectif

Un BC peut insérer un bloc qu'il code lui-même (HTML, graphique, arbre, synthèse) **dans** une fiche ou au-dessus d'une liste, sans prendre l'écran entier. Le bloc respecte les mêmes règles qu'un écran spécifique : déclaré, construit avec `screen-kit`, contrôlé par le garde-fou.

## Besoin

- `RecordSection.kind` est fermé : `fields`, `attachments`, `comments`, `audit`, plus `listing`.
- L'écran spécifique (`spec.screens` + `ScreenPageComponent`) est une page à part. Exemple : la synthèse fournisseur du BC démo s'ouvre **depuis** la fiche, pas **dans** la fiche.
- Il n'y a donc pas de solution intermédiaire. Pour ajouter un graphique dans l'onglet d'une fiche, il faudrait réécrire toute la fiche.
- Besoins connus :
  - arbre du bordereau dans la fiche d'une étude (Sektor) ;
  - choix des permissions d'un rôle ([02](02-fiche-unique.md)) ;
  - indicateurs en tête d'une liste (montant engagé, nombre en retard) ;
  - historique de prix d'un article.

## Existant

- `platform/record/record-page.types.ts` : `RecordSection`, `RecordLayout` (`sections`, `tabs`, `steps`).
- `platform/record/record-page.component.ts` : `sectionView()` construit l'affichage de chaque section.
- `platform/screen/` : `ScreenPageComponent`, `ScreenState`.
- `platform/screen-kit/index.ts` : la façade autorisée aux écrans de BC.
- `bc.manifest.json` → `spec.screens: [{ id, label, reason }]` ; dossier `bcs/<bc>/web/screens/<id>/` ; contrôlé par `architecture:check`.
- `platform/listing/listing-page.types.ts` : `ListingPageConfig`, sans emplacement libre.

## Contrat

### Lot 1 — Déclaration

- `spec.screens[]` gagne `placement` : `"page"` (défaut, comportement actuel), `"section"` (dans une fiche) ou `"listing-header"` (au-dessus d'une liste). Un même écran peut déclarer plusieurs placements.
- Le schéma `bc.manifest.schema.json` est mis à jour ; la `reason` reste obligatoire.

### Lot 2 — Section de fiche

```ts
// RecordSection
kind?: 'fields' | 'attachments' | 'comments' | 'audit' | 'screen';
/** `kind: 'screen'` : composant d'un écran déclaré avec placement "section". */
screen?: Type<unknown>;
/** Montrée seulement quand le record est enregistré (défaut true). */
requiresSaved?: boolean;
```

- Le composant reçoit par injection un `RecordSectionContext` (fourni par `nf-record-page`) :
  - `record: Signal<Row>` : le record **tel qu'à l'écran**, brouillon compris ;
  - `saved: Signal<Row | null>` : le dernier état enregistré ;
  - `editable: Signal<boolean>` ;
  - `patch(values: Partial<Row>)` : modifie le brouillon (la barre d'enregistrement apparaît, Ctrl+S enregistre) ;
  - `reload()` : relit le record après une action du composant.
- La plateforme fournit le cadre de la section (titre, description, carte), l'état de chargement et l'erreur. Le composant ne dessine que le corps.
- Le composant est chargé à la demande (`loadComponent`) pour ne pas alourdir la fiche.

### Lot 3 — En-tête de liste

```ts
// ListingPageConfig
header?: Type<unknown>;
```

- Le composant reçoit un `ListingHeaderContext` :
  - `filter: Signal<RecordFilter>` : le filtre effectif, vue + filtres rapides + filtres libres ;
  - `q: Signal<string>` ;
  - `aggregate(spec)` : appelle `/aggregate` avec le même filtre.
- Il s'affiche entre la barre d'outils et les lignes, quelle que soit la vue.

### Lot 4 — Garde-fou

`architecture:check` :
- refuse `kind: 'screen'` ou `header` qui pointe un composant non déclaré, ou déclaré sans le `placement` correspondant ;
- applique aux sections les règles des écrans : pas d'import de `lib/anatomy`, pas de SCSS, pas de couleur hexadécimale ;
- affiche le nombre de sections et d'en-têtes par BC, à côté du nombre d'écrans.

### Lot 5 — Démo

- Fiche fournisseur : la synthèse (`supplier-overview`) devient aussi une section de l'onglet « Synthèse ».
- Liste des demandes d'achat : en-tête avec montant total et nombre de demandes en retard sur le filtre courant.

## Règles

- Mêmes conditions que l'écran spécifique (UI.md) : manque réel, un seul BC concerné ; dès qu'un second BC a le même besoin, il remonte dans l'archétype.
- `patch` passe par le brouillon de la fiche : pas d'appel `PUT` direct depuis la section (sinon il y a deux sources de vérité).
- La section n'a pas accès à la configuration de la fiche ni aux autres sections.

## Vérification

1. `node platform-host/ops/run.mjs check`.
2. Lab : fiche fournisseur, onglet Synthèse ; modifier un champ dans la section (si elle en offre un) : la barre d'enregistrement apparaît. Liste des demandes : l'en-tête suit les filtres.
3. Le garde-fou refuse une section non déclarée (essai temporaire).
4. Largeur mobile.

## Critères d'acceptation

- [ ] `kind: 'screen'` et `ListingPageConfig.header` sont livrés, avec leurs contextes.
- [ ] `placement` est dans le schéma et contrôlé.
- [ ] Le BC démo exerce les deux.
- [ ] Le composant est chargé à la demande (chunk séparé visible dans le build).

## Documentation

- `docs/UI.md` § Écran spécifique d'un BC : les trois placements, les contextes, les règles.
- `docs/UI.md` § Choisir l'archétype : lignes « Bloc propre dans une fiche » et « Indicateurs au-dessus d'une liste ».
- `docs/PLATFORM.md` § Manifestes : `screens[].placement`.
