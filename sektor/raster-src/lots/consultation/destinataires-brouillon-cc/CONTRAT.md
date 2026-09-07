# Contrat — Destinataires brouillon + N contacts (CC)

> Amende AC-4 / AC-6 de [`../destinataires-envoi-suivi/CONTRAT.md`](../destinataires-envoi-suivi/CONTRAT.md).
> **Remplace** [`../contact-write-through/CONTRAT.md`](../contact-write-through/CONTRAT.md) (promote / saisie inline).
> Canvas : [`ux/destinataires-brouillon-cc-wireframe.canvas.tsx`](ux/destinataires-brouillon-cc-wireframe.canvas.tsx).
> Plan : [`00-PLAN.md`](00-PLAN.md).
> Gel produit : [`../../DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § Gelé 04/09 (brouillon).

**Qualification : EVOL.** Même objet Achats. Le destinataire n’est plus « 1 contact ». L’e-mail ne se saisit **pas** sur la consultation.

Gelé le **04/09/2026**.

---

## Grain

| Objet | Grain | Rôle |
|--------|--------|------|
| **Consultation** | 1 panier + N destinataires | Grouper, envoyer, suivre |
| **Destinataire** | 1 fournisseur + **N** `PartnerContact` | Qui reçoit (To + CC) |
| **PartnerContact** | Personne (nom + e-mail) sur le partenaire | Référentiel, édité sur la fiche fournisseur |
| **Devis** | 1 fournisseur, sur cette consult | Inchangé |

Interdit : e-mail collé sur le RFQ ; créer un contact depuis le formulaire destinataire ; POST à chaque « Ajouter ».

---

## Critères gelés

**AC-1 — Brouillon.** « Ajouter » met le fournisseur + contacts **dans le tableau local**. Aucun `POST /destinataires`. Rien n’est persisté tant qu’on n’a pas **Enregistrer**.

**AC-2 — Enregistrer.** CTA **Enregistrer** sur la fiche (section destinataires) → `PUT /api/v1/consultations-achat/{id}/destinataires` avec la liste `{ fournisseurId, contactIds[] }`. Remplace les destinataires **non envoyés**. Un destinataire déjà au journal ne peut pas être retiré.

**AC-3 — Liste de contacts.** Après choix du fournisseur : cases à cocher des `PartnerContact` **avec e-mail**. ≥ 1 coché pour Ajouter. 1er coché = To, suivants = CC. Pas de champ nom/e-mail libre.

**AC-4 — Lien créer un contact.** 0 contact e-mail (ou pour en ajouter) : message inline + lien `/achats/fournisseurs/{id}?tab=contacts`. Ajouter désactivé. Pas de promote `partners.email`, pas de write-through.

**AC-5 — Fiche fournisseur.** Onglet **Contacts** (pas Informations) : liste + formulaire nom + e-mail + toggle **Principal**. Un seul principal par partenaire. `POST` / `PUT /api/v1/partner-contacts`. Lien consultation : `/achats/fournisseurs/{id}?tab=contacts`. Le principal est proposé en **À**. Retour consultation : recharger la liste, cocher le nouveau. Onglet **Contrats** à part : les contrats fournisseur de ce partenaire, jamais mélangés avec les personnes.

**AC-6 — Unique fournisseur.** Un fournisseur déjà dans le **brouillon** : Ajouter **met à jour** les contacts (pas un 2ᵉ destinataire). Unique `(consultation, fournisseur)` à la persistance.

**AC-7 — Envoi To+CC.** Un mail par destinataire (fournisseur). To = 1er contact, CC = les autres. Journal : e-mails joints. Devis / import magique : toujours 1 par fournisseur.

**AC-8 — Envoyer après save.** Envoyer est désactivé tant que le brouillon est sale. Après enregistrement : même règle 28/08 (destinataires persistés pas encore au journal).

---

## AC 28/08 **amendés**

| Avant | Après |
|--------|--------|
| AC-4 : Ajouter POST immédiat | Ajouter local ; persist = Enregistrer |
| AC-6 : 1 contact auto / N combobox | N cases ; 1 fournisseur + N contacts |
| AC-5 : refus si 0 `PartnerContact.email` | **rétabli** (le write-through 04/09 matin est cassé) |

AC-1…AC-3, AC-7…AC-15 du RFQ 28/08 **inchangés** (hors grain contact).

---

## Hors v1

- Édition des contacts **dans** la ligne destinataire déjà persistée (retrait / recochage) au-delà du remplacement via Ajouter sur le même fournisseur non envoyé.
- Téléphone / fonction dans le mail.
- Plusieurs mails distincts (un par contact) au lieu de To+CC.

---

## Scénarios e2e

Mode B owner. Fournisseurs **fabriqués dans la preuve**.

| Scénario | Couvre | Script |
|----------|--------|--------|
| `rfq-brouillon-sans-post` | AC-1, AC-2 | write-through (réécrit) |
| `rfq-liste-contacts-cc` | AC-3, AC-7 | write-through + unit |
| `rfq-lien-contacts-fiche` | AC-4, AC-5 | 279 + write-through |
| `rfq-refus-sans-email` | AC-4 / 28/08 AC-5 | 279 |
| `rfq-envoyer-apres-save` | AC-8 | 280 |
