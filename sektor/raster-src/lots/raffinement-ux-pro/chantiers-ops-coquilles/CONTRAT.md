# Contrat — Chantiers ops coquilles

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Canvas : [`ux/chantiers-ops-coquilles-wireframe.canvas.tsx`](ux/chantiers-ops-coquilles-wireframe.canvas.tsx).
> Plan : [`00-PLAN.md`](00-PLAN.md).
> Lookups : [`../socle-lookups-combobox/CONTRAT.md`](../socle-lookups-combobox/CONTRAT.md).
> Frontière RH : [`../../../DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) § 23/08.

**Qualification : EVOL.** Les ops existent. Les FK métier sont encore des `<select>` natifs. Après le socle combobox, `employes()` sans `q ≥ 2` rend `[]` → l’onglet Équipe affiche un tiret et zéro option, **alors que les employés QA sont seedés**.

Gelé le **28/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

## Intention

| Surface | Problème labo | Cible pro |
|---------|---------------|-----------|
| `/chantiers/{id}?tab=equipe` | `<select>` employé dump / vide ; `common.cancel` brut | Combobox `employes` ; rôle = enum natif ; i18n chantier |
| Create chantier étape équipe | Trois `<select>` employés vides | Trois combobox `employes` |
| Attachement / journal / documents | Select chantier dump (`pageSize: 500`) | Combobox `chantiers` |
| ST create | Chantier dump ; sous-traitant **texte** + id `st-${Date.now()}` | Combobox chantier + combobox `fournisseurs` → UUID partenaire |

Pas un picker overlay (article). Pas de restauration du dump.

---

## Critères gelés — Équipe + create (SEKTOR-267)

**AC-1 — Combobox employé, onglet.** Sur `/chantiers/{id}?tab=equipe`, le champ Employé du formulaire d’affectation est un `nf-select` `lookupKey: employes` (combobox). Plus de `<select>` HTML ni options préchargées via `erpLookup.employes('ACTIF')` sans `q`.

**AC-2 — Pas de dump.** À l’ouverture du champ : aucune liste d’options, aucun GET collection. Saisie **≥ 2 caractères** → recherche serveur (`/api/v1/rh/employes`, actifs). Les employés QA (`QA-OWN`, matricule `QA00000`, alias chef / conducteur / …) **apparaissent en hit** pour `q=QA` (ou nom). Le vide actuel n’est **pas** un seed manquant.

**AC-3 — Hit.** Chaque ligne : **nom** + **matricule**. Pas d’UUID comme libellé principal. Match matricule exact en tête si le référentiel le permet.

**AC-4 — Œil.** Valeur posée → nouvel onglet `/rh/employes/{id}`. Champ vide → liste `/rh/employes`. Même geste que le socle lookups.

**AC-5 — Rôle = enum.** « Rôle chantier » reste un `<select>` natif (codes `BTP_*`). Pas d’œil, pas de typeahead.

**AC-6 — i18n.** Annuler / Enregistrer / Retirer affichent le libellé traduit (`chantiers.common.actions.cancel|save` ou équivalent déjà chargé). Interdit : clé brute `common.cancel` / `common.save` / `common.remove` à l’écran.

**AC-7 — Create.** Étape équipe de `/chantiers/new` : chef, conducteur, ingénieur = trois combobox `employes` (mêmes AC-2…AC-4). Plus de `<select>` dump.

**AC-8 — Affectation.** Submit onglet Équipe avec employé + rôle + date début → POST affectation existant ; la ligne apparaît dans le tableau (nom + matricule). Dates natifs inchangés.

**AC-9 — Vide métier.** Sans affectation : empty-state actuel (« Aucune affectation… »). Distinct du champ combobox ouvert sans frappe (aucune option, pas « aucun employé en RH »).

---

## Critères gelés — autres ops (SEKTOR-268)

**AC-10 — Attachement.** Saisie attachement : champ chantier = combobox `chantiers`. Météo / zone du chantier = select natif (enum ou liste bornée au chantier).

**AC-11 — ST.** Création ST : chantier = combobox `chantiers`. Sous-traitant = combobox `fournisseurs` ; le POST envoie l’**id partenaire**, plus `sousTraitantId: st-${Date.now()}` ni nom seul. Nœud / poste du chantier courant = select natif (liste de **ce** chantier).

**AC-12 — Journal.** Création entrée : chantier = combobox `chantiers`. Type d’entrée = select natif (enum).

**AC-13 — Documents.** Filtre listing + champ chantier de l’upload = combobox `chantiers`. Interdit : `getAll({ pageSize: 500 })` pour peupler ce champ. Catégorie / nœud du chantier = select natif.

**AC-14 — Avancement.** Le champ chantier de la saisie **reste** un combobox (déjà branché). Pas de régression vers un dump. Ajout de ligne (postes du chantier) = select natif.

**AC-15 — Enums.** Météo, type journal, catégorie document, statut filtre listing : select natif, **pas** d’œil.

**AC-16 — Listes bornées.** Poste / nœud / zone **déjà chargés pour ce chantier** : select natif. Pas un combobox serveur « tous les nœuds du tenant ».

---

## Hors v1 (dette nommée, pas AC)

- CTA « + » créer un employé / fournisseur depuis le champ
- Overlay picker employé (rejeté — gel 23/08 lookups)
- RH planning-équipes et finance contre-partie (mêmes appels `employes()` sans `q`)
- Budget dashboard, Gantt, chrome documents type Drive
- Refonte métier contrat ST côté Achats (frontière déjà gelée) — ici on pose l’id partenaire, on ne déplace pas l’agrégat

---

## Scénarios e2e (noms) + état initial

L’exec implémente ; le QA joue. Mode B : `make -C nafura-platform/ops mode-b`, owner `qa@nafuralabs.local`.

| Scénario | Couvre |
|----------|--------|
| `equipe-select-plus-dump` | AC-1 — plus de `<select name="employeId">` |
| `equipe-ouverture-vide` | AC-2, AC-9 |
| `equipe-recherche-qa` | AC-2, AC-3 — `q=QA` → hits matricule + nom |
| `equipe-affectation` | AC-5, AC-6, AC-8 — rôle natif, i18n, ligne tableau |
| `equipe-oeil-fiche` | AC-4 |
| `create-chef-combobox` | AC-7 |
| `attachement-chantier-combobox` | AC-10 |
| `st-fournisseur-combobox` | AC-11 — pas `st-${Date.now()}` |
| `journal-chantier-combobox` | AC-12 |
| `documents-pas-pageSize-500` | AC-13 |
| `avancement-chantier-combobox` | AC-14 |
| `enum-sans-oeil` | AC-15, AC-5 |

**État initial :** tenant `qa-local` ; employés provisionnés (owner + rôles) **ACTIF** ; ≥ 1 chantier (ex. `CH-2026-001`) ; ≥ 1 partenaire `FOURNISSEUR` ; un nœud POSTE vendu pour le scénario ST.

**Constats API (preuve, pas UI) :** `GET /api/v1/rh/employes?statut=ACTIF` sans `q` n’est **pas** requis. `GET …/employes?statut=ACTIF&q=QA` retourne les hits. Un GET collection sans `q` qui resterait appelé depuis l’onglet Équipe = **FAIL**.
