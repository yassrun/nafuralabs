# Destinataires, envoi, suivi

> Une consultation = 1 panier puis N destinataires (contact mail obligatoire). Envoyer est une action. Le statut suit les devis reçus (1 par fournisseur).

Contrat : [`CONTRAT.md`](CONTRAT.md) (AC-1…AC-15).
Canvas : [`ux/destinataires-envoi-suivi-wireframe.canvas.tsx`](ux/destinataires-envoi-suivi-wireframe.canvas.tsx).
Gel : [`../../DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § Gelé 28/08.
Chrome déjà livré : listing/detail anatomy, picker panier, import magique — [`../00-PLAN.md`](../00-PLAN.md) + [`../../raffinement-ux-pro/achats-consultation-ux-pro/`](../../raffinement-ux-pro/achats-consultation-ux-pro/).

## Intention

Quand ce sous-lot est livré, l’acheteur prépare d’abord le panier (hors `/new` sans fournisseur unique), puis la liste de fournisseurs avec leurs contacts ; il envoie (journal mail) ; il importe un devis **par destinataire**. La consultation n’est plus « un fournisseur / DEMANDE vs DEVIS_RECU ».

## Périmètre

Inclus :

- Modèle **Consultation** (1 panier) + **Destinataire** (1 fournisseur + contact mail) + **Devis** (1 fournisseur sur cette consult).
- Contrainte contact : `PartnerContact.email` non vide ; pas de mail collé ; pas de fallback `partners.email`.
- Action **Envoyer la consultation** + journal d’envoi via `EmailService` (Brevo / no-op lab).
- Panier figé après le 1er envoi ; ajout de destinataire encore possible ; renvoi aux nouveaux seulement.
- Import magique **ciblé sur un destinataire** (moteur d’extraction inchangé).
- Statuts destinataire + statut consultation **dérivé** des devis. Listing : N fournisseurs + k/n réponses.
- Create `/achats/consultations/new` = **panier seulement** (casse AC-10 / AC-11 du chrome UX pro).

Exclus :

- Overlay étude (139), flag CONSULTÉ, gate N devis.
- Portail invité / chrome-less fournisseur.
- Attribution, BC, scoring AO, saisie manuelle PU.
- Exigence Brevo réel en Mode B.

## Approche

Une voie UX : **pas de wizard** sur `/new`. Create = panier → fiche = destinataires + envoi + suivi.

Lab Liquibase **clean** : drop `consultations_achat.fournisseur_id` (NOT NULL aujourd’hui). Tables destinataires + journal d’envoi. `consultation_achat_devis.destinataire_id` au plus tard dans SEKTOR-281.

`fournisseurId` encore posté (overlay 139, e2e 134) : **ignoré** à la création, pas d’attache destinataire. Dette overlay nommée, hors UI de ce sous-lot.

Risques :

- e2e 134 / 135 / 249 postent un `fournisseurId` unique et lisent `statut: DEMANDE | DEVIS_RECU` — à étendre **dans la mesure du nouveau modèle** (279 pour create, 281 pour import + statut).
- Flag 137 compte des **lignes devis**, pas le statut unique : conserver `devisRecus` (entier) sur le DTO. Ne pas toucher le code overlay / flag.
- `EmailService` no-op si clé Brevo absente (Mode B) : la preuve est le **journal**, pas un envoi réel.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-278 Plan + contrat + canvas RFQ | spec | — · `gate: me` |
| 2 | SEKTOR-279 Modèle N destinataires + contrainte contact mail | exec | 278 |
| 3 | SEKTOR-280 Envoyer la consultation (journal mail) | exec | 279 |
| 4 | SEKTOR-281 Suivi + devis par fournisseur + statut dérivé | exec | 280 |
| 5 | SEKTOR-282 Preuves destinataires-envoi-suivi | qa | 279, 280, 281 |

Pas de seconde `gate: me` sur les exec : 278 **est** la gate humaine du gel.

## Preuves attendues

Mode B owner : `make -C nafura-platform/ops mode-b`, `qa@nafuralabs.local`. Graphe fabriqué dans la preuve. Pas de seed demo.

| Script | Couvre |
|--------|--------|
| `node sektor/e2e/scripts/verify-consultation-rfq-279.mjs` | AC-1…AC-7 — create panier ; refus sans e-mail ; ≥ 2 destinataires |
| `node sektor/e2e/scripts/verify-consultation-rfq-280.mjs` | AC-8…AC-10 — envoyer, journal, panier figé, renvoi aux nouveaux |
| `node sektor/e2e/scripts/verify-consultation-rfq-281.mjs` | AC-11…AC-15 — import ciblé, PARTIELLE puis COMPLETE, listing k/n |
| `node sektor/e2e/scripts/verify-consultation-rfq-282.mjs` | Agrégat QA (279+280+281) + non-régression 135 / 249 **adaptée** |

Détail des scénarios : [`CONTRAT.md`](CONTRAT.md).

## Décisions ouvertes

Aucune — gel humain 28/08. Voie unique create = panier, fiche = destinataires (pas de wizard).
