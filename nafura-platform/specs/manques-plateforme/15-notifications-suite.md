# 15 — Notifications : suite (temps réel, digest, e-mail, dette)

## Objectif

Passer l’inbox plateforme d’un **6,5/10** (utilisable, préférences branchées) à un **~8/10** (présence live, digests réels, e-mail crédible). Le SMS et les modèles riches restent un palier ultérieur (~9).

## Note actuelle (baseline)

| Zone | Note | Commentaire |
|---|---|---|
| Moteur (déclaration, routeur, canaux, prefs) | 8 | Manifeste → org → user ; `mandatory` ; API + écrans livrés ([14](14-notifications-preferences.md)) |
| Inbox web | 6 | Vues, filtre événement, clic fiche ; pas de push dans `platform/notifications` |
| Temps réel | 3 | SSE backend + client `app/notification` existent ; **non branchés** sur la cloche / le centre host |
| E-mail immédiat | 5 | `EmailChannel` envoie ; lien souvent relatif ; expéditeur `noreply@seyrura.com` |
| Digest | 1 | `EmailDigestJob` vide (`TODO`) ; plus d’UI digest (retirée en 14) |
| SMS | 0 | Canal déclaré, pas d’implémentation ni de numéro sur `AppUser` |
| Dette legacy | 2 | `AlertRule` / `Broadcast` / `Escalation` sans usage ; `platform.legacy.transition` (Sektor) |

**Cible de ce chantier : ~8/10** après lots 1–3. SMS + modèles = chantier suivant.

## Besoin

1. La cloche et `/notifications` ne bougent qu’au refresh / ouverture.
2. Le digest quotidien est un job fantôme ; aucune préférence digest n’alimente le routeur.
3. L’e-mail n’est pas « produit » : URL relative, from hardcodé, corps HTML minimal.
4. Dettes qui embrouillent la lecture du module (`AlertRule`…, legacy transition).

## Existant

- SSE : `GET …/notifications/stream` (`NotificationController` + `NotificationStreamService`) ; push à la livraison in-app.
- Client SSE : `app/notification/services/notification-stream.service.ts` (fetch + Bearer, reconnect). Non utilisé par `platform/notifications`.
- Job : `EmailDigestJob` (`email-digest`, cron `0 0 8 * * *`, `tenantScoped`).
- E-mail : `EmailChannel` → `EmailService` ; `actionUrl` tel quel dans le HTML.
- Préférences : matrice événement × `in_app` / `email` (spec 14). Pas de fréquence digest.
- Canaux déclarés : `in_app`, `email`, `sms` (`DeclaredNotifications.CHANNELS`).

## Décisions

1. **Temps réel = SSE déjà là**, branché dans `platform/notifications` (pas un second bus, pas de WebSocket).
2. **Digest = e-mail groupé** des in-app non lues (ou non digérées) sur la fenêtre ; fréquence **utilisateur** `none` \| `daily` \| `weekly`, stockée hors matrice événement (réglage user-settings ou table dédiée lue par le job — **une** source, pas les anciens toggles globaux morts).
3. **Lien e-mail absolu** : base URL produit (`app.nafura.json` / config runtime), jamais inventée côté BC.
4. **SMS hors ce chantier** (fournisseur + champ téléphone).
5. **`AlertRule` / `Broadcast` / `Escalation`** : supprimer ou isoler une fois Sektor hors host ; pas de nouvel écran.
6. **`platform.legacy.transition`** : rester jusqu’à Sektor sur le host ; documenter, ne pas enrichir.

## Contrat — plan par lots

Chaque lot est livrable et vérifiable seul.

### Lot 1 — Temps réel (impact immédiat sur la note)

