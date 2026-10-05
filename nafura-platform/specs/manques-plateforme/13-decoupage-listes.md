# 13 — Découpage des listes (front)

## Objectif

Découper `nf-listing-flat` et `nf-listing-page` **par responsabilité**, sans rien changer pour l'utilisateur ni pour les configurations. On garde les mêmes artefacts : aucune liste parallèle, aucun changement de `ListingPageConfig`.

## Besoin

- `lib/anatomy/components/organisms/listing-flat/listing-flat.component.ts` fait 2 371 lignes, avec template et styles dans le même fichier. Il gère à la fois : onglets de vues, recherche, filtres rapides, filtres épinglés, constructeur « + Filtre », pastilles, actions (large, compact, mobile), vues enregistrées, export, colonnes, sélection, tableau, pagination et état de la requête.
- Pour le board et le calendrier, `nf-listing-page` affiche `nf-listing-flat` avec `features.table: false`, uniquement pour récupérer sa barre d'outils. La barre d'outils est donc un composant à part entière, caché dans le tableau.
- `platform/listing/listing-page.component.ts` (775 lignes) porte l'état de toutes les dispositions : colonnes et déplacements du board, mois du calendrier, sélection et édition de l'arbre.
- Régressions déjà rencontrées :
  - des méthodes du template qui recréent des tableaux à chaque détection (filtres épinglés multiples, corrigé le 2026-10-05 avec des `computed`) ;
  - un `flat()` recalculé qui réinitialise la sélection (boucle NG0103).

## Existant

- Utilisateurs de `nf-listing-flat` (aucun ne doit changer) :
  - `platform/listing/listing-page.component.ts` ;
  - `platform/listing/legacy/legacy-listing-page.component.ts` ;
  - `lib/anatomy/components/organisms/entity-listing/entity-listing.component.ts` ;
  - `features/approvals/approvals.page.ts` ;
  - `features/administration/webhooks/webhook-detail.page.ts` ;
  - `features/administration/scheduled-jobs/scheduled-job-detail.page.ts` ;
  - `features/administration/iam/roles/role-detail/role-members-section.component.ts` ;
  - `features/user-settings/sections/security/security.section.ts`.
- API publique de `nf-listing-flat`, à conserver telle quelle :
  - entrées : `config`, `items`, `loading`, `query`, `remote`, `remoteTotal`, `resourceKey`, `lookups`, `cellTemplates`, `activeRowId`, `error` ;
  - sorties : `queryChange`, `load`, `retry`, `rowClick`, `rowDblClick`, `actionClick`, `selectionChange`, `exportClick`.
- Utilitaires déjà séparés : `listing-query.util.ts`, `listing-query-state.util.ts`, `listing-query-url.util.ts`, `listing-saved-views.adapter.ts`.
- Dispositions déjà séparées : `nf-listing-board`, `nf-listing-calendar`, `nf-listing-tree`, `nf-listing-actions`, `nf-filter-builder`, `nf-filter-chips`, `nf-data-table`.
- Tests : `platform/listing/listing-config.test.mjs` (dans `architecture:check`). Aucun test de composant sur la liste.
- Écran de référence : `platform-host/bcs/demo/web/purchase-requests.ts`. Il utilise les 4 dispositions construites, les filtres rapides, les filtres épinglés `supplierId` et `status` (`in`), le pied de tableau et une action de ligne.

## Contrat

Six lots, dans l'ordre. Chaque lot est livrable seul et vérifié seul (voir Vérification).

### Lot 1 — Templates sans calcul

- Dans les templates de `nf-listing-flat` et `nf-listing-page`, aucun appel de méthode qui crée un objet ou un tableau (`getFilterValue`, `rangePart`, `presetActive`…). Les remplacer par des `computed` indexés par clé, comme `pinnedSelectOptions` et `pinnedMultiValues`.
- Les méthodes qui renvoient une valeur primitive déjà calculée restent tolérées.

### Lot 2 — Barre d'outils séparée

- Nouveau composant **interne** `nf-listing-toolbar`, dans `lib/anatomy/components/organisms/listing-flat/toolbar/`. Il n'est pas exporté par `index.ts` et n'est pas un nouvel atome du catalogue.
- Il contient tout ce qui est au-dessus des lignes : onglets de vues, recherche, filtres rapides, filtres épinglés, « + Filtre » et pastilles, ligne d'actions (sélection, contrôles de tableau, actions responsives).
- `nf-listing-flat` le compose et garde son API publique.
- `nf-listing-page` affiche la barre d'outils seule au-dessus du board et du calendrier, à la place de `nf-listing-flat` avec `features.table: false`. Si `table: false` n'a plus d'utilisateur, l'option disparaît.

### Lot 3 — État de requête partagé

