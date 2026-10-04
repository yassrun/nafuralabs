package ma.nafura.host.seed;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.metamodel.Attribute;
import jakarta.persistence.metamodel.EntityType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.record.HasStatus;
import ma.nafura.platform.framework.record.Lifecycle;
import ma.nafura.platform.framework.record.LifecycleEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/**
 * Applies the data sets to one organization, each in its own transaction, as the platform itself (every permission).
 * A data set is applied again only when its content changed, and then only creates the records whose key is missing:
 * what the organization changed or deleted stays so.
 */
public class TenantSeeder {

    private static final Logger log = LoggerFactory.getLogger(TenantSeeder.class);
    private static final String REF = "$ref";
    private static final String TRANSITIONS = "$transitions";
    static final String ACTOR = "system";

    public record Applied(String dataset, int inserted) {
    }

    private final List<SeedDataset> datasets;
    private final boolean demo;
    private final EntityManager entityManager;
    private final TransactionTemplate transactions;
    private final JdbcTemplate jdbc;
    private final Validator validator;
    private final LifecycleEngine lifecycles;
    private final JsonMapper mapper;

    public TenantSeeder(List<SeedDataset> datasets, boolean demo, EntityManager entityManager, TransactionTemplate transactions,
                        JdbcTemplate jdbc, Validator validator, LifecycleEngine lifecycles, JsonMapper mapper) {
        this.datasets = datasets;
        this.demo = demo;
        this.entityManager = entityManager;
        this.transactions = transactions;
        this.jdbc = jdbc;
        this.validator = validator;
        this.lifecycles = lifecycles;
        this.mapper = mapper.rebuild().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
    }

    public boolean isEmpty() {
        return datasets.isEmpty();
    }

    /** Also the entry point when an organization is created at runtime. */
    public List<Applied> seed(UUID tenantId) {
        List<Applied> applied = new ArrayList<>();
        for (SeedDataset dataset : datasets) {
            if (dataset.kind() == SeedDataset.Kind.DEMO && !demo) {
                continue;
            }
            Integer inserted = asPlatform(tenantId, () -> transactions.execute(status -> apply(tenantId, dataset)));
            if (inserted != null) {
                applied.add(new Applied(dataset.id(), inserted));
                log.info("Seed {} applied to {}: {} record(s) created", dataset.id(), tenantId, inserted);
            }
        }
        return applied;
    }

    /** Null when already applied with this content. */
    private Integer apply(UUID tenantId, SeedDataset dataset) {
        // Two replicas starting together must not both seed the same organization.
        jdbc.query("SELECT pg_advisory_xact_lock(hashtext(?))", rs -> null, "nafura_seed:" + tenantId);
        List<String> checksum = jdbc.queryForList(
                "SELECT checksum FROM nafura_seed WHERE tenant_id = ? AND dataset_id = ?", String.class, tenantId, dataset.id());
        if (!checksum.isEmpty() && checksum.get(0).equals(dataset.checksum())) {
            return null;
        }
        int inserted = 0;
        for (SeedDataset.Block block : dataset.entities()) {
            inserted += apply(tenantId, dataset, block);
        }
        jdbc.update("""
                INSERT INTO nafura_seed (tenant_id, dataset_id, checksum, inserted, applied_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id, dataset_id)
                DO UPDATE SET checksum = EXCLUDED.checksum, inserted = EXCLUDED.inserted, applied_at = EXCLUDED.applied_at
                """, tenantId, dataset.id(), dataset.checksum(), inserted);
        return inserted;
    }

    private int apply(UUID tenantId, SeedDataset dataset, SeedDataset.Block block) {
        EntityType<?> type = entityType(block.entity(), dataset);
        Optional<Lifecycle> lifecycle = lifecycles.lifecycleOf(type.getJavaType());
        int inserted = 0;
        for (int i = 0; i < block.records().size(); i++) {
            String where = dataset.id() + " / " + block.entity() + " #" + (i + 1);
            Map<String, Object> values = new LinkedHashMap<>(block.records().get(i));
            List<String> transitions = transitions(values.remove(TRANSITIONS), where);
            values.replaceAll((field, value) -> value instanceof Map<?, ?> ref && ref.containsKey(REF) ? resolve(tenantId, ref, where) : value);

            Map<String, Object> key = new LinkedHashMap<>();
            for (String field : block.key()) {
                if (!values.containsKey(field)) {
                    throw new IllegalStateException("Seed " + where + ": key field \"" + field + "\" is missing");
                }
                key.put(field, values.get(field));
            }
            if (!find(tenantId, type, key, where).isEmpty()) {
                continue;
            }
            create(tenantId, type, lifecycle, values, transitions, where);
            inserted++;
        }
        return inserted;
    }

