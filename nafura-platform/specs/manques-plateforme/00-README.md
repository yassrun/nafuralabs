# Manques de la plateforme — vague 3

Les vagues 1 et 2 (pagination serveur, vue tableau, actions de fiche, pièces jointes et notes, texte riche, notification sur transition, écran spécifique, document vers fiche) sont livrées. Le comportement est décrit dans `docs/UI.md`, `docs/PLATFORM.md`, `docs/ARCHITECTURE.md` et `ROADMAP.md`. Les fichiers de spec correspondants ont été retirés.

**La vague 3 ne démarre pas** tant que les décisions ouvertes de ces specs n’ont pas été tranchées par le responsable plateforme.

À faire sans attendre (complément de la vague 2, aucune décision ouverte) : [08 bis Import : valeurs de référentiel](08bis-import-valeurs-referentiel.md).

| Spec | Sujet | Décision qui bloque |
|---|---|---|
| [09 Tenancy multi](09-tenancy-multi.md) | Plusieurs organisations dans un déploiement | Permission d’opérateur plutôt qu’un rôle ; la démo reste `single` (second produit lab ou non) ; inscription libre ou non |
| [10 Pages publiques](10-pages-publiques.md) | Écrans sans connexion, dépôt public, projection conditionnelle | Agrégation publique d’organisations ; forme exacte du contrôleur public. **Ajouté le 2026-10-04** : dépôt public (écriture sans connexion) et masquage conditionnel d’un champ (enregistrement confidentiel) |
| [11 Audience externe](11-audience-externe.md) | Personnes hors organisation | Un compte ou deux (membre et externe) — toujours ouvert. **Tranché le 2026-10-04** : inscription implicite (compte créé au premier dépôt public) et connexion par lien e-mail, sans mot de passe |
| [12 Données hors organisation](12-donnees-hors-organisation.md) | Records sans `tenantId` | `@OwnedBy` ou `ownerId` ; effacement ou anonymisation ; partage par annotation ou manifeste ; consentement ; catalogue produit ou référentiel par organisation |

Ne pas inventer ces mécanismes. Reprendre chaque spec quand la décision est écrite.
