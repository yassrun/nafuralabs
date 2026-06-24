---
specVersion: 1
kind: brand
appId: layali
status: pilot
language: fr
activePalette: c
---

# Layali — Identité visuelle (palette)

> **Palette active (pilote)** : **C — Majorelle & terre cuite** (`--layali-palette: c`). Voir section 9.

## 1. Essence

Layali (« les nuits ») est une plateforme marocaine de nightlife et social dining. La palette exprime le contraste entre la nuit profonde et la chaleur des sorties : sophistication méditerranéenne, lumière dorée des terrasses, confiance digitale.

**Mots-clés** : nuit, chaleur, élégance accessible, Maroc urbain, confiance.

## 2. Couleurs principales

| Token | Hex | Rôle |
|---|---|---|
| `primary` | `#1D6F7A` | Action principale, liens, focus, succès opérationnel |
| `primary-dark` | `#0F5463` | Hover actif, chips sélectionnés |
| `primary-deep` | `#0F4050` | Fonds hero, posters événement |
| `primary-light` | `#2F8996` | Highlights, dégradés |
| `accent` | `#D17A2A` | Énergie nightlife, ratings, alertes douces, CTA secondaire |
| `accent-dark` | `#5B2D00` | Texte sur fond accent clair |
| `ink` | `#0F1F2D` | Texte principal, icônes |
| `ink-deep` | `#071018` | Champs saisis, contraste fort |

## 3. Surfaces et fonds

| Token | Hex | Rôle |
|---|---|---|
| `surface` | `#FFFFFF` | Cartes, panneaux (souvent à 86–94 % d'opacité sur fond) |
| `surface-muted` | `#F8FBFC` | Champs, récapitulatifs |
| `border` | `#DCE6EA` | Bordures, séparateurs |
| `bg-top` | `#F3F8FB` | Dégradé page (haut) |
| `bg-mid` | `#EEF4F2` | Dégradé page (milieu) |
| `bg-bottom` | `#E5EDEB` | Dégradé page (bas) |
| `night-panel` | `#112737` → `#173F50` | Bandeaux CTA sombres |

## 4. Couleurs sémantiques

| Token | Hex | Usage |
|---|---|---|
| `success` | `#1D6F7A` | Confirmé, payé, check-in OK |
| `success-subtle` | `#E8F5F6` | Badge confirmé, sélection table |
| `warning` | `#D17A2A` | En attente, timer brouillon |
| `warning-subtle` | `#FFF3E0` | Fond alerte douce |
| `warning-border` | `#FFE0B2` | Bordure alerte |
| `danger` | `#C62828` | Annulé, erreur bloquante |
| `danger-subtle` | `#FDECEA` | Badge annulé |

## 5. Dégradés signature

| Nom | Valeur | Usage |
|---|---|---|
| `gradient-brand` | `135deg, #1D6F7A → #D17A2A` | Avatar, placeholder image, dot accent |
| `gradient-hero` | `160deg, #0F4050 → #1D6F7A → #2F8996` | Cartes hero, posters |
| `gradient-cta` | `145deg, #112737 → #173F50` | Bandeau conversion bas de feed |
| `gradient-page` | radial teal + radial amber + linear bg | Fond global app client |

## 6. Règles d'usage

### À faire
- Utiliser `primary` pour toute action principale et la navigation active.
- Réserver `accent` aux éléments émotionnels : note, prix mis en avant, statut pending, chaleur nightlife.
- Garder les fonds clairs sur le parcours client mobile (lisibilité en sortie, lumière tamisée).
- Utiliser les dégradés signature avec parcimonie (hero, avatar, placeholders).

### À éviter
- Mélanger d'autres teintes saturées (violet néon, rose club) hors charte.
- Texte `accent` sur fond `accent-subtle` sans contraste suffisant — préférer `accent-dark`.
- Fond entièrement sombre sur les formulaires de réservation (friction, lisibilité).
- Plus de deux couleurs d'accent simultanées dans un même bloc UI.

## 7. Implémentation technique

| Surface | Fichier |
|---|---|
| Tokens CSS | `layali/mobile/src/brand/tokens.css` |
| Consommation mobile | `layali/mobile/src/index.css` |
| Ionic (boutons, chips) | variables `--ion-color-primary` / `--ion-color-secondary` dans `tokens.css` |

Convention de nommage CSS : préfixe `--layali-*`.

## 8. Accessibilité

- Contraste texte `ink` sur `surface` : conforme WCAG AA pour le corps de texte.
- Liens et boutons `primary` sur fond clair : ratio ≥ 4.5:1.
- Ne pas communiquer un état uniquement par la couleur : toujours associer libellé ou icône.

## 9. Palette C — Majorelle & terre cuite *(pilote actif)*

| Token | Hex | Rôle |
|---|---|---|
| `primary` | `#1E4D8C` | Majorelle — CTA, liens, navigation active |
| `accent` | `#C45C3E` | Terre cuite — ratings, pending, chaleur |
| `secondary` | `#D4A574` | Ocre doux — highlights |
| `ink` | `#2C1810` | Texte principal sur fond clair |
| `surface` | `#FFFFFF` | Cartes, formulaires |
| `bg` | `#FAF6F0` → `#F0E8DC` | Crème riad |

**Ionic** : `--ion-color-primary` = Majorelle, `--ion-color-secondary` = terre cuite.

### Palettes archivées

- **A — Nuit zellige** : teal `#1D6F7A` + ambre `#D17A2A`, fond clair.
- **B — Minuit & or** : nuit `#0B1628` + or `#C9A227`, fond sombre.
