# Lot 8 — Suppression des tables `consultation`

**Objectif** : supprimer les tables du module `consultation`.

**À exécuter avec le lot 1.**

---

## Décision : pas de migration

**Q6 tranchée le 2026-07-19** : le produit n'est pas en production, les données en base ne sont pas
importantes. **Aucune donnée n'est reprise.**

Ce lot était initialement la partie la plus risquée de l'epic : une migration idempotente avec
correspondance d'entités, vérifications croisées, retour arrière — et un problème insoluble.

> `ConsultationComposant.quantite` est ambigu par construction : selon la saisie, il contient une
> quantité absolue **ou** un rendement, et rien dans les données ne permet de les distinguer. Toute
> conversion automatique aurait produit des rendements faux, silencieusement, qui auraient ensuite
> pollué la bibliothèque d'ouvrages — donc l'apprentissage de l'IA.

Ne rien reprendre supprime ce risque entièrement. C'est la bonne nouvelle de cet arbitrage.

---

## Tâches

### T8.1 — Vérifier que la décision tient toujours

Avant d'exécuter, confirmer que rien n'a changé depuis l'arbitrage :

```sql
SELECT
  (SELECT COUNT(*) FROM consultations)            AS consultations,
  (SELECT COUNT(*) FROM consultation_noeuds)      AS noeuds,
  (SELECT COUNT(*) FROM consultation_composants)  AS composants,
  (SELECT COUNT(*) FROM consultations
     WHERE status NOT IN ('BROUILLON','ANNULEE')) AS non_brouillon,
  (SELECT COUNT(DISTINCT tenant_id) FROM consultations) AS tenants;
```

Si des études non-brouillon apparaissent sur un tenant réel, **s'arrêter et revalider Q6** avant de
continuer.

### T8.2 — Sauvegarde de sécurité

Même si les données ne valent rien, un dump coûte deux minutes :

```bash
pg_dump -t consultations -t consultation_noeuds -t consultation_composants \
        nafura_erp > consultation-tables-$(date +%Y%m%d).sql
```

À conserver hors dépôt jusqu'à validation du lot 1 en staging.

### T8.3 — Changelog de suppression

`backend/modules/etudes/src/main/resources/db/changelog/schema/v1.1/001_drop_consultation.sql`

```sql
DROP TABLE IF EXISTS consultation_composants;
DROP TABLE IF EXISTS consultation_noeuds;
DROP TABLE IF EXISTS consultations;
```

Ordre imposé par les clés étrangères.

À exécuter **après** que le lot 1 a supprimé le code Java — sinon le démarrage de l'application
échoue sur des entités JPA sans table.

### T8.4 — Nettoyer les permissions

`app/src/main/resources/db/changelog/data/v1.0/005_consultation_permissions.sql` déclare les
permissions `consultation.*`. Les retirer, ou les renommer en `etude.*` selon les besoins du lot 2
(`etude.read`, `etude.create`, `etude.update`, `etude.delete`, `etude.submit`, `etude.approve`).

Vérifier qu'aucun rôle en base ne référence encore les anciennes permissions.

### T8.5 — Retirer le module du build

- supprimer `backend/modules/consultation/`
- retirer `:sektor:consultation` de `settings.gradle.kts`
- retirer la dépendance dans `backend/app/build.gradle`
- supprimer `backend/app/src/main/java/ma/nafura/erp/consultation/`
- nettoyer les imports dans `ErpApplication.java`

### T8.6 — Retirer le front

Le front `consultation` est remplacé par le dossier d'étude du lot 2.

⚠️ **Le front vivant est `web/app/applications/erp/`, pas `products/sektor-btp/web/app/`** — voir
Q5. Supprimer dans l'arbre réellement compilé, et dans l'autre si le chantier Q5 n'a pas encore eu
lieu.

Retirer aussi la route `/etudes/consultation` de la configuration de navigation.

---

## Critères d'acceptation

- [ ] La requête T8.1 confirme l'absence de données à valeur
- [ ] Dump de sauvegarde réalisé et conservé hors dépôt
- [ ] Les trois tables sont supprimées
- [ ] Les permissions `consultation.*` sont retirées ou renommées, aucun rôle orphelin
- [ ] `./gradlew :sektor:app:build` passe sans le module
- [ ] L'application démarre sans erreur JPA
- [ ] Plus aucune route `/etudes/consultation` dans la navigation
- [ ] `grep -rn "consultation" --include=*.java backend/` ne retourne que des occurrences sans
      rapport (ex. l'entité `Consultation` de `marches` si elle existe)