- Déplacer ou réutiliser le client SSE dans `platform/notifications` (un seul service host).
- À la connexion auth + tenant : ouvrir le stream ; à la déconnexion / changement d’org : fermer.
- Sur événement `notification` : incrémenter `unreadCount`, préfixer la liste si la vue courante le permet, animer / badge la cloche.
- Reconnect avec backoff (déjà dans le client legacy) ; pas de polling de secours obligatoire si le stream tient.
- Supprimer l’usage mort dans `app/notification` une fois le host branché (ou le faire pointer vers le service plateforme — **pas** deux clients).

### Lot 2 — Digest e-mail

- Implémenter le corps de `EmailDigestJob` : par tenant, pour chaque utilisateur avec fréquence ≠ `none`, agréger les notifications in-app éligibles depuis le dernier envoi, un seul mail « Vos alertes ».
- Préférence fréquence : champ utilisateur lu par le job (réintroduire **uniquement** `digestFrequency` dans Mes paramètres → Notifications, au-dessus de la matrice ; plus de toggles globaux `emailNotifications` / `inAppNotifications`).
- Weekly : même job, filtre jour (ex. lundi) ou cron dédié — trancher dans l’implémentation, une seule heuristique documentée dans `PLATFORM.md`.
- Utilisateur sans e-mail : skip + log.
- Marquer les lignes digérées (colonne ou table d’envoi) pour ne pas renvoyer le même lot.

### Lot 3 — E-mail crédible

- Résoudre `actionUrl` relatif → absolu avec l’origine web du produit (config unique).
- Expéditeur : propriété configurable (org ou produit), plus `noreply@seyrura.com` en dur comme seule option.
- Corps : titre, résumé, lien « Ouvrir » ; rester simple (pas de moteur de templates HTML par événement dans ce lot).
- Preuve lab : transition qui notifie → mail (ou log SMTP lab) avec URL cliquable `http://localhost:4400/…`.

### Lot 4 — Dette (après 1–3, ou en parallèle sans bloquer)

- Inventorier `AlertRule` / `Broadcast` / `Escalation` : tables + repos ; supprimer si aucun lecteur, sinon marquer `@Deprecated` + note ROADMAP.
- Ne pas toucher `platform.legacy.transition` tant que Sektor n’est pas sur le host.
- Mettre à jour `ROADMAP.md` et `PLATFORM.md` ; retirer ce fichier une fois les lots 1–3 livrés (le lot 4 peut rester une ligne ROADMAP).

## Hors chantier

- Canal SMS + numéro utilisateur.
- Modèles de message par canal / événement (éditeur riche).
- Mute par conversation, groupement inbox, digest in-app.
- Escalade workflow (autre chantier « Statuts et approbations »).

## Vérification

1. `node platform-host/ops/run.mjs check`
2. Lab : hard-refresh après chaque lot (le web ne recharge pas toujours les sources plateforme).
3. **Lot 1** : deux onglets `lead@host.local` ; soumettre une DA > 10k depuis un autre user → badge + ligne sans Actualiser.
4. **Lot 2** : fréquence daily ; forcer l’exécution du job (ou avancer l’horloge lab) → un mail agrégé ; `none` → aucun.
5. **Lot 3** : lien du mail ouvre la fiche / `/approvals` en absolu.
6. Aucune régression préférences (spec 14) ni filtre inbox.

## Critères d’acceptation

- [ ] Cloche et centre réagissent au SSE sans Actualiser.
- [ ] Un seul client SSE plateforme.
- [ ] `EmailDigestJob` envoie un digest réel selon la fréquence utilisateur.
- [ ] Liens e-mail absolus ; from configurable.
- [ ] Docs `PLATFORM.md` / `UI.md` / `ROADMAP.md` à jour.

## Documentation

- `PLATFORM.md` § Notifications : stream, digest, base URL e-mail.
- `UI.md` : cloche live ; fréquence digest dans Mes paramètres.
- `ROADMAP.md` : pointer cette spec ; retirer les items couverts à la livraison.
- Spec [14](14-notifications-preferences.md) : rester la référence des préférences événement × canal.

## État

Baseline documentée **6,5/10**. Lots 1–4 : à attaquer. Cible après 1–3 : **~8/10**.
