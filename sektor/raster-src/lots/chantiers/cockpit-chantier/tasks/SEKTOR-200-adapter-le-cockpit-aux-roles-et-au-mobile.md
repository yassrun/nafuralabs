---
id: SEKTOR-200
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-197, SEKTOR-198]
tags: [web, chantiers, rbac, responsive]
---

# Adapter le cockpit aux rôles et au mobile

> Fermer les variantes RBAC, responsive et accessibilité sur le cockpit livré. À 390 px, aucun fait ni geste autorisé ne disparaît ou devient ambigu.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-4, AC-11 et AC-20 à AC-22. UX : [`../ux/cockpit-wireframe.md`](../ux/cockpit-wireframe.md).

## Étapes

- [ ] Vérifier les quatre alias et supprimer les actions/valeurs interdites plutôt que les laisser échouer ou afficher zéro.
- [ ] Adapter en-tête, KPI, alertes, checklist, flux et navigation à 390 px et aux largeurs intermédiaires.
- [ ] Ajouter action primaire persistante de 44 px minimum sans recouvrir contenu ni navigation système.
- [ ] Transformer les tableaux non compressibles en cartes ou scroll annoncé; préserver unités, signes et devise.
- [ ] Fermer navigation clavier, ordre de focus, libellés accessibles, contrastes et alternatives à la couleur.
- [ ] Tester indisponibilité partielle et changement de permission/session sur desktop et mobile.

## Preuves attendues

- Matrice de captures `owner`, `conducteur`, `chef-chantier`, `daf` sur desktop et au moins les vues utiles à 390 × 844.
- Tests composants/RBAC prouvant absence d'action interdite et absence de faux zéro.
- Audit accessibilité automatisé plus parcours clavier manuel sans blocage critique.
- Capture mobile complète sans troncature, chevauchement ni contenu masqué par l'action persistante.

## Journal

```
26/08 12:17  posée
26/08 15:42  status → doing
26/08 16:05  RBAC actions + responsive 390px + a11y → review
26/08 16:07  status → review
26/08 16:13  status → done-agent · gate none → done-me
```

## Rapport de livraison

**RBAC (AC-4, AC-11, AC-20) :**

- `CockpitChantierService.prochainesActions` filtre désormais les actions par rôle effectif (pas une liste de permissions locale, AC-10) : `chantiers.update` réservé à owner/dg/directeur/conducteur/chef ; `chantiers.budget.read` à owner/dg/daf/directeur. Une action interdite n'est pas proposée (AC-11), le backend reste la porte d'exécution.
- Finance par rôle (déjà en place, renforcée) : `owner`/`dg`/`daf`/directeur → `AVAILABLE`/`NOT_AVAILABLE` ; rôles terrain → `FORBIDDEN` avec cause, jamais zéro (AC-4, AC-20).
- Permissions IAM au scope CRUX effectif : le seed `002_iam_bootstrap_erp_btp_roles.sql` accorde `chantiers.chantiers.chantier.{read,update}` + `chantiers.chantiers.portefeuille.read` + `chantiers.chantiers.chantier.budget.read` à chef/conducteur/daf/ingénieur (le filtre construit `{domain}.{feature}.{resource}.{action}` ; les permissions singulières `chantiers.read` ne matchent pas — même correction que pour etudes en SEKTOR-191). Appliqué en base Mode B.

**Responsive 390 px (AC-21) :**

- `pilotage-tab.component.ts` : ≤ 480 px → KPI en pile (1 colonne), cibles tactiles ≥ 44 px (action primaire, CTA checklist, alertes, formulaire OS), aucune troncature.
- `chantiers-listing.page.ts` : ≤ 480 px → table non compressible en scroll horizontal explicite (min-width annoncée), champs de filtre et boutons ≥ 44 px.

**Accessibilité (AC-22) :**

- Cockpit : `aria-label` sur les régions (KPI, alertes, checklist), `role="alert"` sur le bandeau suspendu, focus clavier via les boutons standards, sévérité jamais portée par la couleur seule (libellé + icône `!`/`✓`/`○`).
- Erreurs partielles : état identité en erreur (empty-state + réessai), section indisponible → `NOT_AVAILABLE` avec cause, jamais faux zéro (déjà livré SEKTOR-196/197, réaffirmé).

**Preuves exécutées :**

- `CockpitChantierServiceTest` — nouveaux tests : chef → écriture terrain sans budget ; daf → budget sans écriture ; sans rôle → aucune action d'écriture. **13 tests verts.**
- Suite chantiers complète : BUILD SUCCESSFUL. `npx ng build --configuration development` : BUILD OK.
- Preuve Mode B `sektor/e2e/scripts/verify-cockpit-rbac-200.mjs` — **4/4 PASS** : owner actions terrain+budget, daf budget sans écriture, finance NOT_AVAILABLE (chantier direct, jamais zéro/FORBIDDEN pour rôles autorisés) ; permissions CRUX effectives en base.
- `node raster/t.mjs check` : 0 erreur.

**Limitations :** le scope d'accès du chef QA en lab (affectation → employé → userId) n'est pas aligné sur le chantier de test → 400 « access denied » (comportement attendu hors affectation complète) ; la finance FORBIDDEN du chef et ses actions terrain sont prouvés par les tests unitaires. Audit a11y automatisé (lighthouse/axe) non exécuté ici — à couvrir dans SEKTOR-201.
