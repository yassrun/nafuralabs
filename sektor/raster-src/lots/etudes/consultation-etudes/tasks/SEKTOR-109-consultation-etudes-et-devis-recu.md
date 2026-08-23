---
id: SEKTOR-109
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-106]
tags: [etudes]
---

# Consultation etudes et devis recu

> Gelé DECISIONS-PRODUIT.md 20/08 — objets Consultation études + Devis consultation liés à l'étude et à une fiche fournisseur. Pas OffreFournisseur, pas flag CONSULTE manuel.

Contrat : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) § consultation fournisseurs. Pas de canvas tant que c’est API + persistance (UI = SEKTOR-112).

## Étapes

- [x] Objet **Consultation études** accroché au **dossier**, périmètre = paquet d’identités (`cle_stable`) pris sur plusieurs postes. Pas une consult par poste / par ligne DPU.
- [x] Fournisseurs = fiches **achats** existantes. Inviter ≠ consulté.
- [x] Objet **Devis consultation** : devis reçu, lié à la consultation **et** à un fournisseur. Un fournisseur = au plus un devis qui compte.
- [x] Ne pas réutiliser `OffreFournisseur` (AO achats) ni le devis client. Un PDF orphelin `DEVIS_FOURNISSEUR` sur le dossier **ne compte pas**.
- [x] Preuve : persister une consultation + un devis reçu ; un PDF dossier sans lien n’incrémente pas le compteur.

## Journal

```
20/08 19:21  posée
20/08 20:03  status → doing
20/08 20:15  tsk1 schema 024_consultation_etudes.sql
20/08 20:20  tsk2 agrégats ConsultationEtude + DevisConsultation (pas OffreFournisseur)
20/08 20:28  tsk3 API /dossiers/{id}/consultation (+ devis) ; invite ≠ compteur
20/08 20:32  tsk4 unit tests verts ; e2e écrit
20/08 20:33  e2e VU ROUGE avant restart : POST consultation → 404 No static resource
20/08 20:34  décidé : 1 consultation / dossier (get-or-create) ; devis reçu auto-ajoute l'invite
20/08 20:09  status → review
20/08 20:31  status → doing
20/08 20:38  tsk5 Liquibase 025 : chk dossier_documents + DEVIS_FOURNISSEUR
20/08 20:40  probe POST documents type DEVIS_FOURNISSEUR → 201 (plus 500 chk)
20/08 20:40  status → review
20/08 20:42  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Liquibase `024_consultation_etudes.sql` ; API `POST/GET /api/v1/etudes/dossiers/{id}/consultation` + `/devis` + `/fournisseurs` + `/paquet`. `025_dossier_documents_devis_fournisseur.sql` élargit `dossier_documents_type_chk` à `DEVIS_FOURNISSEUR` pour que le PDF orphelin existe sans compter.
critères prouvés     Consultation + devis reçu → `devisRecus=1` ; invite FB → toujours 0 ; PDF `DEVIS_FOURNISSEUR` orphelin → 0 ; 2e devis même fournisseur → 409 ; 2e fournisseur → 2. Unit `ConsultationEtudeServiceTest`. e2e vu rouge (404) avant endpoint. Relance QA FAIL : POST documents 500 chk — probe après 025+restart : POST `DEVIS_FOURNISSEUR` → 201. e2e non réécrit, QA rejoue.
décidé seul          Une consultation par dossier (ouvrir = get-or-create). Devis reçu rattache le fournisseur aux invités s'il n'y était pas. Fichier lié optionnel ; lignes optionnelles (identification = 112). ALTER chk plutôt que réécrire 003 (déjà appliqué).
écarts / dette       e2e `consultation-etudes-devis-recu.spec.ts` à rejouer par QA (`--workers=1`). UI chrome = 112.
