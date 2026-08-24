---
id: SEKTOR-174
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
---

# Le jeton de signature cesse d'etre l'id de l'attachement

> AC-19. SignaturePublicController est @PublicEndpoint et resolveAttachementId renvoie le token tel quel : le jeton EST l'id. Jeton non devinable, date, usage unique.

## Étapes

- [ ] …

## Journal

```
23/08 22:00  posée
24/08 00:52  status → doing
24/08 04:55  étudié le patron déjà en place côté études (GuestAccessLink/GuestAccessService) — repris à l'identique pour la cohérence du produit
24/08 05:00  nouvelle entité AttachementSignatureToken (hash SHA-256, expiresAt, consumedAt) + AttachementSignatureTokenRepository (JpaRepository simple, pas de scope tenant — le jeton est le secret)
24/08 05:05  SignatureTokenInvalideException — un seul refus pour inconnu/expiré/consommé
24/08 05:20  AttachementSignatureService réécrit : genererLien (secret 32 octets, SecureRandom), getSignInfo/submitSignature résolvent par hash, submitSignature consomme le jeton
24/08 05:25  SignaturePublicController : @ExceptionHandler local → 404 uniforme, ne révèle jamais lequel des trois cas
24/08 05:30  AttachementWorkflowController : POST /api/v1/attachements/{id}/lien-signature (authentifié) — le seul endroit qui génère un jeton
24/08 05:35  migration schema/v1.5/001_jeton_signature_distinct_de_l_id.sql
24/08 05:45  tests : AttachementSignatureServiceTest (6 cas — jeton distinct de l'id, valide, inconnu, expiré, déjà consommé, vide/nul)
24/08 05:50  frontend : bouton « Obtenir le lien de signature » sur la page de saisie d'attachement (seul point d'entrée existant pour déclencher la génération, aucune page publique de signature ne préexistait dans le repo)
24/08 05:55  module chantiers : compile + 73/73 tests unitaires verts ; module etudes (référence du patron) : compile toujours propre, non modifié
24/08 01:09  status → review
24/08 01:45  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé.** `SignaturePublicController`/`AttachementSignatureService` ne traitent plus le jeton comme l'id de l'attachement. Nouvelle table `attachement_signature_tokens` : un secret aléatoire de 32 octets (`SecureRandom`, jamais stocké en clair — seul son hash SHA-256 l'est, comme `guest_access_links` côté études), daté (`expiresAt`, 7 jours par défaut) et à usage unique (`consumedAt`, posé à la soumission de la signature). `AttachementWorkflowController` expose `POST /api/v1/attachements/{id}/lien-signature` (authentifié) — seul endroit qui en génère un ; le jeton n'est rendu qu'à cet instant, jamais récupérable ensuite. `SignaturePublicController` garde son adresse `/api/v1/sign/{token}` mais un jeton inconnu, expiré ou déjà consommé rend désormais le même 404 (`chantiers.signature.jeton_invalide`), sans jamais dire lequel des trois ni si l'attachement existe.

**Critères prouvés (AC-19).**
- Jeton distinct de l'id : `genererLien_rendUnJetonDistinctDeLId`.
- Non devinable : secret de 32 octets aléatoires (`SecureRandom`), jamais l'id métier.
- Non énumérable : recherche par hash (`findByTokenHash`), jamais par id séquentiel — `AttachementSignatureTokenRepository` n'est même pas tenant-scopé pour éviter toute fuite d'index.
- Daté : `jetonExpire_estRefuse`.
- Usage unique : `jetonDejaConsomme_estRefuse` (la deuxième lecture **et** la deuxième soumission sont refusées après une signature déposée).
- Même refus, aucune fuite d'existence : `jetonInconnu_estRefuse`, `jetonExpire_estRefuse`, `jetonDejaConsomme_estRefuse` lèvent tous les trois la **même** `SignatureTokenInvalideException`, mappée au **même** 404 par `SignaturePublicController` — aucun ne distingue « attachement inexistant » de « jeton invalide ».
- `jetonVide_estRefuse` — pas de NPE sur un jeton nul ou vide.

**Décidé seul.**
1. **Repris le patron `GuestAccessLink`/`GuestAccessService`** déjà en place côté études (hash SHA-256, `SecureRandom` 32 octets, un seul type d'exception pour toute invalidité, `TenantContext` posé après résolution du jeton) plutôt que d'inventer un mécanisme distinct — deux façons de durcir un lien public dans le même produit auraient été une incohérence, pas une simplicité.
2. **Expiration à 7 jours**, valeur arbitraire non fixée par le contrat (qui dit seulement « daté »). Choisie pour laisser le temps au MOE de signer sur un chantier physique sans réseau garanti, alignée sur `AttachementSignatureService.DEFAULT_EXPIRY_DAYS` — un seul endroit à changer si ça ne convient pas.
3. **Ajouté un bouton « Obtenir le lien de signature »** sur la page de saisie d'attachement : sans lui, il n'existait **aucun** moyen de déclencher `genererLien`, et AC-19 aurait été un mécanisme mort. Constaté au passage : aucune page front ne consommait déjà `/api/v1/sign/{token}` — le lien public lui-même (page où le MOE dessine sa signature) n'existe nulle part dans le repo, avant comme après ce correctif. Non construit ici : c'est un écran entier, hors du périmètre d'un bug de sécurité sur le jeton.
4. **Pas de révocation manuelle du jeton** (« invalider ce lien sans attendre l'expiration »). Le contrat ne le demande pas explicitement (« daté » + « usage unique » sont couverts) ; ajouté comme dette si un incident (lien envoyé au mauvais destinataire) l'exige un jour.

**Écarts / dette.**
- **Aucune page publique de signature n'existe** pour consommer le lien généré (dessiner la signature, la déposer). `SignaturePublicController` répond correctement en API mais rien ne le sert à l'écran — gap pré-existant, pas introduit ici, mais qui rend AC-19 vérifiable seulement en API/unitaire, pas de bout en bout au navigateur.
- Pas de purge des jetons expirés/consommés (la table grossit indéfiniment) — sans impact fonctionnel au volume attendu, à surveiller si le produit grossit.
- Pas de révocation manuelle d'un jeton déjà émis (point 4 ci-dessus).