    private void create(UUID tenantId, EntityType<?> type, Optional<Lifecycle> lifecycle, Map<String, Object> values,
                        List<String> transitions, String where) {
        TenantEntity record;
        try {
            record = (TenantEntity) mapper.convertValue(values, type.getJavaType());
        } catch (RuntimeException e) {
            throw new IllegalStateException("Seed " + where + ": " + e.getMessage(), e);
        }
        record.setId(null);
        record.setTenantId(tenantId);
        if (record instanceof HasStatus withStatus) {
            lifecycle.ifPresent(declared -> withStatus.setStatus(declared.initial()));
        }
        Set<ConstraintViolation<TenantEntity>> violations = validator.validate(record);
        if (!violations.isEmpty()) {
            throw new IllegalStateException("Seed " + where + " is invalid: " + violations.stream()
                    .map(v -> v.getPropertyPath() + " " + v.getMessage()).sorted().collect(Collectors.joining(", ")));
        }
        entityManager.persist(record);
        entityManager.flush();
        if (transitions.isEmpty()) {
            return;
        }
        Lifecycle declared = lifecycle.orElseThrow(() ->
                new IllegalStateException("Seed " + where + ": " + type.getName() + " has no lifecycle for $transitions"));
        for (String transition : transitions) {
            try {
                Lifecycle.Transition declaredTransition = declared.transition(transition).orElse(null);
                if (declaredTransition != null && declaredTransition.system()) {
                    lifecycles.fireSystem(declared, (HasStatus) record, record.getId(), transition, entityManager::merge);
                } else {
                    lifecycles.fire(declared, (HasStatus) record, record.getId(), transition, entityManager::merge);
                }
            } catch (RuntimeException e) {
                throw new IllegalStateException("Seed " + where + ": transition " + transition + " failed: " + e.getMessage(), e);
            }
            entityManager.flush();
        }
    }

    /** {@code { "$ref": "DemoCategory", "code": "IT" }} → the id of the one matching record of the organization. */
    private UUID resolve(UUID tenantId, Map<?, ?> ref, String where) {
        EntityType<?> type = entityType(String.valueOf(ref.get(REF)), where);
        Map<String, Object> criteria = new LinkedHashMap<>();
        ref.forEach((field, value) -> {
            if (!REF.equals(field)) criteria.put(String.valueOf(field), value);
        });
        if (criteria.isEmpty()) {
            throw new IllegalStateException("Seed " + where + ": a $ref needs at least one field to match");
        }
        List<UUID> ids = find(tenantId, type, criteria, where);
        if (ids.size() != 1) {
            throw new IllegalStateException("Seed " + where + ": " + ref + " matches " + ids.size() + " record(s), expected 1");
        }
        return ids.get(0);
    }

    private List<UUID> find(UUID tenantId, EntityType<?> type, Map<String, Object> criteria, String where) {
        Set<String> attributes = type.getAttributes().stream().map(Attribute::getName).collect(Collectors.toSet());
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<UUID> query = cb.createQuery(UUID.class);
        Root<?> root = query.from(type);
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.equal(root.get("tenantId"), tenantId));
        criteria.forEach((field, value) -> {
            if (!attributes.contains(field)) {
                throw new IllegalStateException("Seed " + where + ": " + type.getName() + " has no field \"" + field + "\"");
            }
            Path<Object> path = root.get(field);
            predicates.add(value == null ? cb.isNull(path) : cb.equal(path, mapper.convertValue(value, path.getJavaType())));
        });
        return entityManager.createQuery(query.select(root.get("id")).where(predicates.toArray(Predicate[]::new))).getResultList();
    }

    private EntityType<?> entityType(String name, Object where) {
        EntityType<?> type = entityManager.getMetamodel().getEntities().stream()
                .filter(entity -> entity.getName().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Seed " + where + ": unknown entity " + name));
        if (!TenantEntity.class.isAssignableFrom(type.getJavaType())) {
            throw new IllegalStateException("Seed " + where + ": " + name + " is not organization data (TenantEntity)");
        }
        return type;
    }

    private static List<String> transitions(Object value, String where) {
        if (value == null) {
            return List.of();
        }
        if (value instanceof List<?> list && list.stream().allMatch(String.class::isInstance)) {
            return list.stream().map(String.class::cast).toList();
        }
        throw new IllegalStateException("Seed " + where + ": $transitions must be a list of transition ids");
    }

    /** Runs as the platform in that organization, then gives the thread back as it was. */
    private static <T> T asPlatform(UUID tenantId, Supplier<T> work) {
        UUID tenant = TenantContext.getTenantIdOrNull();
        Set<String> permissions = UserContext.getPermissions();
        boolean superAdmin = UserContext.isSuperAdmin();
        String email = UserContext.getUserEmail();
        String role = UserContext.getUserRole();
        Set<String> roles = UserContext.getUserRoles();
        UUID userId = UserContext.getUserIdOrNull();
        try {
            TenantContext.setTenantId(tenantId);
            UserContext.clear();
            UserContext.setPermissions(Set.of("*"));
            UserContext.setSuperAdmin(true);
            UserContext.setUserEmail(ACTOR);
            return work.get();
        } finally {
            UserContext.clear();
            if (!permissions.isEmpty()) UserContext.setPermissions(permissions);
            if (superAdmin) UserContext.setSuperAdmin(true);
            if (email != null) UserContext.setUserEmail(email);
            if (!roles.isEmpty()) UserContext.setUserRoles(roles);
            if (role != null) UserContext.setUserRole(role);
            if (userId != null) UserContext.setUserId(userId);
            if (tenant != null) TenantContext.setTenantId(tenant);
            else TenantContext.clear();
        }
    }
}
