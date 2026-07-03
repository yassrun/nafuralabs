# Agent Brief — Réceptions UX + Socle Anatomy

## But

Implémenter les améliorations UX prioritaires du flux Réceptions et les évolutions minimales du socle `@lib/anatomy` nécessaires pour les supporter proprement, sans casser les autres pages.

Le résultat attendu n'est pas une refonte visuelle large. Il faut corriger les irritants concrets visibles sur :

- la liste des réceptions
- la fiche réception en création, édition et consultation
- la barre d'actions config-driven portée par `nf-entity-detail`

Ce document remplace le besoin de jongler entre :

- `AGENT_UX_FIXES.md`
- `AGENT_ACTION_BAR_SPEC.md`

Tu peux réutiliser leurs bonnes idées, mais la source d'arbitrage pour cette mission est ce fichier.

---

## Ancrages Code

### Feature Réceptions

- `web/app/applications/erp/pages/inventory/mouvements/receptions/reception-listing.page.ts`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/reception-listing.page.html`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/reception-listing.page.scss`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/reception-detail/reception-detail.page.ts`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/reception-detail/reception-detail.page.html`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/reception-detail/reception-detail.page.scss`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/config/detail/detail.config.ts`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/config/detail/fields.ts`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/config/detail/sections.ts`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/config/listing/listing.config.ts`
- `web/app/applications/erp/pages/inventory/mouvements/receptions/config/listing/columns.config.ts`

### Socle partagé

- `web/app/platform/lib/anatomy/types/index.ts`
- `web/app/platform/lib/anatomy/config/detail-config.builder.ts`
- `web/app/platform/lib/anatomy/components/organisms/entity-detail/entity-detail.component.ts`
- `web/app/platform/lib/anatomy/components/organisms/entity-detail/entity-detail.component.html`
- `web/app/platform/lib/anatomy/components/organisms/entity-detail/entity-detail.component.scss`

---

## Constat Actuel

### Liste Réceptions

- La liste est lisible, mais la hiérarchie des actions reste faible.
- Le CTA de création n'est pas cohérent linguistiquement dans la capture (`New` au lieu de `Nouvelle réception`).
- Les valeurs absentes utilisent `—`, ce qui masque la différence entre "non renseigné" et "inapplicable".
- Les dates visibles dans les captures ne sont pas alignées avec une locale française stable.
- La densité peut être légèrement améliorée pour un écran métier.

### Fiche Réception

- Le mode consultation ressemble encore trop à un formulaire éditable.
- Les actions de workflow et les actions CRUD ne racontent pas clairement la hiérarchie métier.
- `Scanner BL` existe mais doit être présenté comme un chemin d'entrée secondaire utile, pas comme une action perdue dans une zone technique.
- Les lignes sont au coeur du document mais l'écran donne encore beaucoup de poids à l'en-tête.
- Le total doit rester visible et intelligible pendant la saisie.

### Socle `nf-entity-detail`

- Le socle supporte déjà `statusMachineInActionsBar` et `statusMachinePosition`.
- Le socle garde aussi le slot `nfActionCenter`.
- La page Réception est déjà engagée dans cette direction, mais l'architecture des actions n'est pas encore assez unifiée pour produire une UX stable et réutilisable.

---

## Objectifs UX à Livrer

### 1. Clarifier la hiérarchie d'actions sur la fiche Réception

Objectif : rendre évidente la différence entre :

- navigation
- actions utilitaires
- sauvegarde de brouillon
- transitions de workflow

Résultat attendu :

- `Retour` à gauche, présenté comme action de navigation légère
- `Scanner BL` dans la zone d'actions utilitaires gauche, pas dans un bloc ad hoc
- zone droite ordonnée et stable
- badge de statut toujours visible
- `Enregistrer` visible comme action de brouillon
- `Valider` reste l'action principale quand la réception est en `BROUILLON`
- `Rejeter` conserve un poids inférieur à `Valider`
- `Modifier` n'apparaît pas comme CTA principal concurrent quand le document est déjà validé

### 2. Rendre le mode consultation réellement distinct du mode édition

Objectif : éviter l'impression de "formulaire editable déguisé".

Résultat attendu :

- en `view`, les champs standard de Réception ne doivent pas donner l'impression d'être modifiables
- pour les champs textuels, select, textarea, date, la lecture doit être visuellement plus proche d'une fiche que d'un formulaire actif
- si une généralisation simple est possible dans `nf-entity-detail`, la faire de manière opt-in et rétrocompatible
- sinon, appliquer une version locale à Réception sans casser le socle

Arbitrage recommandé :

- préférence pour une capacité socle légère de type `viewModeAppearance: 'form' | 'readonly'`
- défaut global inchangé pour éviter les régressions
- Réception peut activer explicitement le rendu `readonly`

### 3. Renforcer la structure métier de la fiche Réception

Résultat attendu :

- section `Identification` compacte
- section `Destination` compacte
- section `Lignes de réception` immédiatement exploitable
- total réactif affiché clairement au-dessus des lignes
- `Fournisseur` reste pleine largeur
- `Réf. BL / Bon de livraison` reste un champ texte simple, sans affordance de lookup
- `Scanner BL` reste disponible en création et édition

### 4. Améliorer la liste Réceptions sans réécrire le composant de listing

Résultat attendu :

- libellés cohérents en français
- format de date cohérent avec `fr-MA`
- format monétaire cohérent avec `MAD`
- colonnes métier plus explicites
- valeurs absentes exprimées explicitement quand utile, par exemple `Non renseigné`
- si la densité de ligne peut être resserrée localement sans toucher tout le socle, le faire

---

## Périmètre d'Implémentation

## A. Changements Réception à faire

### Listing

1. Vérifier la configuration du CTA de création et corriger tout libellé incohérent.
2. Ajuster les colonnes pour une lecture métier plus nette.
3. Uniformiser les placeholders de valeurs manquantes.
4. Uniformiser l'affichage date/montant en `fr-MA`.
5. Ajouter un léger resserrement visuel local si possible dans la page Réception uniquement.

### Detail / Create / Edit

1. Conserver la structure actuelle par sections, mais la rendre plus dense et plus claire.
2. Garder le total réactif des lignes.
3. Garder `Scanner BL` comme action visible, mais intégrée dans la barre d'actions du socle.
4. Supprimer toute logique de présentation qui donne trop de poids à des champs secondaires.
5. Séparer clairement consultation et édition.

---

## B. Changements socle à faire

Le socle doit évoluer uniquement dans la mesure nécessaire pour servir Réception proprement.

### Barre d'actions `nf-entity-detail`

Objectif : converger vers une barre d'actions config-driven plus stable, sans casser les pages existantes.

À faire :

1. Conserver le support existant de `nfActionCenter`.
2. Permettre une organisation stable des actions gauche / centre / droite.
3. Conserver le rendu auto du `statusMachine` dans la barre d'actions.
4. Vérifier l'ordre réel de rendu pour que la zone droite respecte la hiérarchie métier.
5. Éviter que `save` et les transitions workflow se marchent visuellement dessus.

Comportement cible pour Réception :

- gauche : `Retour`, séparateur discret, `Scanner BL`
- droite : badge statut, `Rejeter`, `Enregistrer`, `Valider`

Notes :

- `Valider` = CTA principal
- `Enregistrer` = action de brouillon, visible seulement quand pertinent
- `Rejeter` = action destructive de workflow, moins saillante que `Valider`

### Rendu read-only des champs standard

Si faisable sans effet de bord excessif, ajouter au socle une capacité simple pour afficher les champs en mode consultation sous forme de valeurs et non d'inputs actifs.

Cible minimale :

- `text`
- `textarea`
- `date`
- `select`
- `number`

Contraintes :

- pas de régression sur les autres pages
- comportement rétrocompatible par défaut
- ne pas casser les templates `nfField` custom existants

---

## Non-Objectifs

Ne pas faire dans cette mission :

- refonte globale du design system
- migration i18n massive de tout le module inventaire
- modifications backend
- changement de `reception.facade.ts` sauf nécessité absolue liée à un bug de présentation
- changement de `inventory-mock.service.ts` sauf nécessité absolue pour un bug bloquant d'affichage
- réécriture du composant de listing générique

---

## Contraintes Techniques

- Ne pas ajouter de dépendance.
- Préserver la compatibilité des autres écrans qui utilisent `nf-entity-detail`.
- Préférer des évolutions opt-in dans le socle plutôt qu'un changement brutal par défaut.
- Garder le code strictement typé.
- Limiter les changements au frontend.
- Respecter le style Angular déjà en place.

---

## Proposition d'Approche

### Étape 1

Stabiliser le socle `entity-detail` pour permettre une vraie hiérarchie d'actions et un mode `view` plus lisible, sans casser l'existant.

### Étape 2

Brancher Réception sur ces capacités socle :

- actions mieux ordonnées
- `Scanner BL` repositionné
- distinction consultation / édition
- densité des sections

### Étape 3

Finir par la liste Réceptions :

- cohérence des libellés
- dates et montants
- placeholders métiers
- petit ajustement de densité si utile

---

## Critères d'Acceptation

### Listing

- La page liste n'affiche plus de libellé incohérent avec le français de l'écran.
- Les valeurs absentes sont lisibles et sémantiquement plus explicites.
- Les dates et montants sont cohérents entre eux.

### Detail

- En création et édition, les actions principales sont immédiatement compréhensibles.
- En consultation, les champs standard n'ont plus l'apparence d'inputs activement éditables.
- Le total des lignes reste visible et réactif.
- `Scanner BL` est accessible sans polluer la structure du formulaire.
- `Réf. BL / Bon de livraison` reste un champ texte pur.

### Socle

- `nfActionCenter` continue de fonctionner sur les écrans existants.
- La page Réception n'a plus besoin d'un bricolage spécifique pour obtenir sa hiérarchie d'actions.
- Les changements restent rétrocompatibles.

---

## Validation Demandée

Exécuter au minimum :

```bash
cd web
npx ng build
```

Puis vérifier manuellement les scénarios suivants :

1. Ouvrir `/inventory/mouvements/receptions` et vérifier la clarté de la liste.
2. Ouvrir `/inventory/mouvements/receptions/new` et vérifier la hiérarchie d'actions, `Scanner BL`, la densité du formulaire et les lignes.
3. Ouvrir une réception `BROUILLON` et vérifier `Enregistrer`, `Valider`, `Rejeter`.
4. Ouvrir une réception `VALIDE` et vérifier que la consultation est lisible et que `Modifier` ne concurrence pas indûment le workflow.
5. Vérifier qu'un autre écran utilisant `nf-entity-detail` avec `nfActionCenter` continue de fonctionner.

---

## Arbitrages Si Tu Dois Choisir

1. Préfère une amélioration socle opt-in à une belle solution qui casse l'existant.
2. Préfère une hiérarchie d'actions claire à une symétrie visuelle artificielle.
3. Préfère une consultation vraiment lisible à un pur réemploi des mêmes composants formulaire.
4. Préfère des améliorations locales Réception à une généralisation prématurée si la généralisation devient risquée.

---

## Sortie Attendue de l'Agent

À la fin, l'agent doit livrer :

- les changements de code
- un résumé court des décisions prises
- la liste des fichiers modifiés
- le résultat du build Angular
- les éventuels points volontairement laissés hors scope