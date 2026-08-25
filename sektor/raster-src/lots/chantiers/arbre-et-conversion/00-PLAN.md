# Arbre et conversion

> Le chantier a son arbre : copié du devis validé, puis libre. Deux natures de nœud — vendu, interne.
> **Raster autonome.** Contrat `CONTRAT.md` (SEKTOR-146) · journal [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) § arbre, § déclencheur.

## Verdict

C'est la fondation : sans nature ni lien retour, ni la situation, ni le budget, ni le planning ne peuvent s'accrocher. Deux des trois autres sous-lots de la vague en dépendent.

## Constat

- `ChainageAvalAdapter` (L13, dans `etudes/`) crée déjà chantier → marché → lots / postes → budget en une transaction, depuis les nœuds DPGF.
- Il force `setStatus("EN_COURS")` — un chantier gagné n'est pas démarré.
- Il crée un `ContratMarche` avant qu'un contrat existe (§ marché à la notification).
- `ChantierLot` et `PosteBudgetaire` n'ont **ni** nature **ni** origine.
- Fallback douteux : un article sans parent tombe sur le premier lot trouvé, sinon un « Lot principal » est forgé.
- Web : `chantiers/detail/` est un placeholder à côté de `chantiers/chantier-detail/`.

## Approche technique

Backend `chantiers/` : nature (`VENDU` | `INTERNE`) + id du nœud DPGF d'origine sur `ChantierLot` et `PosteBudgetaire` ; un vendu naît de la copie, la saisie ne crée que de l'interne. Puis `ChainageAvalAdapter` : statut `EN_PREPARATION`, sortie du `ContratMarche`, fallback remplacé par un refus explicite. Web : suppression du placeholder. Lab — schéma clean + re-seed, pas de migration douce.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-146 CONTRAT — arbre vendu / interne et conversion (`gate: me`) | — | — |
| 2 | SEKTOR-147 Nature et lien retour au poste vendu | 146 | — |
| 3 | SEKTOR-148 Conversion `GAGNE` → `EN_PREPARATION`, sans marché | 147 | non |
| 4 | SEKTOR-149 Un seul écran chantier | 146 | **oui** avec 147 |
| 5 | SEKTOR-150 Preuves | 148, 149 | non |

## Couverture

Gels § **L'arbre du chantier**, § **Le déclencheur**, § **Le marché naît à la notification** (la partie « sortir le marché de la conversion »), § **Les cinq derniers points / doublons web**.

## Décisions ouvertes

Aucune — gelées le 23/08. Reste l'approbation du contrat (SEKTOR-146).
