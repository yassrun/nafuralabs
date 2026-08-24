---
id: SEKTOR-155
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
blocked_by: [SEKTOR-153]
---

# CONTRAT — décompte cumulatif et retenues

> Geler les AC : le modèle SituationTravaux en place est juste (cumul precedent / courant / periode). Ce qui manque : lecture des attachements, pénalités de retard, RAS.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
24/08 01:47  status → doing
24/08        CONTRAT.md écrit et gelé (AC-1 à AC-13) — status → done-agent
24/08 02:05  status → done-agent
24/08 02:09  toi · approuvée → done-me
```

## Rapport de livraison

**Ce qui a changé** — `sektor/raster-src/lots/chantiers/situation-et-retenues/CONTRAT.md` créé, 13 `AC-n` gelés. Aucun fichier sous `sources/` touché.

**Critères posés, preuve = lecture du code actuel**

- AC-1 à AC-7 — la situation se monte depuis les attachements `SIGNE_MOE` (ou au-delà), ligne par nœud, jamais depuis `AvancementPhysique`/`ChantierLot.quantite`. Vérifié dans le code livré par `avancement-et-attachement` : `AttachementLigne.noeudId` + `quantitePeriode` existent déjà et sont exactement la source à consommer ; `SituationGenerationService.generate()` boucle aujourd'hui sur `ChantierLot` seul et lit `AvancementPhysique` directement — c'est le point que ces AC ferment.
- AC-8 à AC-12 — pénalités de retard (montant saisi) et RAS (`Chantier.tauxRas`, déjà en base) entrent dans une cascade à ordre fixe : pénalités → RG/avance (parallèles, assiette réduite des pénalités) → net HT → TVA → net TTC (inchangé pour `SituationToFacturePort`) → RAS (ligne informative). Un bug constaté en lisant `SituationGenerationService.resolveRetenueAvancePercent` (retourne une constante `5` au lieu de `chantier.getTauxAvance()`) est nommé et rattaché à SEKTOR-157, pas isolé en ticket séparé.
- AC-13 — vocabulaire chantier marocain, aligné sur AC-18 du contrat voisin.

**Décidé seul**

- L'ordre exact de la cascade (pénalités → RG/avance → TVA → net TTC facturé → RAS) — voir `## Question` ci-dessous : tranché, pas laissé ouvert.
- RAS calculée sur le net TTC et jamais transmise à `SituationToFacturePort` : elle reste une charge retenue au règlement, pas une réduction de la créance facturée.
- Pénalités de retard = montant **saisi**, pas dérivé d'un planning (absent au palier 1) — cohérent avec le hors périmètre déjà posé sur le planning côté `avancement-et-attachement`.
- La correction du bug `resolveRetenueAvancePercent` est rattachée à SEKTOR-157 plutôt qu'à un ticket séparé, car elle touche la même méthode que la cascade à réécrire.

**Écarts / dette** — aucun envers ce contrat ; le hors périmètre (planning, avenants, contreseing MOA, régime fiscal de la RAS, migration) est nommé dans le `CONTRAT.md`.

## Question

L'ordre exact d'application des retenues (RG, avance, pénalités, RAS) était signalé comme décision ouverte dans `00-PLAN.md`. **Tranché dans ce contrat (AC-10)**, pas laissé en attente :

Cascade retenue : **pénalités de retard** (montant saisi, déduites en premier du HT de la période) → **RG et avance** (parallèles, comme aujourd'hui, sur l'assiette réduite des pénalités) → **net à payer HT** → **TVA** → **net à payer TTC** (c'est ce montant, inchangé, que `SituationToFacturePort` reçoit) → **RAS** (% du TTC, calculée mais **jamais** déduite du montant facturé — une charge retenue par le maître d'ouvrage au règlement, pas une réduction de la créance).

- **A — Garder cet ordre** (retenu). RAS purement informative : elle ne touche jamais Ventes, conforme à la pratique marocaine (la RAS est un crédit d'impôt pour l'entreprise, pas un rabais au client). Pénalités déduites avant RG/avance : elles sanctionnent le fait exécuté avant tout calcul proportionnel au paiement.
- **B — RAS déduite du montant facturé** (comme une retenue de plus, au même titre que RG/avance). Plus simple à calculer, mais fausse la créance client réelle et romprait `SituationToFacturePort reste inchangé` explicitement demandé.

Recommandé : **A** — c'est aussi la seule option compatible avec la contrainte du sous-lot (« `SituationToFacturePort` reste la sortie vers Ventes, inchangée »). Aucune décision n'est donc en attente ; à casser d'un mot si l'arbitrage ne convient pas (même clause que « Les cinq derniers points » du journal produit).
