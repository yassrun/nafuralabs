# Aligner l’arbre web / backend

> Même liste de dossiers des deux côtés. `DECISIONS.md` est la loi. Comportement inchangé.

Cible :

```text
backend/                         web/app/
  app/           boot only
  socle/                           socle/     (+ approbations, analytics, pilotage)
  catalogue/                       catalogue/ (+ inventory, console, bibliotheque-prix)
  etudes/                          etudes/    (− bibliotheque-prix)
  chantiers/                       chantiers/
  marches/                         marches/
  achats/                          achats/    (+ fournisseurs, plus de partner)
  ventes/                          ventes/    (+ clients)
  finance/                         finance/   (+ currency)
  rh/                              rh/
  hse/                             hse/
```

Hors lot : implémenter le type ICE/RC (déjà déclaré au socle). Décision différée.
