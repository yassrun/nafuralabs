# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`. Legacy = `raster/lots` · `docs/specs/lots`.
> Arbre = `parent:` (lot → sous-lot → task). Sprint = champ `sprint:` sur la **task** seulement.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## nafuralabs-migration

- · `MIG-01` lot — Lot — Strangler workspace NafuraLabs
  - · `MIG-10` sous-lot — Sous-lot — Tranche 0 · Squelettes
    - · `MIG-11` task — Créer les dossiers canon vides
  - · `MIG-20` sous-lot — Sous-lot — Tranches 1–3 · nafura-platform
    - · `MIG-21` task — Pact baseline nafura-platform
    - · `MIG-22` task — Ops lab → nafura-platform/ops
    - · `MIG-23` task — Code platform → nafura-platform/
  - · `MIG-30` sous-lot — Sous-lot — Tranches 4–5 · sektor
    - · `MIG-31` task — Pact + Raster → sektor/
    - · `MIG-32` task — Ops + code → sektor/
  - · `MIG-40` sous-lot — Sous-lot — Tranches 6–7 · Conso + reste
    - · `MIG-41` task — Conso platform versionnée
    - · `MIG-42` task — Reste du workspace + drop products/

## raster

- · `RAS-10` lot — Lot — work
  - · `RAS-11` sous-lot — Sous-lot — CH-00-INIT-contrat-fichiers
    - ▸ `RAS-12` task — INIT — écrire SPEC + canvas work
    - ▸ `RAS-13` task — Walker + API — scan raster-src
    - ▸ `RAS-14` task — e2e — scan raster-src ignore pact
- · `RAS-20` lot — Lot — socle
  - · `RAS-21` sous-lot — Sous-lot — CH-00-INIT-shell
    - ▸ `RAS-22` task — INIT — SPEC + canvas socle

---

**21 live · 2 projets**
