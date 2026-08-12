---
id: OPS-01
status: todo
context: nafura
kind: task
priority: P1
assignee: me
gate: me
tags: [mail, zimbra, migration, google-workspace]
---


# Configurer Zimbra + migrer ykarkafi@nafuralabs.com depuis Google Workspace

> Boîte perso Nafura Labs : quitter Google Workspace vers Zimbra.
> Adresse cible : `ykarkafi@nafuralabs.com`.

## Critères d'acceptation
- [ ] Compte Zimbra créé / actif pour `ykarkafi@nafuralabs.com`
- [ ] Client mail (web ou desktop) configuré et envoi/réception OK
- [ ] DNS domaine `nafuralabs.com` : MX / SPF / DKIM / DMARC pointent vers Zimbra (plus Gmail)
- [ ] Migration historique mail (IMAP ou outil Zimbra) depuis Google Workspace
- [ ] Contacts / agenda migrés ou décision explicite de ne pas migrer
- [ ] Ancienne boîte Google : redirection ou désactivation documentée
- [ ] Test : envoyer + recevoir un mail externe, vérifier spam/auth

## Notes
- Variante vue dans le repo : `yassine.karkafi@nafuralabs.com` (creds) vs `ykarkafi@nafuralabs.com` (Let's Encrypt) — aligner l’alias.
- Hors code monorepo : DNS + admin Google + admin Zimbra.

## Journal
```
05/08 11:09  capturé · promu OPS-01
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
