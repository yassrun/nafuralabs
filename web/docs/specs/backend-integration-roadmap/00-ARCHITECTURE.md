# Architecture cible — Backend Integration

> **Document de référence à lire AVANT de coder.** Chaque tâche `B-XX-NN` suit strictement les conventions ci-dessous. Toute déviation doit être justifiée en PR.

---

## 1. Principes directeurs

1. **Une seule application Spring Boot** : `backend/applications/erp/` reste un shell sans logique métier. Toute la logique vit dans `backend/domains/<module>/`.
2. **Même découpe que le frontend** : un dossier `web/app/applications/erp/pages/<module>/` ⇄ un dossier `backend/domains/<module>/`. Pas de "super-module" backend qui regroupe achats + ventes.
3. **CRUD-first** : on utilise le socle (`CrudController`, `JpaCrudService`, `TenantScopedRepository`). Les endpoints custom sont **réservés** aux :
   - transitions de statut (`/api/v1/.../{id}/submit`, `/approve`, `/reject`, `/cancel`, `/convert`)
   - calculs / agrégats (`/api/v1/chantiers/{id}/summary`, `/api/v1/marches/{id}/dgd`)
   - read models multi-domaines (`/api/v1/dashboard/kpis`, `/api/v1/pilotage/cash-flow`)
   - imports / exports lourds qui ne rentrent pas dans le CSV générique
4. **Pas de générateur.** Chaque entité est codée à la main. Le pattern à reproduire est celui des domaines `item`, `stock`, `currency` qui contiennent encore les commentaires `Auto-generated …` parce qu'ils sortent d'un ancien générateur — mais nous les traitons désormais comme du code écrit manuellement (lecture / refactor / extension autorisés).
5. **Multi-tenant strict** : toute entité métier a une colonne `tenant_id` (`UUID`, `NOT NULL`). Le filtrage est porté par `TenantScopedRepository` du socle.
6. **Aucun calcul métier critique côté frontend** : totaux financiers, statuts dérivés, marges, K, DGD, scoring, lettrage… **descendent côté backend**. Le frontend lit des champs déjà calculés.

---

## 2. Layout d'un domaine

Pour chaque module métier, on crée un dossier sous `backend/domains/<module>/` avec la structure suivante (calquée sur `backend/domains/item/`) :

```
backend/domains/<module>/
├── build.gradle
└── src/main/
    ├── java/ma/nafura/<module>/
    │   ├── api/
    │   │   ├── controller/
    │   │   │   ├── base/          ← Contrôleurs CRUD socle (1 par entité)
    │   │   │   └── <Entity>Controller.java   ← Wrapper avec endpoints custom
    │   │   └── request/           ← DTOs Create/Update
    │   ├── domain/
    │   │   └── model/             ← Entités JPA
    │   ├── mapper/                ← MapStruct ou mapper manuel DTO ↔ Entity
    │   ├── repository/            ← Repositories extends TenantScopedRepository
    │   └── service/
    │       ├── base/              ← Service CRUD socle (1 par entité)
    │       └── <Entity>Service.java          ← Logique métier custom
    └── resources/
        ├── db/changelog/schema/v1.0/         ← Migrations Liquibase
        └── validation/                       ← (optionnel) messages.properties
```

### Conventions de nommage

