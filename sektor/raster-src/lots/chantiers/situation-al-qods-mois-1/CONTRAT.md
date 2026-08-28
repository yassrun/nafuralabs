# Contrat — Al Qods mois 1 : attachement + situation

> Ce sous-lot est autonome pour la **preuve scénarisée**. Les modèles complets restent dans les contrats voisins.
> Journal : [`../../../DECISIONS-PRODUIT-CHANTIER.md`](../../../DECISIONS-PRODUIT-CHANTIER.md).
> Plan : [`00-PLAN.md`](00-PLAN.md). Scénario : [`SCENARIO.md`](SCENARIO.md). UX : [`ux/situation-al-qods-mois-1-wireframe.canvas.tsx`](ux/situation-al-qods-mois-1-wireframe.canvas.tsx).

**Qualification : FEATURE.** Les écrans attachement / situation existent ; la chaîne quantité → attachement signé → situation n°1 **ne tient pas** sur Al Qods sans ressaisie ni lecture parallèle à `AvancementPhysique`.

Gelé le **28/08/2026**.

---

## Intention

Le conducteur clôt septembre **sans retaper** ce que le chef a déclaré. La situation n°1 **relit** l’attachement signé, valorise au PU vendu, applique RG / avance. Le chantier peut facturer depuis le **devis** (pas de marché notifié).

| Contrat voisin | Ce sous-lot en consomme |
|---|---|
| [`avancement-et-attachement`](../avancement-et-attachement/CONTRAT.md) | AC-1, AC-5, AC-10..16 (attachement période, lignes lues, vendus seulement, signé fige) |
| [`situation-et-retenues`](../situation-et-retenues/CONTRAT.md) | AC-1..7, AC-6 (cumul 1ère période) — **pas** AC-8..12 ce cycle |
| [`vie-de-chantier`](../vie-de-chantier/CONTRAT.md) | Graphe Al Qods, rôles, nœud interne, ST 0 m² |
| [`dette-palier-1`](../dette-palier-1/CONTRAT.md) | Situation sans marché (186 / AC-D2) |

---

## Critères d’acceptation (AC-M)

### Avancement terrain

**AC-M1 — Quantité seule sur nœud feuille.** Déclaration 2.1 = 40 m³ @ 12/09 et 2.3 = 120 m² @ 18/09 acceptées. Tentative 181 m³ sur 2.1 **refusée** avec message reste à faire (voisin AC-5).

**AC-M2 — Pas de pourcentage saisi.** Aucun endpoint / écran de ce flux n’exige ni n’accepte un pourcentage (voisin AC-1, AC-2).

### Attachement septembre

**AC-M3 — Période 01/09–30/09, lignes montées.** À l’ouverture / création, l’attachement porte deux lignes nœud : 2.1 (40 m³) et 2.3 (120 m²), PU vendu lu sur le nœud — zéro saisie code / unité / quantité (voisin AC-11, AC-12).

**AC-M4 — Interne et ST 0 m² exclus.** Nœud *Installation* (INTERNE) et poste 3 étanchéité (0 m²) **absents** de l’attachement (voisin AC-13).

**AC-M5 — Signature MOE fige.** Passage `SIGNE_MOE` via lien public ; lignes et quantités inchangées ensuite (voisin AC-15). Jeton durci si stub encore ouvert (voisin AC-19 — dette nommée si non livré, mais signature simulée en preuve API).

**AC-M6 — Quantité attachée une seule fois.** Un second attachement chevauchant septembre ne repropose pas les mêmes quantités (voisin AC-16).

### Situation n°1

**AC-M7 — Source = attachement signé uniquement.** `SituationGenerationService` (ou successeur) ne lit plus `ChantierLot` / `AvancementPhysique` direct pour ce flux ; il consomme l’attachement `SIGNE_MOE` de septembre (voisin AC-1..3).

**AC-M8 — Sans marché notifié.** Génération autorisée avec référence de vente active = devis ; libellé « Référence de vente », pas écran mort « Créer le marché » (186).

**AC-M9 — Refus sans attachement signé.** Aucun attachement `SIGNE_MOE` disponible → génération **refusée**, message explicite (voisin AC-5).

**AC-M10 — Cascade RG + avance (1ère période).** `cumulPrecedentHt = 0`, `travauxPeriodeHt` = somme lignes, RG et avance calculées sur les taux chantier (voisin AC-6 + tableau AC-10 lignes 3–4, **sans** pénalités ni RAS ce cycle).

### Porte cockpit

**AC-M11 — Actions fin de mois depuis le chantier.** Cockpit / fiche `EN_COURS` : routes attachement et situation portent `chantierId`. Prochaine action post-situation pointe un trou réel, pas une action septembre déjà close (SCENARIO § cockpit lendemain).

**AC-M12 — Rôles.** `chef-chantier` : avancement oui, situation non. `conducteur` : attachement + situation. `daf` : pas réception BL (échantillon API cockpit / RBAC).

---

## Hors périmètre (dette nommée)

- Pénalités, RAS, 2e période cumul (contrat voisin AC-8..12).
- Attachement ST fournisseur.
- Facture Ventes, encaissement, workflow MOA complet au-delà de `BROUILLON` / génération.
- Signature jeton durci (AC-19) — souhaitable, pas bloquant preuve mois 1 si simulation API signe.
- Octobre / BL partiel — SEKTOR-226.

---

## Preuves e2e (noms)

| Id | Couvre |
|---|---|
| `alqods-m1-avancement-sept` | AC-M1, AC-M2 |
| `alqods-m1-attachement-lu` | AC-M3, AC-M4 |
| `alqods-m1-attachement-signe` | AC-M5 |
| `alqods-m1-situation-depuis-attachement` | AC-M7, AC-M8, AC-M10 |
| `alqods-m1-situation-sans-signature-refusee` | AC-M9 |
| `alqods-m1-interne-absent` | AC-M4 |
| `alqods-m1-cockpit-apres-situation` | AC-M11 |
| `alqods-m1-roles` | AC-M12 |

**État initial :** tenant `qa-local` ; graphe Al Qods créé par API (réutiliser helpers 221–226) ; `tauxRg` / `tauxAvance` renseignés.
