# Destinataires : brouillon + N contacts (CC)

> Ajouter un fournisseur sur la fiche ne tape plus le serveur. L’e-mail vient de la liste `PartnerContact`. On peut en lier plusieurs par fournisseur (To + CC). Créer un contact se fait sur la fiche fournisseur, via un lien depuis la consultation.

Contrat : [`CONTRAT.md`](CONTRAT.md).
Canvas : [`ux/destinataires-brouillon-cc-wireframe.canvas.tsx`](ux/destinataires-brouillon-cc-wireframe.canvas.tsx).
Amende : [`../destinataires-envoi-suivi/CONTRAT.md`](../destinataires-envoi-suivi/CONTRAT.md) AC-4/AC-6 (grain 1 contact) et **remplace** [`../contact-write-through/CONTRAT.md`](../contact-write-through/CONTRAT.md).
Gel : [`../../DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § Gelé 04/09 (brouillon).

## Intention

Quand ce sous-lot est livré, la fiche consultation suit le même geste que les autres fiches : on compose les destinataires **en local**, puis **Enregistrer**. Un destinataire = 1 fournisseur (unique) + N contacts e-mail. L’envoi part To au premier, CC aux suivants. S’il n’y a pas de contact, un lien ouvre l’onglet Contacts de la fiche fournisseur.

## Périmètre

Inclus :

- Brouillon local (Ajouter / retirer) ; `PUT …/destinataires` à l’enregistrement.
- Liste à cocher des `PartnerContact` avec e-mail ; ≥ 1 obligatoire.
- Lien `/achats/fournisseurs/{id}?tab=contacts` pour créer un contact.
- Onglet Contacts sur la fiche fournisseur (liste + créer).
- Onglet Contrats sur la même fiche (liste filtrée + nouveau contrat).
- Join table N contacts ; envoi `sendWithAttachments` To+CC.
- Plus de write-through / promote depuis la consultation.

Exclus :

- Override e-mail stocké sur le RFQ.
- Plusieurs destinataires = même fournisseur (unique `(consultation, fournisseur)` inchangé).
- Overlay étude, portail, import magique, journal (hors To+CC).

## Approche

Lab : changelog `009` — table `consultation_achat_destinataire_contacts` ; `contact_id` du destinataire reste le premier (To).

`POST …/destinataires` reste pour l’API / e2e 279 : `contactIds` (1 auto si un seul contact). Refus si 0 contact e-mail — plus de saisie nom/e-mail.

Risque : e2e 280 clique Ajouter puis Envoyer — insérer Enregistrer.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | Plan + contrat + canvas brouillon CC | spec | — |
| 2 | API PUT + N contacts + envoi To/CC | exec | 1 |
| 3 | UI brouillon, onglet contacts, preuves e2e | exec | 2 |
| 4 | Toggle contact principal fiche fournisseur | exec | 3 |
| 5 | Onglet Contrats fournisseur sur la fiche (contacts restent un onglet) | exec | 4 |

## Validation technique

Mode B owner : `make -C nafura-platform/ops mode-b`, `qa@nafuralabs.local`.

| Script | Couvre |
|--------|--------|
| `node sektor/e2e/scripts/verify-consultation-contact-write-through.mjs` | AC brouillon / liste / CC / lien fiche (remplace write-through) |
| `node sektor/e2e/scripts/verify-consultation-rfq-279.mjs` | refus sans contact ; 1 / N ; lien `?tab=contacts` |
| `node sektor/e2e/scripts/verify-consultation-rfq-280.mjs` | Ajouter local → Enregistrer → Envoyer |

## Blocages extérieurs

Aucun. Le gel write-through 04/09 matin est **cassé** ici (acte humain dans ce chat).