| Concept | Convention |
|---|---|
| Package racine | `ma.nafura.<module>` — ex. `ma.nafura.achats`, `ma.nafura.chantiers` |
| Entité JPA | `<Entity>` au singulier — ex. `BonCommande`, `Chantier`, `Employe` |
| Table | snake_case pluriel — ex. `bons_commande`, `chantiers`, `employes` |
| Repository | `<Entity>Repository extends TenantScopedRepository<UUID, <Entity>>` |
| Service socle | `<Entity>ServiceBase extends JpaCrudService<UUID, <Entity>, <Entity>CreateDto, <Entity>UpdateDto>` |
| Service custom | `<Entity>Service extends <Entity>ServiceBase` (`@Service`) |
| Controller socle | `<Entity>ControllerBase extends CrudController<UUID, <Entity>, <Entity>CreateDto, <Entity>UpdateDto>` |
| Controller wrapper | `<Entity>Controller extends <Entity>ControllerBase` (`@RestController`) |
| DTO Create | `<Entity>CreateDto` (record) |
| DTO Update | `<Entity>UpdateDto` (record) |
| Mapper | `<Entity>Mapper` (MapStruct) |
| Migration | `db/changelog/schema/v1.0/<NN>-create-<table>.xml` |

---

## 3. Pattern type — une entité de A à Z

Exemple concret pour `BonCommande` dans `backend/domains/achats/` :

### 3.1 Entité JPA

```java
package ma.nafura.achats.domain.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "bons_commande")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class BonCommande {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", length = 30, nullable = false, unique = true)
    private String numero;

    @Column(name = "fournisseur_id", nullable = false)
    private UUID fournisseurId;

    @Column(name = "chantier_id")
    private UUID chantierId;

    @Column(name = "date_emission", nullable = false)
    private LocalDate dateEmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private BonCommandeStatus status;   // BROUILLON / SOUMIS / APPROUVE / RECU_PARTIEL / RECU_TOTAL / CLOS / ANNULE

    @Column(name = "montant_ht", precision = 18, scale = 2)
    private BigDecimal montantHt;

    @Column(name = "montant_tva", precision = 18, scale = 2)
    private BigDecimal montantTva;

    @Column(name = "montant_ttc", precision = 18, scale = 2)
    private BigDecimal montantTtc;

    @Column(name = "devise_id", nullable = false)
    private UUID deviseId;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = updatedAt = OffsetDateTime.now(); }
    @PreUpdate  void onUpdate() { updatedAt = OffsetDateTime.now(); }
}
```

### 3.2 Repository

```java
package ma.nafura.achats.repository;

import java.util.UUID;
import ma.nafura.achats.domain.model.BonCommande;
import ma.nafura.platform.framework.repository.TenantScopedRepository;

public interface BonCommandeRepository extends TenantScopedRepository<UUID, BonCommande> {
}
```

### 3.3 Service socle + custom

```java
// service/base/BonCommandeServiceBase.java
package ma.nafura.achats.service.base;

import java.util.UUID;
import ma.nafura.achats.domain.model.BonCommande;
import ma.nafura.achats.api.request.*;
import ma.nafura.achats.mapper.BonCommandeMapper;
import ma.nafura.achats.repository.BonCommandeRepository;
import ma.nafura.platform.framework.service.crud.JpaCrudService;

public class BonCommandeServiceBase
        extends JpaCrudService<UUID, BonCommande, BonCommandeCreateDto, BonCommandeUpdateDto> {
    protected BonCommandeServiceBase(BonCommandeRepository repo, BonCommandeMapper mapper) {
        super(repo, mapper);
    }
}

// service/BonCommandeService.java
package ma.nafura.achats.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
// …

@Service
public class BonCommandeService extends BonCommandeServiceBase {

    public BonCommandeService(BonCommandeRepository repo, BonCommandeMapper mapper) {
        super(repo, mapper);
    }

    @Transactional
    public BonCommande submit(UUID id) {
        BonCommande bc = getById(id).orElseThrow();
        if (bc.getStatus() != BonCommandeStatus.BROUILLON) {
            throw new IllegalStateException("BC must be BROUILLON to submit");
        }
        bc.setStatus(BonCommandeStatus.SOUMIS);
        return getRepository().save(bc);
    }

    // …approve / reject / cancel / close
}
```

### 3.4 Controller

