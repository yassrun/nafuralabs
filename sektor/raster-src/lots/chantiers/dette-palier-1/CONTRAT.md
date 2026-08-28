# Contrat — Dette palier 1 (post Al Qods)

> Complète [`../CONTRAT.md`](../CONTRAT.md) et le rapport SEKTOR-226. Gelé 28/08/2026.

## AC-D1 — Cockpit : Achats down ≠ « 0 DA »

Quand la lecture des demandes d’achat du chantier échoue (timeout, 5xx, BC indisponible), le module / tuile DA du cockpit affiche **indisponible** (ou équivalent i18n), jamais un compte **0** qui ment.

Le chantier reste lisible ; les autres modules ne tombent pas.

## AC-D2 — Conversion sans marché (CTA + dialog)

- Aucun libellé « Créer chantier **et marché** » sur le geste de conversion.
- Dialog : vente = devis, pas de marché créé ; OS démarre plus tard depuis le chantier (AC-12 parent).
- `Convertir` inactif sans libellé chantier ; actif si libellé seul (code/date/durée facultatifs).
- Après conversion : `marcheGenereId` nul, statut `EN_PREPARATION`.

Aligné SEKTOR-213 ; exécuté dans ce sous-lot.

## AC-D3 — Captures UI (QA)

Desktop + 390 px sur au moins : cockpit EN_COURS (DA visible), dialog conversion, fiche DA ou réception.

Si Browser MCP / Playwright indisponible : skip documenté, preuve API des AC-D1/D2 obligatoire.
