---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-staff
name: Staff (pro)
status: stable
phase: P1
p1MobileId: manager-staff
p1Impl: mock
route: /pro/staff
layout: pro-layout
zone: pro
roles: [OWNER, ADMIN]
auth: required
flowRefs: []
apiRefs:
  - ../../api/staff.api.md
abstractions:
  components:
    - "@platform/core/components/photo-gallery"
    - "@platform/core/forms/business-hours-editor"
    - "@platform/core/i18n"
---

# Staff (pro)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `manager-staff` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.

## Intent

Gérer l'équipe du salon : ajouter/retirer un staff, configurer son rôle, ses horaires de travail récurrents, ses congés/exceptions, son périmètre de services.

## Route et accès

- Route : `/pro/staff`
- Layout : `pro-layout`
- Auth : required
- Rôles : OWNER (full), ADMIN (sauf suppression staff OWNER)
- Tenant requis : oui

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Staff du salon | [GET /api/v1/pro/staff](../../api/staff.api.md) | onInit | session 1 min |

## Mock API consommée

- `GET /api/v1/pro/staff`
- `POST /api/v1/pro/staff`
- `PATCH /api/v1/pro/staff/:id`
- `POST /api/v1/pro/staff/:id/photo`
- `POST /api/v1/pro/staff/:id/working-hours`
- `POST /api/v1/pro/staff/:id/time-off`
- `DELETE /api/v1/pro/staff/:id`

## États

### loading
- Skeleton grille avatars.

### empty
- "Pas encore de staff. Ajoutez votre premier praticien." + CTA "+ Nouveau staff".

### error
- 401, 503.

### success
- Header : bouton "+ Nouveau staff", switch "Voir inactifs".
- Grille cards staff : avatar, displayName, rôle pro, statut badge (ACTIVE/INACTIVE), nb services autorisés, prochain congé.
- Drawer édition (clic card) : displayName, email (si compte), téléphone, photo, rôle (OWNER/ADMIN/STAFF), services autorisés (multi-select), horaires de travail récurrents (BusinessHoursEditor), congés futurs, langue préférée.
- Tab "Congés" : timeline futurs congés/exceptions.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Nouveau staff | bouton | drawer création avec invite email |
| Éditer | clic card | drawer édition |
| Activer/Désactiver | toggle | `PATCH /pro/staff/:id` |
| Supprimer | bouton (dangereux) | dialog → `DELETE` (OWNER seulement pour staff OWNER) |
| Upload photo | bouton | `POST /photo` |
| Modifier horaires | éditeur | `POST /working-hours` |
| Ajouter congé | bouton | dialog date range + raison → `POST /time-off` |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| photo-gallery (avatar) | `@platform/core/components/photo-gallery` | photo staff |
| business-hours-editor | `@platform/core/forms/business-hours-editor` | horaires récurrents + exceptions |

## Composants internes (non réutilisables)

- `<StaffCard>` : carte staff compacte.
- `<StaffFormDrawer>` : drawer édition.
- `<TimeOffTimeline>` : timeline congés.

## Validations et règles métier

- ADMIN : ne peut pas supprimer un staff OWNER.
- Suppression interdite si staff a des RDV futurs (409 → suggestion désactiver).
- Horaires : ranges valides (from < to), max 3 ranges/jour, chevauchements interdits.
- Photo : 2 Mo max, jpeg/webp.
- Email invite : envoyé via `:platform:integrations:email` à la création.

## i18n

- Clés : `beauty.proStaff.title`, `beauty.proStaff.cta.new`, `beauty.proStaff.toggle.inactive`, `beauty.proStaff.form.*`, `beauty.proStaff.empty`, `beauty.proStaff.role.<role>`, `beauty.proStaff.tab.profile`, `beauty.proStaff.tab.hours`, `beauty.proStaff.tab.timeOff`, `beauty.proStaff.action.invite`, `beauty.proStaff.action.deactivate`, `beauty.proStaff.action.delete`.

## Critères d'acceptation

- [ ] L'écran rend les 4 états.
- [ ] ADMIN ne peut pas supprimer un OWNER (UI cachée + 403 backend).
- [ ] Les services autorisés filtrent ce staff dans les écrans réservation.
- [ ] Les congés sont reflétés dans l'agenda pro (zones hachurées).
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Performance individuelle staff (CA généré, nb RDV) : V2.
- Commissions par staff : V2.
- Auto-invite Keycloak ou compte sans login : V1 = invite optionnelle (staff sans compte = utilisable mais non-connecté).