```java
// api/controller/base/BonCommandeControllerBase.java — pur socle
package ma.nafura.achats.api.controller.base;

public abstract class BonCommandeControllerBase
        extends CrudController<UUID, BonCommande, BonCommandeCreateDto, BonCommandeUpdateDto> {
    protected final BonCommandeService service;
    protected BonCommandeControllerBase(BonCommandeService service) { this.service = service; }
    @Override protected CrudService<…> getService() { return service; }
}

// api/controller/BonCommandeController.java — wrapper avec endpoints custom
@RestController
@RequestMapping("/api/v1/achats/bons-commande")
@SecuredResource(domain = "achats", feature = "bons-commande", resource = "bon-commande")
public class BonCommandeController extends BonCommandeControllerBase {

    public BonCommandeController(BonCommandeService service) { super(service); }

    @PostMapping("/{id}/submit")
    @RequirePermission("achats.bons-commande.submit")
    public ResponseEntity<BonCommande> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submit(id));
    }

    // /approve, /reject, /cancel …
}
```

### 3.5 DTOs

```java
// api/request/BonCommandeCreateDto.java
public record BonCommandeCreateDto(
        @NotBlank String numero,
        @NotNull UUID fournisseurId,
        UUID chantierId,
        @NotNull LocalDate dateEmission,
        @NotNull UUID deviseId
) {}

// api/request/BonCommandeUpdateDto.java
public record BonCommandeUpdateDto(
        String numero,
        UUID fournisseurId,
        UUID chantierId,
        LocalDate dateEmission,
        UUID deviseId
) {}
```

### 3.6 Liquibase migration

```xml
<!-- src/main/resources/db/changelog/schema/v1.0/03-create-bons-commande.xml -->
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog">
  <changeSet id="achats-v1.0-03-bons-commande" author="backend-integration">
    <createTable tableName="bons_commande">
      <column name="id" type="uuid"><constraints primaryKey="true" nullable="false"/></column>
      <column name="tenant_id" type="uuid"><constraints nullable="false"/></column>
      <column name="numero" type="varchar(30)"><constraints nullable="false" unique="true"/></column>
      <column name="fournisseur_id" type="uuid"><constraints nullable="false"/></column>
      <column name="chantier_id" type="uuid"/>
      <column name="date_emission" type="date"><constraints nullable="false"/></column>
      <column name="status" type="varchar(30)"><constraints nullable="false"/></column>
      <column name="montant_ht" type="numeric(18,2)"/>
      <column name="montant_tva" type="numeric(18,2)"/>
      <column name="montant_ttc" type="numeric(18,2)"/>
      <column name="devise_id" type="uuid"><constraints nullable="false"/></column>
      <column name="created_at" type="timestamptz"><constraints nullable="false"/></column>
      <column name="updated_at" type="timestamptz"><constraints nullable="false"/></column>
    </createTable>
    <createIndex indexName="idx_bons_commande_tenant" tableName="bons_commande">
      <column name="tenant_id"/>
    </createIndex>
    <createIndex indexName="idx_bons_commande_fournisseur" tableName="bons_commande">
      <column name="fournisseur_id"/>
    </createIndex>
  </changeSet>
</databaseChangeLog>
```

### 3.7 Mapper MapStruct

```java
@Mapper(componentModel = "spring")
public interface BonCommandeMapper extends EntityMapper<BonCommande, BonCommandeCreateDto, BonCommandeUpdateDto> {
}
```