- Un `ListingQueryStore` (`@Injectable()`, sans `providedIn`), fourni dans `providers` de `nf-listing-flat`, ou de `nf-listing-page` quand la page affiche la barre d'outils seule.
- Il porte :
  - `listingQuery` ;
  - `patchQuery` et `replaceFilterGroup` ;
  - les valeurs des filtres épinglés ;
  - la synchronisation avec l'URL (`listing-query-url.util.ts`) ;
  - les vues enregistrées (`listing-saved-views.adapter.ts`).
- La barre d'outils et le tableau lisent et écrivent ce store. Les entrées et sorties `query`, `queryChange` et `load` de `nf-listing-flat` restent, branchées sur le store.

### Lot 4 — Dispositions de la page

- L'état propre à chaque disposition quitte `ListingPageComponent` pour un sous-composant **interne** de `platform/listing/` (non exporté) :
  - board : colonnes, ids en attente, déplacements, `promptId`, glisser et transitions ;
  - calendrier : mois, éléments ;
  - arbre : configuration, nœuds, sélection, édition.
- `ListingPageComponent` garde : la configuration, les propriétés, la vue active, le chargement, les actions, le pied de tableau.
- Les composants de `lib/anatomy` (`nf-listing-board`, `nf-listing-calendar`, `nf-listing-tree`) ne bougent pas.

### Lot 5 — Chargement à la demande

- Board, calendrier et arbre dans `nf-listing-page`, ainsi que la boîte d'export et les vues enregistrées dans `nf-listing-flat` : `@defer` (le board, le calendrier ou l'arbre se charge à la première ouverture de la vue).
- Vérifier dans la sortie du build que leur code part dans des chunks paresseux.

### Lot 6 — Fichiers

- Templates et styles de `nf-listing-flat` et `nf-listing-toolbar` dans des fichiers `.html` / `.scss` à côté du `.ts`, comme `nf-select`.
- Objectif indicatif : aucun `.ts` de liste au-delà d'environ 700 lignes.

## Comportement et règles

- **Aucun changement visible.** Mêmes écrans, mêmes textes, mêmes classes CSS publiques (`nf-listing-flat__*`), même URL de requête, même responsive (mobile, compact, large).
- **Règle 3 d'AGENTS.md** : les nouveaux composants sont internes à l'artefact existant. Aucun BC ni aucun écran ne les importe. `nf-listing-flat` reste « la liste » de `docs/UI.md`.
- La sélection n'est réinitialisée que par un changement de vue, de filtre ou de page. Un rechargement des options de relation ou des permissions ne la réinitialise pas.
- Un `computed` ne doit jamais dépendre de la sélection quand il alimente une configuration (risque de boucle NG0103).
- Pas d'ajout de fonctionnalité, pas de virtualisation, pas de migration des écrans legacy : ce sont d'autres chantiers de la ROADMAP.

## Vérification (à chaque lot)

1. `node.exe platform-host/ops/run.mjs check` : architecture, build web et host-tests.
2. `node.exe platform-host/ops/run.mjs lab`. Le serveur web du host ne recharge pas les fichiers de la plateforme : relancer `lab` après chaque modification.
3. Sur `/demo/purchase-requests`, vérifier :
   - les 5 onglets (Toutes, Circuit, À commander, Fournisseurs de Casablanca, Échéances) ;
   - la recherche, les 3 filtres rapides, Fournisseur et Statut (choix multiple) ;
   - « + Filtre » et le retrait d'une pastille ;
   - le tri, la pagination et le pied de tableau ;
   - l'ouverture d'une fiche et « Nouvelle demande » ;
   - le glisser du board ;
   - le changement de mois du calendrier ;
   - le rechargement de la page avec des filtres actifs (l'URL restaure l'état).
4. Mêmes vérifications rapides sur Projets (arbre), Approbations et Administration → Webhooks.
5. Largeur mobile : la barre d'outils se replie comme aujourd'hui.
6. Aucune erreur dans la console du navigateur (NG0100, NG0103, ExpressionChanged…).

## Critères d'acceptation

- [ ] Les 8 utilisateurs de `nf-listing-flat` compilent sans modification.
- [ ] Aucun appel de méthode qui crée un objet ou un tableau dans les templates de liste.
- [ ] Board et calendrier affichent la barre d'outils sans `nf-listing-flat`.
- [ ] Un seul état de requête (`ListingQueryStore`), partagé par la barre d'outils et le tableau.
- [ ] `ListingPageComponent` ne contient plus d'état propre au board, au calendrier ou à l'arbre.
- [ ] Board, calendrier, arbre, export et vues enregistrées dans des chunks paresseux.
- [ ] Le parcours de vérification passe à l'identique, sans erreur de console.

## Documentation

- `docs/UI.md`, tableau « Composants de la bibliothèque » : `nf-listing-flat` est composé de la barre d'outils et du tableau ; la barre d'outils est interne. Ajouter la règle « pas de méthode qui crée un objet dans un template de liste ».
- `ROADMAP.md` : retirer le chantier une fois livré.
- Supprimer ce fichier une fois livré (comme les vagues 1 et 2).
