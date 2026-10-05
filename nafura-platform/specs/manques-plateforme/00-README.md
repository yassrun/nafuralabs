# Manques de la plateforme — vague 3

Les vagues 1 et 2 (pagination serveur, vue tableau, actions de fiche, pièces jointes et notes, texte riche, notification sur transition, écran spécifique, document vers fiche) sont livrées. Le comportement est décrit dans `docs/UI.md`, `docs/PLATFORM.md`, `docs/ARCHITECTURE.md` et `ROADMAP.md`. Les fichiers de spec correspondants ont été retirés.

Les décisions des specs 09 à 12 sont tranchées (2026-10-04). Le socle est livré (permission opérateur, organisations, pages publiques API, audience, portées). Chaque spec garde une section « État » : les écrans de console, la coquille publique, le débit, l’effacement et le consentement restent ouverts.

À faire aussi, complément de la vague 2 : [08 bis Import : valeurs de référentiel](08bis-import-valeurs-referentiel.md).

Dette front : [13 Découpage des listes](13-decoupage-listes.md) — `nf-listing-flat` et `nf-listing-page` découpés par responsabilité, sans changement visible ni de configuration.

Notifications : [14 Préférences et inbox](14-notifications-preferences.md) (livré) ; suite [15 Temps réel, digest, e-mail](15-notifications-suite.md) — baseline 6,5/10 → cible ~8/10.

| Spec | Sujet | Décision |
|---|---|---|
| [09 Tenancy multi](09-tenancy-multi.md) | Plusieurs organisations | `platform.operator.*` uniquement via `spec.deploy.<env>.operators` (les jokers de rôle ne la couvrent jamais) ; démo en `multi`, `probe-bc` reste `single` ; `spec.runtime.signup: "operator" \| "open"` |
| [10 Pages publiques](10-pages-publiques.md) | Écrans sans connexion | `scope` sur `@PublicEndpoint` (`AGGREGATED` \| `ORGANISATION`) ; slug `/p/{slug}/` ; `@PublicField` explicite ; débit sur le dépôt et sur le lien e-mail |
| [11 Audience externe](11-audience-externe.md) | Personnes hors organisation | Un compte, audience sur l’appartenance, sélecteur existant étendu ; `@OwnedBy` sur le champ utilisateur, jamais `createdBy` ; effacement déclaré par entité |
| [12 Données hors organisation](12-donnees-hors-organisation.md) | Records sans `tenantId` | `@SharesWith` et champs explicites ; consentement versionné ; seed `kind: "reference"` de portée produit ou organisation |
