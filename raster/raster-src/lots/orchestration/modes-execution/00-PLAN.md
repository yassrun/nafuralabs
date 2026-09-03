# Modes d'exécution et pipeline simple

> Raster choisit un mode local ou agents, lance un harness Cursor par sous-lot et suit son résultat.

## Intention

Le MVP ne porte plus de QA dédiée, de preuve comme phase, de gate humaine pendant l'exécution, ni de statuts intermédiaires de validation. L'humain intervient à l'inbox, à la promotion et au passage de Ready vers Session.

## Périmètre

- Pipeline unique `Spec → Code → Done`.
- Mode `local` : harness Cursor local, tâches Code en série dans le worktree du sous-lot.
- Mode `agents` : harness Cursor Cloud, tâches Code indépendantes annoncées comme vague parallélisable.
- Choix du mode depuis Session, transmis au moteur et visible dans l'état runtime.
- Migration de l'ancien schéma vers le MVP, sans conserver de couche de compatibilité.

Exclus : intégration ou merge automatique de branches produites par plusieurs agents cloud. Le harness Cursor reste responsable de l'exécution interne et rend un statut consolidé au sous-lot.

## Approche

Raster démarre toujours une seule sous-session par sous-lot. Le brief moteur contient le front exécutable : Spec avant Code, puis les Tasks Code dont les dépendances internes sont closes. En mode agents, plusieurs Tasks Code du même front peuvent être confiées en parallèle par le harness Cursor ; Raster ne lance pas plusieurs processus concurrents sur le même worktree.

## Tasks

- RAS-113 — moteur, API, UI, documentation et tests.

## Validation technique

- Tests du moteur : modes fermés, front Spec/Code, parallélisme seulement en mode agents.
- Tests du spawn : mode et brief transmis sans secret dans le dépôt.
- Build de l'app Raster.
- `node raster/t.mjs check`.

## Décisions ouvertes

Aucune. Le MVP choisit explicitement la simplicité : pas de QA dédiée et pas d'attente humaine pendant une sous-session.
