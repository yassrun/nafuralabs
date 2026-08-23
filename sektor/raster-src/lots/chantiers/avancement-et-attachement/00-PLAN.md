# Avancement et attachement

> Une seule vérité : la quantité. Le pourcentage se calcule. L'attachement lit, il ne ressaisit pas.
> **Pas de Pact.** Contrat `CONTRAT.md` (SEKTOR-151) · journal [`DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md) § avancement en quantité.

## Verdict

C'est le geste que la PME fait tous les mois. Il doit marcher **sans planning** (palier 1) : saisie directe sur le nœud, en quantité. Le sous-lot conditionne la situation.

## Constat

- `AvancementPhysique` porte `quantiteRealisee` **et** `pourcentage` — deux vérités, aucune ne prime.
- Il est saisi sur `lotId` / `posteId` : aucune activité dans la chaîne, ce qui est exactement le palier 1.
- `AttachementLigne` porte `quantiteExecutee` et une `zone` en **texte libre**, sans référentiel.
- La signature MOE existe déjà : `SignaturePublicController`, lien public.

## Approche technique

Retirer le pourcentage stocké ; le dériver `fait / prévu`. Verrouiller le dépassement de la quantité prévue (sortie = avenant). L'attachement se monte depuis les quantités déclarées sur la période au lieu d'ouvrir une saisie. Zone prise dans le référentiel du chantier. La règle « un nœud couvert par une activité ne se saisit plus en direct » est **posée** ici mais n'a d'effet qu'au palier 2.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-151 CONTRAT — avancement en quantité (`gate: me`) | SEKTOR-148 | — |
| 2 | SEKTOR-152 La quantité fait foi, le pourcentage se calcule | 151 | — |
| 3 | SEKTOR-153 L'attachement lit les quantités de la période | 152 | non |
| 4 | SEKTOR-154 Preuves | 153 | non |

## Couverture

Gel § **L'avancement se saisit en quantité** + son amendement palier 1 / palier 2.

## Décisions ouvertes

Aucune.
