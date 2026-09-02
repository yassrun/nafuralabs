# Contrat — Lookup combobox

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Journal produit : [`DECISIONS-PRODUIT.md`](../../../DECISIONS-PRODUIT.md) § 23/08/2026 lookups.
> Canvas : [`ux/lookup-combobox-wireframe.canvas.tsx`](ux/lookup-combobox-wireframe.canvas.tsx).
> Les preuves attendues vivent dans ce sous-lot.

**Qualification : EVOL.** Le select actuel dump 200–500 partenaires, n’a pas de champ de recherche (ou filtre local d’un dump), et l’œil ouvre la **liste** — pas la fiche de l’enregistrement choisi.

Gelé le **23/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

## Intention

Trois gestes, un anatomy :

| Cas | Contrôle | Recherche | Œil |
|-----|----------|-----------|-----|
| Enum fermé (type contrat, mode règlement) | `<select>` natif | non | non |
| FK métier (client, fournisseur, chantier, employé, devis…) | **combobox inline** | taper ≥ 2 car. → serveur si la liste peut grandir | oui, si un écran existe |
| Pick riche (article) | **picker overlay** | déjà lot `picker-article` | hors de ce lot |

Ce lot livre la **ligne 2**. Pas un dialog. Pas un second picker.

---

## Critères gelés

**AC-1 — Combobox.** Tout champ `type: 'select'` + `lookupKey` d’entité (carte `ERP_LOOKUP_LIST_ROUTES`) est un combobox : saisie dans le champ, liste sous le champ. Plus un `<select>` natif ni un `mat-select` sans input.

**AC-2 — Pas de dump.** À l’ouverture, aucune liste d’options. Aucun GET collection tant que l’utilisateur n’a pas saisi **≥ 2 caractères**. Si une valeur est déjà posée, un GET **par id** (ou équivalent) résout le libellé — pas un dump pour retrouver la ligne.

**AC-3 — Recherche.** As-you-type, debounce ~300 ms. Partenaires : **code** + **raison sociale**. Un match de **code exact** en tête. Actifs seulement par défaut.

**AC-4 — Hit.** Chaque ligne : code (si le référentiel en a un) + libellé. Pas d’UUID comme libellé principal.

**AC-5 — Clavier.** ↑↓ déplace le focus dans la liste ; Entrée valide ; Échap ferme sans changer la valeur.

**AC-6 — Œil, valeur posée.** Si une route **fiche** existe pour ce `lookupKey` et qu’une valeur est sélectionnée : l’œil ouvre **`{liste}/{id}`** dans un nouvel onglet (session conservée, comme aujourd’hui).

**AC-7 — Œil, champ vide.** Si une route **liste** existe et qu’aucune valeur n’est posée : l’œil ouvre la **liste** du référentiel (comportement actuel). Pas d’œil si aucune route dans la carte.

**AC-8 — Pas d’œil sur l’enum.** Champ sans `lookupKey`, ou `lookupKey` absent de la carte : pas de bouton œil.

**AC-9 — Vide.** 0 hit : message clair. **Pas** de CTA « Créer le partenaire » dans le combobox v1.

**AC-10 — Erreur.** Échec réseau : message + relance, liste fermée ou ouverte avec l’erreur — le champ ne perd pas la valeur déjà posée.

**AC-11 — Premiers branchements.** Client et fournisseur sur : devis, BC achat, contrat fournisseur, chantier (création / édition), facture de vente. Même contrôle, même API `q`.

**AC-12 — Reste des lookups.** Tous les `lookupKey` déjà dans `ERP_LOOKUP_LIST_ROUTES` (chantier, employé, dépôt, devis, facture, …) passent par le même combobox. Les filtres de listing qui utilisent ces clés aussi.

**AC-13 — Article.** `lookupKey: items` / picker article : **inchangé**. Ce lot ne re-discute pas le picker.

**AC-14 — Orphelin.** Id posé absent des hits (partenaire archivé, id cassé) : le champ affiche un libellé de repli, pas un UUID nu ; l’œil fiche s’ouvre quand même si la route existe.

**AC-15 — Effacer.** Valeur posée : libellé en lecture seule + croix **dans** le champ (`| acier  × |`). Clic croix → champ vide, la saisie redevient possible. Pas de frappe tant qu’une valeur est posée. La croix reste sur un champ requis (sinon on ne peut plus changer).

---

## Hors v1 (dette nommée, pas AC)

- CTA « + » / créer depuis le champ (les routes `ERP_LOOKUP_CREATE_ROUTES` restent pour plus tard)
- Recherche ICE / IF comme axe dédié (si `q` ne les couvre pas déjà)
- `nf-form` hors `nf-entity-detail` s’il reste des selects custom sans `lookupKey`
- Contacts partenaire (`partnerContacts`) : pas dans la carte liste
- Listing articles / picker article (lot dédié)

---

## Scénarios e2e (noms) + état initial

L’exec implémente ; le QA joue. Ne pas choisir des valeurs qui passent toutes seules.

| Scénario | Couvre |
|----------|--------|
| `lookup-ouverture-vide` | AC-2 |
| `lookup-recherche-code-exact` | AC-3, AC-4 |
| `lookup-clavier` | AC-5 |
| `lookup-oeil-fiche` | AC-6 |
| `lookup-oeil-liste-si-vide` | AC-7 |
| `lookup-enum-sans-oeil` | AC-8 |
| `lookup-aucun-resultat` | AC-9 |
| `lookup-erreur-reseau` | AC-10 |
| `lookup-client-devis` | AC-1, AC-11 |
| `lookup-fournisseur-bc` | AC-11 |
| `lookup-filtre-listing` | AC-12 |
| `lookup-orphelin` | AC-14 |
| `lookup-effacer` | AC-15 |

**État initial requis :** tenant `qa-local` ; **≥ 25** clients actifs et **≥ 25** fournisseurs actifs ; **1 code exact** client `CLI-…` et **1** fournisseur `FRN-…` ; au moins **1** inactif par rôle ; un devis et un BC brouillon pour brancher les champs ; un enum (type contrat ou mode règlement) sur le même écran qu’un FK pour AC-8.
