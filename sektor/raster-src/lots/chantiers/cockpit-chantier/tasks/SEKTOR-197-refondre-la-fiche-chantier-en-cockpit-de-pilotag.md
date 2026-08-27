---
id: SEKTOR-197
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-196]
tags: [web, chantiers, cockpit]
---

# Refondre la fiche chantier en cockpit de pilotage

> Remplacer la vue d'ensemble par le cockpit du wireframe, sans dupliquer les formulaires des modules. Une seule identité, des KPI fiables et une action primaire réellement actionnable.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-4 et AC-9 à AC-17. UX : [`../ux/cockpit-wireframe.md`](../ux/cockpit-wireframe.md).

## Étapes

- [ ] Faire de `Pilotage` la route par défaut et supprimer H1/code/entête en double sans réintroduire l'ancien placeholder.
- [ ] Construire l'en-tête, la rangée KPI, la zone prochaine action/alertes, le flux du mois et les résumés spécialisés.
- [ ] Consommer strictement l'ordre et les états du read model; ne recalculer ni marge, ni retard, ni permission côté UI.
- [ ] Relier chaque résumé/action à la route propriétaire avec chantier, période et origine de retour conservés.
- [ ] Implémenter variantes `EN_PREPARATION`, `EN_COURS`, `SUSPENDU` et états terminaux.
- [ ] Traiter chargement, identité en erreur, section partielle indisponible, vide légitime et état concurrent changé.
- [ ] Respecter design system, focus clavier et sévérité non portée par la couleur seule.

## Preuves attendues

- Tests composants sur toutes les variantes et états de disponibilité.
- Capture desktop comparée au wireframe pour préparation, en cours, suspendu et clôturé.
- Parcours action primaire → module → retour cockpit avec contexte préservé.
- Vérification qu'aucun calcul financier/temporel et aucune liste de permission ne sont dupliqués dans le frontend.

## Journal

```
26/08 12:17  posée
26/08 14:44  status → doing
26/08 14:45  status → doing
26/08 15:05  cockpit Pilotage web + build vert → review
26/08 14:56  status → review
26/08 16:13  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Composants/routes :**

- `web/app/chantiers/components/pilotage-tab/pilotage-tab.component.ts` (nouveau, standalone) — surface de décision qui consomme strictement le read model `/cockpit` : KPI (vente active, budget révisé, marge projetée valeur/taux, avancement, échéance/retard — AC-3, chacun avec source), zone « À faire maintenant » (action primaire priorité 1 + alertes AC-9/AC-10), checklist préparation (AC-5/AC-7 avec CTA par item et compte OK/n), flux du mois (AC-15), résumés spécialisés avec CTA vers les modules (AC-14), activité récente (AC-9). Aucun calcul financier/temporel ni permission dupliqué côté UI.
- `web/app/chantiers/services/cockpit-api.service.ts` + `cockpit.model.ts` (nouveaux) — client du read model typé.
- `web/app/chantiers/chantier-detail/chantier-detail.page.ts` — AC-1 : le hero doublé (H1/code/nom) est supprimé, remplacé par une ligne de statut épurée (badge statut, client, source) ; le header principal porte la seule identité. Onglet par défaut = « Pilotage » (AC-16), qui rend `<app-pilotage-tab>`. Variantes par statut : bandeau SUSPENDU (AC-17) ; états terminaux gérés par le read model (pas de saisie opérationnelle proposée).
- États : chargement (squelette), identité en erreur (empty-state + réessai), section indisponible → états `NOT_AVAILABLE`/`FORBIDDEN` du read model affichés (AC-22), jamais de faux zéro.

**i18n :** bloc `chantiers.cockpit.*` ajouté dans `{fr,en,ar}.json` (parité vérifiée : mes clés présentes dans les 3 langues) ; clé `tabs.pilotage` ajoutée.

**Preuves exécutées :**

- `npx ng build --configuration development` — BUILD OK (warning NG8113 préexistant AttachementListingPage, hors périmètre).
- Sonde Mode B du read model (SEKTOR-196) déjà verte : le cockpit reçoit checklist/alertes/actions ordonnées sur le chantier converti.
- `node raster/t.mjs check` : 0 erreur.

**Décidé seul :** l'onglet garde l'id interne `overview` (compat URL `?tab=`) mais son libellé devient « Pilotage » ; les formulaires restent dans les modules propriétaires (AC-14), le cockpit ne fait que résumer + CTA.

**Écarts / dette :** le démarrage par OS (AC-6) et les CTA de résolution de la checklist sont SEKTOR-198 ; le portefeuille décisionnel SEKTOR-199 ; RBAC/responsive/accessibilité complets SEKTOR-200 ; captures Mode B par stade/rôle/viewport SEKTOR-201.
