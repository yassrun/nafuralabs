# Lot 2 — Dossier d'étude et wizard

**Objectif** : créer l'agrégat orchestrateur qui manquait à `etudes`, et porter le wizard de
`consultation` (3 étapes) vers un parcours en 5 étapes.

**Dépend de** : lot 1.

---

## Ce qu'on récupère de `consultation`

C'est le seul apport réel du module supprimé, et il est bon :
- `currentStep` persisté (reprise du parcours après déconnexion)
- gates entre étapes
- `WizardShellComponent` + `TreeTableComponent` côté front

Ce qu'on corrige au passage : les gates échouent en silence côté front (`canProceed()` grise le
bouton sans dire pourquoi), alors que le back produit de bons messages qui ne sont jamais affichés.

---

## Tâches

### T2.1 — Entité `DossierEtude`

Voir `00-ARCHITECTURE.md` §2.1 pour la définition complète.

```sql
CREATE TABLE dossiers_etude (
    id                          UUID PRIMARY KEY,
    tenant_id                   UUID NOT NULL,
    numero                      VARCHAR(50)  NOT NULL,
    objet                       VARCHAR(500) NOT NULL,
    cps_document_id             VARCHAR(100),
    bordereau_document_id       VARCHAR(100),
    appel_offre_client_id       UUID,
    dpgf_id                     UUID REFERENCES dpgf(id) ON DELETE SET NULL,
    current_step                INT NOT NULL DEFAULT 1,
    status                      VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    frais_generaux_percent_defaut NUMERIC(8,4),
    marge_percent_defaut          NUMERIC(8,4),
    tva_taux_defaut               NUMERIC(8,4),
    -- Marge globale éventuelle appliquée par-dessus les marges par article.
    -- Provisionnée dès maintenant : la table n'existe pas encore, donc la colonne est
    -- gratuite aujourd'hui et serait une migration demain (cf. lot 10, règle R2).
    -- Sémantique à confirmer — voir Q15. Laisser NULL tant que ce n'est pas tranché.
    marge_globale_percent         NUMERIC(8,4),
    devis_genere_id             UUID,
    notes                       TEXT,
    created_by                  VARCHAR(100),
    updated_by                  VARCHAR(100),
    version                     BIGINT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL,
    updated_at                  TIMESTAMPTZ NOT NULL,
    CONSTRAINT dossiers_etude_numero_uk UNIQUE (tenant_id, numero)
);
CREATE INDEX dossiers_etude_tenant_status_idx ON dossiers_etude (tenant_id, status);
```

> Le `UNIQUE (tenant_id, numero)` est important : la génération actuelle
> (`String.format("CONS-%04d", count + 1)`) est sujette aux collisions en concurrence. Prévoir un
> retry sur violation de contrainte, ou une séquence par tenant.

### T2.2 — Machine à états en objet de domaine

Ne pas éparpiller les `if (status.equals(...))` dans les services — c'est la faute du code actuel
(la logique de verrouillage est dupliquée dans `ConsultationService.assertNotLocked` et
`ConsultationNoeudService.requireEditableConsultation`, avec des listes légèrement différentes).

```java
public enum StatutDossierEtude {
    BROUILLON, EN_ETUDE, EN_VALIDATION, VALIDEE,
    DEVIS_GENERE, GAGNE, PERDU, CONVERTIE, ANNULE;

    public boolean estModifiable() {
        return this == BROUILLON || this == EN_ETUDE;
    }

    public boolean peutTransitionnerVers(StatutDossierEtude cible) { /* table §3 ARCHITECTURE */ }
}
```

Un seul point de contrôle : `DossierEtudeService.assertModifiable(dossier)`.

### T2.3 — Gates d'étape

Interface dédiée, une implémentation par étape — pas un `switch` géant comme
`ConsultationService.assertGate()`.

```java
public interface EtapeGate {
    int etape();
    ResultatGate evaluer(DossierEtude dossier, Dpgf dpgf);
}

public record ResultatGate(
    boolean bloquant,
    List<ProblemeGate> problemes    // { noeudId, codeArticle, libelle, message }
) {
    public boolean passe() { return problemes.isEmpty(); }
}
```

**Important** : `ResultatGate` retourne la **liste des articles fautifs**, pas juste un booléen ou un
message. C'est ce qui permet à l'UI d'afficher des liens cliquables au lieu d'un bouton grisé.

