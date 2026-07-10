# 15 — Polish & finitions

> **Sévérité** : P3
> **Estimation** : 1 sprint (S11–S12, en parallèle de finalisation DS)
> **Dépendances** : 11-design-system

## Findings traités

- [ ] **F-36** Icône emoji 🤖 brute en bas de page → remplacer par SVG Lucide
- [ ] **F-37** Pluriels non gérés `(s)` → ICU (cf 11-design-system Task 11.3)
- [ ] **F-38** Tooltips et raccourcis clavier absents
- [ ] **F-39** Logo / branding absent (« ERP » en haut à gauche, sans logo société ni nom produit)
- [ ] **F-40** Pas de dark mode
- [ ] **F-41** Manifest PWA absent (cf 13-Task 13.6)
- [ ] **F-42** Bouton « Réinitialiser » filtres standardiser

## Goal

Pixel-perfect : finitions qui font la différence sur la qualité perçue (raccourcis clavier, dark mode, branding, tooltips, plurals propres).

---

## Task 15.1 — Branding multi-tenant

**Pattern** : header gauche affiche le **logo de la société courante** + nom produit Nafura.

**Source** : `Company.logoUrl` (cf 08-Task 8.3).

**Implémentation** :

```html
<!-- shell -->
<div class="brand">
  <img [src]="currentCompany().logoUrl ?? '/assets/branding/nafura-logo.svg'" alt="" class="company-logo">
  <span class="product-name">Nafura ERP</span>
</div>
```

**Logo Nafura** : créer `/public/assets/branding/nafura-logo.svg`.

**Acceptance criteria** :
- [ ] Logo société (si présent) en header
- [ ] Logo Nafura par défaut
- [ ] Loading spinner branded à l'init
- [ ] Favicon Nafura

---

## Task 15.2 — Dark mode

**Tokens dark** : compléter `tokens.scss` (cf 11-design-system) avec `[data-theme="dark"]`.

**Préférences** :
- Détecter `prefers-color-scheme` au premier load
- Toggle utilisateur : `/user-settings/preferences/theme`
- Persistance localStorage

**Implémentation** :

```ts
// app/platform/core/theme/theme.service.ts
@Injectable({ providedIn: 'root' })
export class ThemeService {
  init(): void {
    const stored = localStorage.getItem('app.theme');
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    this.apply(stored ?? system);
  }
  apply(theme: 'light' | 'dark' | 'auto'): void {
    document.documentElement.dataset['theme'] = theme;
    localStorage.setItem('app.theme', theme);
  }
}
```

**Acceptance criteria** :
- [ ] Toggle 3 valeurs (light / dark / auto) dans user-settings
- [ ] Tokens dark validés WCAG AA
- [ ] Pas de couleurs en dur dans les composants : tout via tokens

---

## Task 15.3 — Raccourcis clavier (F-38)

**Catalogue** :

| Raccourci | Action |
|---|---|
| `Ctrl+K` (`Cmd+K`) | Command palette (cf 03-Task 3.2) |
| `?` | Toggle panneau IA (cf 03-Task 3.6) |
| `g c` | Goto Chantiers |
| `g a` | Goto Achats |
| `g f` | Goto Finance |
| `n` | Nouveau (sur listing : ouvrir création) |
| `e` | Édition (sur fiche : passer en mode édition) |
| `Esc` | Fermer modal/drawer |
| `Ctrl+S` | Sauvegarder formulaire |
| `Ctrl+/` | Afficher l'aide raccourcis (modal) |

**Bibliothèque** : implémentation custom avec `@HostListener` au shell, ou `@ngneat/hot-keys`.

**Modal d'aide** : `Ctrl+/` ouvre un modal listant tous les raccourcis (auto-généré depuis catalogue).

**Acceptance criteria** :
- [ ] 10 raccourcis fonctionnels
- [ ] Modal d'aide accessible
- [ ] Tooltips sur boutons primaires affichent le raccourci (ex. `Sauvegarder ⌘S`)

---

## Task 15.4 — Tooltips systématiques

**Convention** :
- Tous les boutons icon-only ont un `<nf-tooltip>` au survol
- Boutons avec label : tooltip optionnel pour explication contextuelle
- Disabled buttons : tooltip qui explique pourquoi disabled

