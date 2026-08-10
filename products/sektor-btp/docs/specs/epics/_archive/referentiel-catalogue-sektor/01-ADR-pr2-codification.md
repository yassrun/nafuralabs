# ADR — PR2 Codification (provisoire)

**Statut :** accepté provisoire — 2026-08-10  
**Epic :** referentiel-catalogue-sektor  
**Objectif :** débloquer L10 (ouvrage composite) sans attendre l’arbitrage expert final.

> **Règle** : cette grille est **exécutable dès maintenant**. L’expert métier peut la
> raffiner ; les codes restent des `VARCHAR` stables (pas de FK vers une table de
> nomenclature versionnée en L10). Une migration de libellés / alias est possible plus
> tard sans casser les études déjà codées.

---

## Contexte

Phase 3 exige `code_lot` + `code_famille` sur `ouvrages` avant récursion / capitalisation.
Sources déjà dans le dépôt :

1. **Lots d’usage** — enum `UsageLot` (`item`) : `GROS_OEUVRE`, `VRD`, `FINITIONS`,
   `SECOND_OEUVRE`, `TECHNIQUE`
2. **Familles articles** — seed `003_seed_item_categories_taxonomy.sql` (approvisionnement)
3. **Familles ouvrages corpus** — 16 libellés dans
   `etudes/.../corpus/sous-details-gros-oeuvre.json`

Les axes **lot d’ouvrage** et **famille d’article** sont disjoints (déjà documenté sur
`UsageLot`). La codification ouvrages suit le lot d’ouvrage + une famille **métier ouvrage**,
pas la taxonomie achat.

---

## Décision

### 1. `code_lot` = codes `UsageLot` (figés)

| Code | Libellé |
|------|---------|
| `GROS_OEUVRE` | Gros œuvre |
| `VRD` | VRD |
| `FINITIONS` | Finitions |
| `SECOND_OEUVRE` | Second œuvre |
| `TECHNIQUE` | Lots techniques |

Pas de nouveau enum L10 : réutiliser `UsageLot` / mêmes chaînes.

### 2. `code_famille` — grille provisoire (corpus GO + extension)

Codes **UPPER_SNAKE**, max 30 car. Libellés corpus mappés :

| code_famille | Libellé (corpus / métier) | code_lot typique |
|--------------|---------------------------|------------------|
| `TER_GEN` | Terrassements généraux | `GROS_OEUVRE` |
| `TER_FOND` | Terrassements fondations | `GROS_OEUVRE` |
| `MAC_FOND` | Maçonnerie en fondation | `GROS_OEUVRE` |
| `MAC_ELEV` | Maçonnerie en élévation | `GROS_OEUVRE` |
| `BA_FOND` | Bétons armés en fondation | `GROS_OEUVRE` |
| `BET_CHANT` | Béton sur chantier | `GROS_OEUVRE` |
| `CAN_PVC` | Canalisations tubes PVC | `VRD` |
| `REG_EU` | Regards EU-EV-EP | `VRD` |
| `ENDUIT` | Enduits | `FINITIONS` |
| `CARREL` | Carrelage sols et murs | `FINITIONS` |
| `MARBRE` | Marbres / granit | `FINITIONS` |
| `DIV_ETAN` | Divers et étanchéité | `GROS_OEUVRE` |
| `GO_G1` … `GO_G4` | Placeholders corpus `g1`–`g4` | `GROS_OEUVRE` |
| `DIVERS` | Fourre-tout / non classé | *selon contexte* |

Extension future (sans casser L10) : ajouter des codes `SECOND_OEUVRE` / `TECHNIQUE` sur le
même format (`ELEC_*`, `PLOMB_*`, …) quand le corpus s’élargit.

### 3. Identifiant ouvrage (hors colonnes lot/famille)

Pour L10 / L12, la clé métier recommandée (string, pas FK) :

```
{code_lot}.{code_famille}.{slug}
```

Ex. : `GROS_OEUVRE.MAC_ELEV.agglo-20-cloture`

- `slug` : normalisé ASCII, kebab-case, unique **par tenant** (pas global catalogue)
- `catalog_cle_stable` (phase catalogue) pourra reprendre ce pattern ou un UUID opaque —
  **hors L10**

### 4. Ce que L10 doit faire / ne pas faire

| Faire | Ne pas faire |
|-------|----------------|
| Colonnes `code_lot`, `code_famille` VARCHAR NOT NULL (défaut `DIVERS` / `GROS_OEUVRE` si legacy) | Table de nomenclature versionnée bloquante |
| Valider que `code_lot` ∈ UsageLot | Imposer la taxonomie `item_categories` comme famille ouvrage |
| Récursion + anti-cycle | Attendre Batiprix / CGU |

### 5. Révision expert (post-provisoire)

Checklist pour cloturer PR2 « définitif » :

- [ ] Valider / fusionner `GO_G1`–`G4` et libellés corpus bruts
- [ ] Compléter familles second œuvre & technique
- [ ] Confirmer longueur / alphabet des codes (export Excel, CPS)
- [ ] Décider si `code_famille` devient une table référentielle seedée (optionnel)

Tant que non coché : statut ADR = **provisoire accepté**.

---

## Conséquences

- **L10 débloqué** sous contrainte de cette grille.
- Pas de migration destructive si l’expert renomme des libellés ; seuls les codes changeraient
  via script de mapping explicite.
- Alignement achat (`item_categories`) reste un axe séparé — rapprochement éventuel en L15+.