Implémentations : `GateBordereau` (1), `GateDescriptifs` (2, non bloquant), `GateDecomposition` (3),
`GateConsultationFournisseurs` (4, non bloquant), `GateChiffrage` (5). Détail des règles dans
`00-ARCHITECTURE.md` §4.

### T2.4 — API

```
GET    /api/v1/etudes/dossiers                 liste (paginée)
POST   /api/v1/etudes/dossiers                 création
GET    /api/v1/etudes/dossiers/{id}            détail (sans l'arbre)
GET    /api/v1/etudes/dossiers/{id}/arbre      arbre paginé par lot
PUT    /api/v1/etudes/dossiers/{id}            mise à jour (en-tête)
DELETE /api/v1/etudes/dossiers/{id}

GET    /api/v1/etudes/dossiers/{id}/gates      état des 5 gates, sans transition
PUT    /api/v1/etudes/dossiers/{id}/etape      { etape: 1..5 }
POST   /api/v1/etudes/dossiers/{id}/soumettre  → EN_VALIDATION
POST   /api/v1/etudes/dossiers/{id}/valider    → VALIDEE (permission distincte)
POST   /api/v1/etudes/dossiers/{id}/refuser    { motif } → EN_ETUDE
```

`GET /gates` est nouveau et central : le front interroge l'état des gates au lieu de le recalculer.
Ça supprime la duplication actuelle de la logique de gate entre `canProceed()` (front) et
`assertGate()` (back), qui peuvent diverger.

**Permissions** : `etude.read`, `etude.create`, `etude.update`, `etude.delete`, `etude.submit`,
`etude.approve`. Noter que `etude.approve` doit être **distincte** de `etude.update` — c'est le
défaut principal de `ConsultationController` aujourd'hui.

### T2.5 — Séparer l'arbre du détail

`ConsultationService.getById()` charge l'arbre complet à chaque appel, et le front fait `reload()`
après **chaque** édition de composant. Sur un DPGF réel (500 à 2 000 articles) c'est inutilisable.

- `GET /{id}` → en-tête seul
- `GET /{id}/arbre?lotId=&profondeur=` → sous-arbre à la demande
- Les mutations retournent **le nœud modifié**, pas le dossier entier
- Le front applique la mise à jour localement (mise à jour du signal), sans rechargement global

### T2.6 — Front : page dossier d'étude

⚠️ **Écrire dans `web/app/applications/erp/`** — c'est le seul arbre réellement compilé
(`web/tsconfig.app.json` → `include: ["app/**/*.ts"]`). `products/sektor-btp/web/app/` est du code
mort tant que le chantier Q5 n'a pas eu lieu, malgré ce qu'affirme `docs/AGENTS.md:183`.

Repartir de `web/app/applications/erp/pages/etudes/consultation/consultation-detail/`, renommer en
`pages/etudes/dossiers/`, et :

- 5 étapes dans `wizardSteps`
- supprimer `canProceed()` — consommer `GET /gates`
- afficher les problèmes de gate sous forme de liste cliquable (voir T2.7)
- supprimer les `reload()` systématiques
- ⚠️ corriger `onBack()` : `goStep(this.stepIndex())` mélange index 0-based et étape 1-based ;
  ça fonctionne par coïncidence mais c'est illisible — expliciter

### T2.7 — Composant de blocage de gate

Quand un gate est bloquant, afficher au-dessus du bouton « Suivant » :

```
⚠ 3 articles empêchent de continuer
  • 1-1-3  Béton armé en infrastructure — marqué Décomposé, aucun composant   [Corriger]
  • 2-4-1  Coffrage — quantité manquante                                      [Corriger]
  • 3-1-0  Aciers — unité manquante                                           [Corriger]
```

Chaque ligne navigue vers l'article concerné et l'ouvre en édition.

---

## Critères d'acceptation

- [ ] Un dossier se crée, parcourt les 5 étapes, se soumet et se valide
- [ ] La validation par l'auteur est refusée (403) si permission `etude.approve` absente
- [ ] Un gate bloquant affiche la liste des articles fautifs avec liens fonctionnels
- [ ] Aucune logique de gate dupliquée entre front et back
- [ ] Ajouter un composant ne déclenche pas de rechargement de l'arbre complet
- [ ] Deux utilisateurs simultanés → le second reçoit un 409 (verrou optimiste), pas un écrasement
- [ ] Un dossier sur 500 articles s'affiche en moins de 2 s
