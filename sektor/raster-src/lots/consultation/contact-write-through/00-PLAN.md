# Contact write-through depuis la consultation

> Sans contact e-mail, l’acheteur saisit nom + e-mail **sur la consultation** ; ça crée un `PartnerContact` (principal) sur le fournisseur, puis bind le destinataire. Pas d’e-mail orphelin sur le RFQ.

Contrat : [`CONTRAT.md`](CONTRAT.md) (AC-1…AC-7).
Canvas : [`ux/contact-write-through-wireframe.canvas.tsx`](ux/contact-write-through-wireframe.canvas.tsx).
Amende : [`../destinataires-envoi-suivi/CONTRAT.md`](../destinataires-envoi-suivi/CONTRAT.md) AC-5 / AC-6 (gel 28/08).
Gel : [`../../DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § Gelé 04/09.

## Intention

Quand ce sous-lot est livré, ajouter un destinataire ne bloque plus si la fiche n’a pas de `PartnerContact` : soit `partners.email` (contact principal) est promu en contact, soit l’acheteur complète nom + e-mail **ici**, et le contact est écrit sur le fournisseur. La prochaine consultation réutilise ce contact (1 → auto, N → choix borné).

## Périmètre

Inclus :

- POST destinataire : 0 `PartnerContact` e-mail → promouvoir `partners.email` **ou** créer depuis `contactNom` + `contactEmail`.
- Contact créé : `is_primary = true` ; si `partners.email` vide, le recopier.
- Fiche consultation : champs nom + e-mail si 0 contact ; préremplissage depuis `partners.email` ; hint « enregistré sur la fiche » ; lien fiche conservé.
- Binding inchangé si ≥ 1 contact e-mail (1 auto / N choix). Write-through **ignoré** dans ce cas.
- Refus 4xx s’il n’y a **aucun** e-mail (ni contact, ni `partners.email`, ni payload).

Exclus :

- Override e-mail stocké seulement sur la consultation / le destinataire.
- Écran liste des contacts sur la fiche fournisseur (dette nommée).
- Création de contact depuis le combobox lookup.
- Overlay étude, portail, envoi, import magique.

## Approche

Lab : pas de changelog. `PartnerContact` et `partners.email` existent. `ConsultationDestinataireCreateDto` gagne `contactNom` / `contactEmail` optionnels.

`rfq-refus-sans-email` (279) : le partenaire **avec** `partners.email` n’est plus un refus — c’est la promotion. Le refus reste : aucun e-mail nulle part. Adapter 279 ; preuves nouvelles dans ce sous-lot.

Risque : double source « contact principal » (`partners.email`) vs `partner_contacts` — ce tour les relie à l’ajout destinataire, pas une synchro complète à chaque save fiche.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-311 Plan + contrat + canvas write-through | spec | — |
| 2 | SEKTOR-312 API promote / create PartnerContact | exec | 311 |
| 3 | SEKTOR-313 UI champs + preuves e2e | exec | 312 |

## Validation technique

Mode B owner : `make -C nafura-platform/ops mode-b`, `qa@nafuralabs.local`. Graphe fabriqué dans la preuve.

| Script | Couvre |
|--------|--------|
| `node sektor/e2e/scripts/verify-consultation-contact-write-through.mjs` | AC-1…AC-7 |
| `node sektor/e2e/scripts/verify-consultation-rfq-279.mjs` | non-régression : refus **sans aucun e-mail** ; 1 / N contacts |

## Blocages extérieurs

Aucun. Le gel 28/08 AC-6 est **amendé** ici (acte humain 04/09 dans ce chat).