**Composant** : `<nf-tooltip>` ou directive `[nfTooltip]="'texte'"`.

**Acceptance criteria** :
- [ ] 100% des `<button icon-only>` ont un tooltip
- [ ] Tooltips traduits via i18n
- [ ] Délai 500ms pour ne pas être intrusif

---

## Task 15.5 — Manifest PWA + offline app shell (F-41)

Voir 13-Task 13.6 pour la configuration. Ce qui reste pour le polish :

- **Splash screens** par tailles iOS / Android
- **Maskable icon** pour PWA
- **Theme color** dynamique selon preference theme
- **App shell** : page « offline » accessible si réseau coupé pour les routes non-cachées

**Acceptance criteria** :
- [ ] Lighthouse PWA : score 100
- [ ] Test installation iOS Safari + Android Chrome
- [ ] Page offline brandée avec CTA « Réessayer »

---

## Task 15.6 — Bouton Réinitialiser filtres standardisé (F-42)

**Convention** : sur chaque listing avec filtres :
- Bouton « Réinitialiser » à droite de la barre de filtres, **toujours visible**
- Position uniforme : à la fin de la barre de filtres
- Désactivé tant qu'aucun filtre actif

**Composant** : `<nf-filter-bar>` (cf 11-design-system) gère cela en built-in.

**Acceptance criteria** :
- [ ] 100% des listings ont un bouton Réinitialiser au même endroit
- [ ] Désactivé si aucun filtre

---

## Task 15.7 — Onboarding tour interactif

**Bibliothèque** : `driver.js` ou `intro.js` ou implementation custom.

**Tours** :
- **Premier login** : tour shell (sidebar, header, command palette)
- **Premier chantier** : tour création chantier
- **Première facture** : tour facturation
- **Tour rapide** : 5 étapes les plus importantes du module courant

**Trigger** : flag `User.onboarding.completed` ou click bouton « Aide → Tour »

**Acceptance criteria** :
- [ ] 4 tours implémentés
- [ ] Bouton aide en bas-droite (à côté de l'IA)
- [ ] Tour skippable, persisté

---

## Task 15.8 — Polish typographique (F-26)

**Audit** : passer chaque page et corriger :
- H1/H2 différenciés (taille + poids)
- Sous-titres cassés en 2 lignes max
- Pas de gris < 4.5:1 contraste
- Hiérarchie visuelle claire (1 H1, 2-3 H2 max par page)
- Labels formulaires en haut, pas inline (lecteur d'écran)

**Outil** : DevTools Audit + revue manuelle module par module.

**Acceptance criteria** :
- [ ] Score Lighthouse Best Practices ≥ 90
- [ ] Aucun gris < 4.5:1 vs surface blanche
- [ ] Cohérence titre/sous-titre sur 13 modules

---

## Task 15.9 — Page erreurs propres

**Pages** :
- `/404` : page non trouvée (ASCII art ou illustration)
- `/403` : accès refusé (avec contact admin)
- `/500` : erreur serveur (avec ID corrélation)
- `/maintenance` : maintenance planifiée

**Acceptance criteria** :
- [ ] 4 pages avec illustrations + CTA retour accueil
- [ ] Logging automatique de l'erreur côté serveur (Sentry)

---

## Task 15.10 — Démo seed « société modèle BTP »

**Goal** : un dataset réaliste pour démos commerciales — pas un seed dev.

**Société type** : `SOMACOM SARL`, ICE 001234567000088, RC Casa 715869, capital 5M MAD.

**Périmètre** :
- 12 chantiers actifs (mix résidentiel/TP/VRD/réhabilitation)
- 6 mois historique paie (15 employés)
- 8 fournisseurs principaux (cimentiers, fer, location matériel)
- 4 marchés publics + 8 marchés privés
- Données HSE : 3 NC ouvertes, 2 AT bénins déclarés
- Audit log : 200 dernières actions
- Notifications : 12 actives

**Fichier** : `app/applications/erp/_seed/societe-modele-btp.seed.ts`

**Trigger** : option « Charger jeu de démo » dans `/administration/parametres` (admin seul).

**Acceptance criteria** :
- [ ] Seed cohérent (codes ICE/IF valides format)
- [ ] Reset rapide (1 click pour reseed)
- [ ] Tous les modules ont assez de données pour une démo de 30min
