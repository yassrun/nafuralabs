# Contrat — Destinataires, envoi, suivi (RFQ)

> Ce sous-lot est autonome. Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Canvas : [`ux/destinataires-envoi-suivi-wireframe.canvas.tsx`](ux/destinataires-envoi-suivi-wireframe.canvas.tsx).
> Plan : [`00-PLAN.md`](00-PLAN.md).
> Gel produit : [`../../DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § Gelé 28/08.
> Chrome conservé : [`../../raffinement-ux-pro/achats-consultation-ux-pro/CONTRAT.md`](../../raffinement-ux-pro/achats-consultation-ux-pro/CONTRAT.md) AC-1…AC-9, AC-12 (panier) — **AC-10 et AC-11 cassés**.

**Qualification : EVOL.** Objet Achats + import magique + listing entity déjà là. Le grain « 1 fournisseur » (gel 22/08, `fournisseur_id` NOT NULL) est **faux**.

Gelé le **28/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

**Voie unique :** `/achats/consultations/new` = panier seulement. Pas de wizard 2 étapes. Destinataires + envoi + import = fiche.

---

## Grain

| Objet | Grain | Rôle |
|--------|--------|------|
| **Consultation** | 1 panier + N destinataires | Grouper, envoyer, suivre |
| **Destinataire** | 1 fournisseur + 1 contact mail | Qui reçoit |
| **Devis** | 1 fournisseur, sur cette consult | Réponse (import magique confirmé) |

Ordre des gestes : **panier d’abord** → **destinataires ensuite** → envoyer (action) → importer par destinataire.

---

## Statuts gelés

### Destinataire

| Code | Libellé FR | Sens |
|------|------------|------|
| `EN_ATTENTE` | En attente | Pas de devis qui compte |
| `DEVIS_RECU` | Devis reçu | Import magique **confirmé** pour ce destinataire |

L’envoi est un **fait** (ligne de journal), pas un statut métier.

### Consultation (dérivé — 4 valeurs, pas plus)

| Code | Libellé FR | Règle |
|------|------------|--------|
| `PREPARATION` | Préparation | 0 ligne au journal d’envoi |
| `OUVERTE` | En attente de réponses | ≥ 1 envoi **et** 0 devis qui compte |
| `PARTIELLE` | Partielle | ≥ 1 devis qui compte **et** ≥ 1 destinataire `EN_ATTENTE` |
| `COMPLETE` | Complète | ≥ 1 destinataire **et** tous en `DEVIS_RECU` |

0 destinataire ⇒ `PREPARATION`. Ajouter un destinataire après `COMPLETE` ⇒ `PARTIELLE`.

**Devis qui compte :** dernier import magique confirmé (lignes persistées) **sur ce destinataire**. Fichier sans extraction ≠ devis. Re-import confirmé sur le même destinataire **remplace** ; ça reste 1 devis qui compte.

Conserver l’entier `devisRecus` (nombre de destinataires en `DEVIS_RECU`) pour le flag 137 / agrégat 249 — **sans** modifier overlay ni flag dans ce sous-lot.

---

## Critères gelés — création (casse AC-10 / AC-11 UX pro)

**AC-1 — Create = panier seulement.** `/achats/consultations/new` n’a **aucun** champ fournisseur (plus de combobox `lookupKey: fournisseurs`). Subtitle / copy : panier d’articles, pas « un fournisseur + panier ».

**AC-2 — Panier picker.** ≥ 1 ligne article via `app-article-picker` (contrat picker inchangé). Ajouter / retirer. Panier vide → pas de POST ; message inline.

**AC-3 — Payload create.** POST **sans** `fournisseurId` obligatoire. Si le champ est encore envoyé (overlay 139, vieux e2e) : **l’ignorer** — ne pas attacher de destinataire. Succès → fiche, statut `PREPARATION`.

---

## Critères gelés — destinataires

**AC-4 — Ajout sur la fiche.** Combobox `lookupKey: fournisseurs` (socle lookups). Un fournisseur déjà présent sur **cette** consultation → refus (pas de doublon).

**AC-5 — Contact mail obligatoire.** Ajout **refusé** si le partenaire n’a aucun `PartnerContact` avec `email` non vide (`partner_contacts`). Message inline + **lien** `/achats/fournisseurs/{id}`. HTTP 4xx côté API.

**AC-6 — Pas de mail saisi ici.** Interdit : coller un e-mail à la main, fallback `partners.email`, créer un contact depuis le champ consultation. Binding : 0 contact e-mail → AC-5 ; **1** → auto ; **N** → choix borné parmi ces contacts (pas de texte libre).

**AC-7 — Create sans destinataire.** Une consultation **peut** exister avec panier et 0 destinataire (`PREPARATION`). L’envoi est alors impossible (AC-8).

---

## Critères gelés — envoi

**AC-8 — Action Envoyer.** CTA **Envoyer la consultation** sur la fiche. Exige ≥ 1 destinataire. Un mail par destinataire **jamais présent au journal**, à l’e-mail de **son** contact. Corps : n° consultation + lignes panier (code, désignation). Pas de lien portail. CTA désactivé s’il n’existe aucun destinataire non envoyé.

**AC-9 — Journal = preuve.** Chaque envoi écrit : destinataire, e-mail, date. Lecture API + tableau fiche. Passage par `EmailService` (`sendEmail` / équivalent). Mode B : no-op Brevo **accepté** — le journal suffit. Pas d’exigence d’e-mail réellement parti.

**AC-10 — Panier figé après le 1er envoi.** Dès la 1re ligne de journal : plus d’ajout / retrait d’article (4xx + message). On **peut** encore ajouter un destinataire ; un nouvel envoi ne mail que les **nouveaux** (absents du journal).

---

## Critères gelés — suivi, listing, import

**AC-11 — Statut destinataire.** `EN_ATTENTE` | `DEVIS_RECU` selon AC ci-dessus. Visible par ligne (tableau suivi).

**AC-12 — Statut consultation dérivé.** `PREPARATION` | `OUVERTE` | `PARTIELLE` | `COMPLETE` selon le tableau. Badge fiche + listing. Plus de couple unique `DEMANDE` / `DEVIS_RECU` comme vérité.

**AC-13 — Listing.** Plus de colonne « le » fournisseur (casse AC-2 UX pro sur ce point). Colonnes minimales : n°, destinataires (libellés, pas UUID, ex. `Lafarge, Sika (2)`), panier, avancement **k/n** devis + badge statut dérivé, lien étude. Anatomy `nf-entity-listing` **conservée**.

**AC-14 — Import magique ciblé.** Seul chemin PU. CTA **par ligne destinataire**, pas un import orphelin sur la fiche. `destinataireId` obligatoire. Moteur / revue d’extraction inchangés (SEKTOR-135). Pas de saisie manuelle PU.

**AC-15 — Un devis qui compte par destinataire.** 1er import confirmé sur un destinataire (d’autres encore `EN_ATTENTE`) → consultation `PARTIELLE`. Tous les destinataires ont un devis qui compte → `COMPLETE`. Import confirmé sans destinataire → 4xx.

---

## Chrome conservé (pas d’AC nouveaux)

- Listing / fiche entity anatomy (UX pro AC-1, AC-3, AC-4 chrome, AC-6).
- Picker panier, plus de textarea `cle_stable` (UX pro AC-7, AC-8, AC-9).
- Menu Achats `/achats/consultations`, create hors étude.
- Overlay 139 + flag CONSULTÉ : **hors** — ne pas les ouvrir. Create overlay peut encore poster `fournisseurId` (ignoré, AC-3).

---

## Hors v1 (dette nommée, pas AC)

- Overlay étude : create encore « 1 fournisseur + article courant » ; liste overlay encore « le » fournisseur — **lot overlay**, pas ici.
- e2e `verify-consultation-achat-134.mjs` / `135.mjs` / agrégat `249.mjs` : étendre au nouveau payload (create sans assert `fournisseurId` ; import + `destinataireId` ; statuts dérivés). 134 **dans 279** ; 135 **dans 281** ; 249 **dans 282** si encore rouge après 281.
- Portail fournisseur, attribution / BC, scoring AO, saisie PU, pièce jointe PDF obligatoire à l’envoi, Brevo réel Mode B.

---

## Scénarios e2e (noms) + état initial

L’exec implémente le script de sa task ; le QA joue l’agrégat. Mode B : `make -C nafura-platform/ops mode-b`, identité **owner** (`qa@nafuralabs.local`).

| Scénario | Couvre | Script |
|----------|--------|--------|
| `rfq-create-panier` | AC-1, AC-2, AC-3, AC-7 | 279 |
| `rfq-refus-sans-email` | AC-5, AC-6 | 279 |
| `rfq-deux-destinataires` | AC-4, AC-6, AC-7 | 279 |
| `rfq-envoyer-journal` | AC-8, AC-9 | 280 |
| `rfq-panier-fige` | AC-10 | 280 |
| `rfq-renvoi-nouveaux` | AC-8, AC-10 | 280 |
| `rfq-import-un-destinataire` | AC-11, AC-14, AC-15 → `PARTIELLE` | 281 |
| `rfq-second-devis-complet` | AC-12, AC-15 → `COMPLETE` | 281 |
| `rfq-listing-kn` | AC-13 | 281 |
| agrégat + 135 / 249 adaptés | non-régression **nouveau modèle** | 282 |

**État initial :** tenant `qa-local` ; ≥ 2 articles actifs (picker / `clesStables`) ; fournisseurs **fabriqués dans la preuve** : un sans contact e-mail (refus), ≥ 2 avec `POST /api/v1/partner-contacts` e-mail non vide. Pas de seed demo (`NAFURA_DEMO_RUNTIME_SEED`).
