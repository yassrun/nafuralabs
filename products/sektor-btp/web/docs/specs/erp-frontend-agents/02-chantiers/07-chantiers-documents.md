# Agent — Chantiers · Documents (GED)

> **Objet** : gestion documentaire chantier — plans, CCTP/CCAP/BPU, PV, photos, certificats. Recherche transverse.
> **Route** : `/chantiers/documents` · **Permission** : `chantiers.document.*`

## 0. Pré-requis

[README chantiers](README.md) — modèle `ChantierDocument`. UX-PRINCIPES §écran non-tabulaire.

## 1. Page `DocumentsChantierPage`

Vue **mosaïque + filtres** plutôt que listing strict. Cible : retrouver vite un plan ou un PV.

### Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Documents chantiers                                                      │
│ [🔍 Rechercher (nom, contenu OCR…)]                            [+ Upload]│
│                                                                          │
│  Filtres:  [Chantier ▾] [Catégorie ▾] [Période ▾] [Auteur ▾] [Tags ▾]   │
│  Chips:  [Plans] [PV] [Photos] [Certificats] [Récents]                  │
├──────────────────────────────────────────────────────────────────────────┤
│ ▼ CH-2026-001 Résidence Yasmine  (24 docs)            [Tout afficher ▸] │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                         │
│  │ 📄  │ │ 📐  │ │ 📷  │ │ 📷  │ │ 📋  │ │ 📐  │                         │
│  │CCTP │ │Plan │ │ ph1 │ │ ph2 │ │PV   │ │Plan │                         │
│  │ v2  │ │GO   │ │     │ │     │ │récep│ │étanc│                         │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                         │
│                                                                          │
│ ▼ CH-2026-002 Pont Bouregreg  (38 docs)               [Tout afficher ▸] │
│  ...                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Vue alternative

Toggle `Liste / Mosaïque` :
- **Mosaïque** (défaut) — cards 160×180px avec thumbnail + nom + catégorie + version.
- **Liste** — table dense : nom, chantier, catégorie, version, taille, uploadé par, date.

### Filtres

- `chantierId` — multi-select (par défaut : actifs).
- `category` — multi-select : Plan, CCTP, CCAP, BPU, PV, Photo, Certificat, Autre.
- `dateRange` — date upload.
- `uploadedById` — autocomplete employés.
- `tags` — multi-select libre.
- `search` — recherche full-text simulée (nom + tags + notes).

### Catégories & icônes

| Catégorie | Icône | Couleur |
|-----------|-------|---------|
| PLAN | `file-image` violet | violet |
| CCTP | `file-text` bleu | bleu |
| CCAP | `file-text` bleu | bleu |
| BPU | `file-spreadsheet` bleu foncé | bleu |
| PV | `clipboard-check` vert | vert |
| PHOTO | `camera` orange | orange |
| CERTIFICAT | `award` or | jaune |
| AUTRE | `file` gris | gris |

### Actions card / ligne

- Click thumbnail → preview modal (PDF.js pour PDF, balise `<img>` pour photos, sinon download).
- Menu kebab : `Télécharger`, `Renommer`, `Déplacer vers chantier…`, `Versionner` (upload nouvelle version), `Tags`, `Supprimer`.

### Upload

CTA `+ Upload` ouvre dialog drag&drop multi-fichiers.

```
┌─────────────────────────────────────────┐
│ Uploader des documents             [X]  │
├─────────────────────────────────────────┤
│ Chantier *                              │
│ [▾ CH-2026-001 Résidence Yasmine    ]   │
│                                         │
│ Catégorie par défaut                    │
│ [▾ Plan                              ]  │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │      Glisser-déposer ici          │   │
│ │   ou [Parcourir] (max 50 Mo/file) │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ┌─ Fichiers (3) ────────────────┐       │
│ │ plan-go-r1.pdf  4.2 Mo  [▾Plan]│       │
│ │ pv-recep.pdf    1.1 Mo  [▾PV ]│       │
│ │ photo-1.jpg     3.8 Mo  [▾Pho]│       │
│ └───────────────────────────────┘       │
│                                         │
│ Tags (chips)                            │
│ [r+5] [structure] [+]                   │
│                                         │
│ [Annuler]              [Uploader 3 fch]│
└─────────────────────────────────────────┘
```

Mock : crée des entrées `ChantierDocument` avec `url = blob:` ou `data:` (selon type), `taille` = `file.size`.

## 2. Mock seed

8-20 documents par chantier (~150 docs total) répartis :
- 2-3 plans par chantier.
- 1 CCTP, 1 CCAP, 1 BPU par chantier (gros chantiers seulement).
- 3-8 photos par chantier.
- 1-3 PV par chantier.
- 1-2 certificats (CNSS sous-traitants, attestations…).

Pour les fichiers mock : utiliser des PDF "sample" légers et des images placeholder (`https://picsum.photos/...` + cache local OK V1).

## 3. Files to deliver

```
applications/erp/pages/chantiers/documents/
├── documents-chantier.page.{ts,html,scss}
├── components/
│   ├── document-card/                  # card mosaïque
│   ├── document-preview-modal/         # preview PDF/image
│   ├── upload-dialog/                  # drag&drop
│   ├── document-row/                   # ligne en mode liste
│   ├── version-history-drawer/         # historique versions
│   └── category-filter-chips/
├── models/document.model.ts
└── services/{document-api.service.ts, document.facade.ts, index.ts}
```

## 4. UX details

- **Groupement par chantier** dans la vue mosaïque (collapsible par chantier).
- **Thumbnails images** : générer au upload (canvas `drawImage`).
- **Thumbnails PDF** : 1ère page rendue via PDF.js (V2 — V1 placeholder icône OK).
- **Preview modal** :
  - PDF : viewer PDF.js scrollable + boutons précédent/suivant.
  - Image : zoom + slide multi-images si plusieurs photos sélectionnées.
  - Autres : juste bouton télécharger.
- **Versionnage** : sur `Versionner`, on garde l'historique (`version: 1, 2, 3...`) avec lien vers les versions précédentes (drawer).
- **Recherche** : debounce 300ms, surligne le terme dans les résultats.
- **Drag&drop direct** sur la page (pas seulement dans le dialog) — overlay au survol fichier.

## 5. DoD

- [ ] Vue mosaïque rendue avec mock documents groupés par chantier.
- [ ] Toggle Liste/Mosaïque fonctionnel.
- [ ] Filtres et chips opérationnels.
- [ ] Upload drag&drop multi-fichiers stocke en mock + apparaît immédiatement.
- [ ] Preview PDF + image fonctionne dans modal.
- [ ] Versionnage : upload `v2` du même nom → historique conservé.
- [ ] Suppression demande confirmation.
- [ ] Performance : 150 docs rendus < 1s grâce à virtualisation par section.
