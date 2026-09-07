> **Cassé 04/09 soir** par [`../destinataires-brouillon-cc/CONTRAT.md`](../destinataires-brouillon-cc/CONTRAT.md). Ne plus implémenter ce contrat.

# Contrat — Contact write-through depuis la consultation

> Amende AC-5 / AC-6 de [`../destinataires-envoi-suivi/CONTRAT.md`](../destinataires-envoi-suivi/CONTRAT.md).
> Canvas : [`ux/contact-write-through-wireframe.canvas.tsx`](ux/contact-write-through-wireframe.canvas.tsx).
> Plan : [`00-PLAN.md`](00-PLAN.md).
> Gel produit : [`../../DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § Gelé 04/09.

**Qualification : EVOL.** Le destinataire reste « 1 fournisseur + 1 contact mail ». L’e-mail ne vit **pas** sur la consultation.

Gelé le **04/09/2026**.

---

## Grain (inchangé)

| Objet | Grain | Rôle |
|--------|--------|------|
| **Consultation** | 1 panier + N destinataires | Grouper, envoyer, suivre |
| **Destinataire** | 1 fournisseur + 1 `PartnerContact` | Qui reçoit |
| **PartnerContact** | Personne (nom + e-mail) sur le partenaire | Référentiel ; `is_primary` pour le 1er créé ici |

Interdit : e-mail collé qui n’écrit pas `partner_contacts`.

---

## Critères gelés

**AC-1 — Promote `partners.email`.** 0 `PartnerContact` avec e-mail **et** `partners.email` non vide → POST destinataire **sans** `contactNom` / `contactEmail` **réussit**. L’API crée un `PartnerContact` (`is_primary`, nom = raison sociale si pas de nom), bind le destinataire. HTTP 201.

**AC-2 — Write-through.** 0 `PartnerContact` avec e-mail **et** `partners.email` vide → POST avec `contactEmail` (et `contactNom` optionnel) **crée** le contact principal, bind, et recopie l’e-mail sur `partners.email` s’il était vide. HTTP 201.

**AC-3 — Refus sans aucun e-mail.** 0 contact e-mail, `partners.email` vide, payload sans `contactEmail` → 4xx `consultation.destinataire.sans_email`. Message inline + champs nom/e-mail + lien fiche. **Pas** un override silencieux.

**AC-4 — Binding inchangé si contacts déjà là.** 1 contact e-mail → auto. N → `contactId` obligatoire (`contact_requis`). `contactNom` / `contactEmail` du POST **ignorés** (pas de 2ᵉ contact pour contourner le choix).

**AC-5 — E-mail invalide.** Write-through avec e-mail sans `@` (ou vide après trim alors qu’on en exige un) → 4xx `consultation.destinataire.email_invalide`. Aucun contact créé.

**AC-6 — UI.** 0 contact e-mail après choix fournisseur → champs **Nom** (optionnel) + **E-mail** (obligatoire pour Ajouter). Préremplir l’e-mail depuis `partners.email` s’il existe. Hint : le contact est enregistré sur la fiche fournisseur. Lien `/achats/fournisseurs/{id}` conservé. Testids : `consultation-destinataire-contact-nom`, `consultation-destinataire-contact-email`.

**AC-7 — Réutilisation.** Après write-through ou promote, un 2ᵉ ajout du **même** fournisseur sur une **autre** consultation (ou N contacts) suit AC-4 — plus de formulaire vide.

---

## AC 28/08 **amendés** (destinataires-envoi-suivi)

| Avant (28/08) | Après (04/09) |
|----------------|----------------|
| AC-5 : refus si aucun `PartnerContact.email` | vrai seulement s’il n’y a **aucun** e-mail (contact, `partners.email`, payload) |
| AC-6 : interdit coller / fallback / créer depuis la consultation | coller **autorise** ssi 0 contact e-mail **et** ça **crée** `PartnerContact`. Fallback `partners.email` = **promote**. |

AC-1…AC-4 et AC-7…AC-15 du RFQ 28/08 **inchangés**.

---

## Hors v1

- Liste / édition des contacts sur la fiche fournisseur.
- Synchro inverse à chaque save fiche (écrire `PartnerContact` dès le champ « contact principal » hors consultation).
- Téléphone / fonction au write-through.

---

## Scénarios e2e

Mode B owner. Fournisseurs **fabriqués dans la preuve**.

| Scénario | Couvre | Script |
|----------|--------|--------|
| `rfq-promote-email-fiche` | AC-1, AC-7 | write-through |
| `rfq-write-through-create` | AC-2, AC-6, AC-7 | write-through |
| `rfq-refus-aucun-email` | AC-3 | write-through + 279 adapté |
| `rfq-write-through-ignore-si-contacts` | AC-4 | write-through |
| `rfq-email-invalide` | AC-5 | write-through |