(`EntityMapper` est l'interface du socle déclarant `toEntity(createDto)` et `updateEntity(entity, updateDto)`.)

---

## 4. Frontend — pattern de désinjection

Pour chaque module migré, on suit **exactement le même schéma** :

### 4.1 `*-api.service.ts` redevient pur HTTP

**Avant (Class B mock-backed wrapper) :**

```typescript
@Injectable({ providedIn: 'root' })
export class OffreApiService extends FeatureApiService<OffreCommerciale, OffreCreate, OffreUpdate> {
  protected override basePath = '/api/v1/ventes/offres';
  protected override searchFields = ['numero', 'clientName', 'objet'];

  private readonly mock = inject(VentesMockService);

  override async getAll(query?: ListQuery): Promise<ListResponse<OffreCommerciale>> {
    const all = await firstValueFrom(this.mock.getOffres());
    // …filtrage côté frontend
    return { items: rows, total: rows.length };
  }
  override async getById(id) { return firstValueFrom(this.mock.getOffreById(String(id))); }
  override async create(data) { return firstValueFrom(this.mock.createOffre(data)); }
  // …
}
```

**Après (Class A pure HTTP) — identique aux services `inventory/catalogue/items` actuels :**

```typescript
@Injectable({ providedIn: 'root' })
export class OffreApiService extends FeatureApiService<OffreCommerciale, OffreCreate, OffreUpdate> {
  protected override basePath = '/api/v1/ventes/offres';
  protected override searchFields = ['numero', 'clientName', 'objet'];
}
```

Tout le filtrage/tri devient un paramètre HTTP géré par `FeatureApiService` (`page`, `size`, `sort`, `search`, `searchFields`).

### 4.2 Endpoints custom dans le facade, pas dans l'API service

Si une transition de statut est nécessaire, on l'expose dans le **facade**, pas dans l'API service.

```typescript
@Injectable({ providedIn: 'root' })
export class OffreFacade extends FeatureFacade<…> {
  protected override api = inject(OffreApiService);
  private readonly http = inject(HttpClient);

  async submit(id: string): Promise<OffreCommerciale> {
    return firstValueFrom(this.http.post<OffreCommerciale>(`/api/v1/ventes/offres/${id}/submit`, {}));
  }
}
```

### 4.3 Page / composant : aucun import de mock

Recherche grep finale par module : `grep -r "MockService" web/app/applications/erp/<module>/ web/app/applications/erp/pages/<module>/` doit retourner **zéro résultat** avant de marquer la tâche `[x]`.

### 4.4 Mock service : quarantaine puis suppression

Le fichier `web/app/applications/erp/<module>/mock/<module>-mock.service.ts` est :

1. **Désinjecté** de toutes les pages / facades / api-services du module.
2. **Marqué `@deprecated`** dans une PR intermédiaire pour permettre un rollback rapide pendant la stabilisation.
3. **Supprimé** dans une PR finale une fois que toutes les pages tournent sur le backend en pré-prod pendant 1 sprint.

---

## 5. Application spec (`naf/src/spec/applications/erp/erp.application.json`)

À chaque nouveau domaine backend, on **ajoute** son identifiant dans :

```jsonc
{
  "application": "erp",
  "domains": [
    "item",
    "stock",
    "currency",
    // ↓ à ajouter au fil des waves
    "partner",
    "achats",
    "ventes",
    "chantiers",
    "etudes",
    "rh",
    "hse",
    "marches",
    "approbations"
  ],
  …
  "defaultTenant": {
    "domains": ["item", "stock", "currency", "partner", "achats", "…"]
  }
}
```

C'est cette liste qui détermine quels `roleTemplates.permissions` sont valides (`achats.*`, `ventes.*`, etc.) et quelle nav est exposée.

> **Note :** `naf/src/spec` n'est pas utilisé comme **générateur** dans cette roadmap. C'est uniquement le **catalogue d'enregistrement** des domaines auprès du shell ERP (permissions, navigation, capabilities). Le code Java reste écrit à la main.

---

## 6. RBAC & permissions

Chaque entité d'un module a des permissions canoniques :

```
<module>.<entity>.read
<module>.<entity>.create
<module>.<entity>.update
<module>.<entity>.delete
<module>.<entity>.export
<module>.<entity>.import
<module>.<entity>.<custom-action>   ← submit / approve / cancel / close…
```

Elles sont déclarées via `@SecuredResource(domain = "<module>", feature = "<feature>", resource = "<entity>")` au niveau du contrôleur et `@RequirePermission("…")` au niveau des méthodes custom.

Le frontend a déjà `permissionGuard([…])` et la directive `*hasPermission`. **Aucune modification frontend n'est nécessaire** côté RBAC — il suffit d'ajouter les nouvelles permissions à `erp.application.json` et aux `roleTemplates`.

---

## 7. Validation côté backend

- DTOs `record` annotés Bean Validation (`@NotNull`, `@NotBlank`, `@Size`, `@Pattern`, `@DecimalMin`, etc.).
- Validations métier (ex. "le `dateValidite` doit être > `dateEmission`") dans le **service**, pas dans le DTO.
- Messages d'erreur centralisés dans `validation/messages.properties` du domaine.
- Le `GlobalExceptionHandler` du platform renvoie déjà un format `{ code, message, field, … }` compatible avec le `ToastService` Angular Round 1 12.3.

---

## 8. Tests

| Niveau | Outil | Couverture |
|---|---|---|
| Unit | JUnit 5 + Mockito | Services métier (calculs HT/TVA/TTC, transitions de statut, formules K, scoring AO, lettrage). 80%+ sur les services custom. |
| Integration | `@SpringBootTest` + Testcontainers PostgreSQL | Au moins 1 test par contrôleur custom (transitions, agrégats). |
| Contract | `@WebMvcTest` | Format JSON de la liste (`Page<T>`) doit être compatible avec `FeatureApiService` Angular. |
| E2E | Playwright | Au moins 1 scénario par module : `listing → create → update → transition → delete` exécuté en mode "vraie API" (mock-server désactivé). |

---

## 9. Migration de données / seeds

- Aucun seed obligatoire sauf pour `partner` (charger les clients/fournisseurs de démo des mocks `VentesMockService.getClients()` et `AchatsMockService.getFournisseurs()`) et `chantier` (`SEED_CHANTIERS` Round 1).
- Scripts de seed = changesets Liquibase `context="seed-demo"` séparés du schema.
- Les seeds **ne sont pas joués** en prod (filtrage par `liquibase.contexts=schema` dans `application.yml` prod).

---

## 10. Checklist "Définition de Done" par tâche backend

Une tâche `B-XX-NN` est `[x]` si et seulement si :

1. [ ] Le fichier `<Entity>.java` (entité JPA) est créé, avec `tenant_id` et `@PrePersist/@PreUpdate`.
2. [ ] Le repository étend `TenantScopedRepository`.
3. [ ] Le service custom étend `XxxServiceBase` et porte la logique métier (transitions, calculs).
4. [ ] Le contrôleur étend `XxxControllerBase` et expose les endpoints custom.
5. [ ] Les DTOs Create/Update sont validés (`@NotNull`, `@NotBlank`, etc.).
6. [ ] Le mapper MapStruct existe.
7. [ ] La migration Liquibase est ajoutée et joue sans erreur sur un PostgreSQL vierge.
8. [ ] `./gradlew :domains:<module>:build` passe (compile + tests unitaires).
9. [ ] `./gradlew :applications:erp:bootRun` démarre avec le nouveau domaine.
10. [ ] Le `*-api.service.ts` frontend correspondant est devenu **pure HTTP** (aucun `inject(*MockService)`).
11. [ ] La page / le facade / les composants du module n'injectent plus le `*MockService`.
12. [ ] Au moins 1 test JUnit pour chaque endpoint custom + 1 test e2e Playwright pour le flow principal du module.
13. [ ] Le domaine est listé dans `erp.application.json` (`domains[]` + `defaultTenant.domains[]`).
14. [ ] Les permissions sont ajoutées aux `roleTemplates` adéquats.
15. [ ] `00-PROGRESS.md` est mis à jour (statut + evidence + date + agent).

> Si une de ces 15 cases est manquante, la tâche est `[~]` (partiel), pas `[x]`.
