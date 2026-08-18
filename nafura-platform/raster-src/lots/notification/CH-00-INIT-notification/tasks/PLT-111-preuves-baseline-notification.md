---
id: PLT-111
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-110]
tags: [platform, notification]
---

# Preuves — baseline notification

> 2 lignes max.

## Étapes

- [x] Revue SPEC + CH — AC-1 · AC-2 · AC-4 · AC-5
- [x] Vérifier discrimination rouge-puis-vert dans le journal PLT-110
- [x] Exécuter `node --test` des 4 wrappers (Gradle `--rerun-tasks` d'abord)
- [x] Rapport de livraison + verdict

## Journal

```
16/08 14:15  posée
17/08 21:08  sprint → 2026-W34
17/08 21:27  status → doing
17/08 21:28  gradle --rerun-tasks NotificationBaselineTest — 4 tests, 0 failures (XML 20:28:56Z, pas le cache exec 20:21:52Z)
17/08 21:29  node --test 4 wrappers — tests 4 pass 4 fail 0
17/08 21:30  revue SPEC/CH AC-1·2·4·5 pass ; discrimination PLT-110 journal 21:20/21:21
17/08 21:30  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Rien de produit. Revue SPEC/CH + exécution des 4 e2e `notification-*` depuis le worktree `CH-00-INIT-notification`. Gradle relancé `--rerun-tasks` (cache exec écarté).

critères prouvés     AC-1 → revue SPEC : fichier `pact/notification/SPEC.md` présent ; `not_owns` = 6 exclusions, chacune nomme le responsable (ops · le produit · identité · commentaire · approbation · le produit/impression/ops).
                     AC-2 → revue CH « Coupe — Notifier, pas transporter ; canal → ops » + SPEC `INV-3` / `R-4` / ligne `not_owns` Transporteur → ops.
                     AC-3 → exécuté (worktree) :
                       `gradlew :platform:features:collaboration:notification:test --tests …NotificationBaselineTest.{deposerEtLister,deuxTenants,marquerLue,autreDestinataire} --rerun-tasks`
                       → `BUILD SUCCESSFUL in 1m 1s` · XML `tests="4" failures="0" errors="0"` (deposerEtLister · deuxTenants · marquerLue · autreDestinataire).
                       `node --test nafura-platform/e2e/notification/*.test.mjs`
                       → `# tests 4` `# pass 4` `# fail 0` — `notification-deposer-et-lister` · `notification-deux-tenants` · `notification-marquer-lue` · `notification-autre-destinataire`.
                       Discrimination : journal PLT-110 `17/08 21:20` asserts contraires 4 failed (deposerEtLister liste ; deuxTenants B vide ; marquerLue isRead true ; autreDestinataire Q vide) puis `21:21` inversion 4 pass. Pas d'e2e Brevo/push — `INV-3`, hors trou AC-3.
                     AC-4 → revue : Intention + owns/not_owns + règles suffisent à classer un besoin (déposer un message à une personne = oui ; transporter via Brevo = ops ; devis/chantier = produit ; commenter = commentaire).
                     AC-5 → revue : aucune règle métier produit. `INV-1` (entité opaque) ; noms devis/chantier/alerte ERP/paie interdits comme types ; `POL-PAS-METIER-PRODUIT`. Les mots produit n'apparaissent qu'en exclusion.

décidé seul          Preuve AC-3 = Gradle `--rerun-tasks` (cache XML exec 20:21:52Z écarté) puis wrappers `node --test`. Revue humaine AC-1/2/4/5 faite ici, pas déléguée. Pas de feature/bug sœur à passer (tech PLT-110 déjà done-me). PLT-109/110 non touchés.

écarts / dette       Aucun. Pas d'e2e canal (`INV-3`) ni frontière jar (`CH-01-TECHNICAL-plier`) — hors contrat INIT. SPEC inchangée (constat spec 2026-08-17 confirmé). Inbox : rien.
