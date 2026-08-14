package ma.nafura.platform.framework.service.crud;

import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import ma.nafura.platform.framework.api.controller.ImportResult;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Core, tenant-aware CRUD service with standard behavior.
 *
 * @param <TId>     Entity ID type
 * @param <TEntity> Entity type
 * @param <TCreate> Create DTO type
 * @param <TUpdate> Update DTO type
 */
public abstract class CrudService<TId, TEntity, TCreate, TUpdate> {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    public record LookupItem(Object key, String value, String code) {}

    public record LookupResponse(List<LookupItem> items, long total) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Tenant
    // ─────────────────────────────────────────────────────────────────────────

    protected UUID tenantId() {
        return TenantContext.getTenantId();
    }

    protected boolean isTenantEnabled() {
        return TenantContext.isTenantEnabled();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Repository hooks (implemented by subclasses)
    // ─────────────────────────────────────────────────────────────────────────

    protected abstract Optional<TEntity> findById(TId id);

    protected abstract boolean existsById(TId id);

    protected abstract List<TEntity> findAllTenant();

    protected abstract List<TEntity> findAllTenant(int page, int size);

    protected abstract TEntity save(TEntity entity);

    protected abstract void deleteEntity(TEntity entity);

    protected abstract List<TEntity> findAll(int page, int size);

    protected abstract List<TEntity> findAll(int page, int size, Sort sort);

    protected abstract long countAll();

    protected abstract long countAllTenant();

    protected abstract List<TEntity> findAllBySpec(Specification<TEntity> spec, int page, int size);

    protected abstract List<TEntity> findAllBySpec(Specification<TEntity> spec, int page, int size, Sort sort);

    protected abstract long countBySpec(Specification<TEntity> spec);

    // ─────────────────────────────────────────────────────────────────────────
    // Mapping hooks (implemented by subclasses)
    // ─────────────────────────────────────────────────────────────────────────

    /** Create a new entity instance from a create request. */
    protected abstract TEntity createEntity(TCreate request);

    /** Apply an update request to an existing entity instance. */
    protected abstract void applyUpdate(TEntity entity, TUpdate request);

    /** Set tenant ID on entity. */
    protected abstract void setTenantId(TEntity entity, UUID tenantId);

    /** Extract entity ID. */
    protected abstract TId getId(TEntity entity);

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD operations
    // ─────────────────────────────────────────────────────────────────────────

    public Optional<TEntity> getById(TId id) {
        return findById(id);
    }

    /**
     * Get entity by ID, throwing exception if not found.
     * Convenience method to avoid Optional handling in common scenarios.
     */
    public TEntity getByIdOrThrow(TId id) {
        return findById(id).orElseThrow(() -> notFoundException(id));
    }

    /**
     * Check if entity exists by ID.
     */
    public boolean exists(TId id) {
        return existsById(id);
    }

    public TEntity create(TCreate request) {
        TEntity entity = createEntity(request);
        if (isTenantEnabled()) {
            setTenantId(entity, tenantId());
        }
        TEntity saved = save(entity);
        afterCreate(saved);
        return saved;
    }

    public TEntity update(TId id, TUpdate request) {
        TEntity entity = findById(id)
            .orElseThrow(() -> notFoundException(id));
        Map<String, Object> beforeSnapshot = beforeUpdate(entity);
        applyUpdate(entity, request);
        TEntity saved = save(entity);
        afterUpdate(saved, beforeSnapshot);
        return saved;
    }

    public void delete(TId id) {
        TEntity entity = findById(id)
            .orElseThrow(() -> notFoundException(id));
        deleteEntity(entity);
        afterDelete(entity);
    }

    /**
     * Override to run logic after an entity is created (e.g. audit).
     */
    protected void afterCreate(TEntity entity) {}

    /**
     * Override to capture state before update (e.g. for audit diff). Default returns empty map.
     */
    protected Map<String, Object> beforeUpdate(TEntity entity) {
        return Map.of();
    }

    /**
     * Override to run logic after an entity is updated (e.g. audit).
     */
    protected void afterUpdate(TEntity entity, Map<String, Object> beforeSnapshot) {}

    /**
     * Override to run logic after an entity is deleted (e.g. audit).
     */
    protected void afterDelete(TEntity entity) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Batch operations
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create multiple entities in a transaction.
     * All or nothing - if any creation fails, entire batch is rolled back.
     */
    @Transactional
    public List<TEntity> createAll(List<TCreate> requests) {
        List<TEntity> results = new ArrayList<>();
        for (TCreate request : requests) {
            results.add(create(request));
        }
        return results;
    }

    /**
     * Delete multiple entities by ID in a transaction.
     * All or nothing - if any deletion fails, entire batch is rolled back.
     * 
     * @return number of entities actually deleted
     */
    @Transactional
    public int deleteAll(List<TId> ids) {
        int deleted = 0;
        for (TId id : ids) {
            Optional<TEntity> entity = findById(id);
            if (entity.isPresent()) {
                deleteEntity(entity.get());
                deleted++;
            }
        }
        return deleted;
    }

    /**
     * List entities with pagination.
     */
    public List<TEntity> listPage(int page, int size) {
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        if (isTenantEnabled()) {
            return findAllTenant(safePage, safeSize);
        }
        return findAll(safePage, safeSize);
    }

    /**
     * List entities with pagination and sorting.
     */
    public List<TEntity> listPage(int page, int size, Sort sort) {
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        return findAll(safePage, safeSize, sort);
    }

    /**
     * Lookup endpoint data for select/autocomplete controls.
     * Returns a lightweight key/value payload with pagination support.
     */
    public LookupResponse lookup(
            String search,
            List<String> searchFields,
            int page,
            int size,
            Sort sort,
            String labelField,
            String valueField) {
        List<TEntity> rows;
        long total;

        if (hasText(search)) {
            total = countSearch(search, searchFields);
            rows = sort != null
                    ? searchPage(search, searchFields, page, size, sort)
                    : searchPage(search, searchFields, page, size);
        } else {
            total = count();
            rows = sort != null
                    ? listPage(page, size, sort)
                    : listPage(page, size);
        }

        List<LookupItem> items = rows.stream()
                .map(entity -> toLookupItem(entity, labelField, valueField))
                .toList();
        return new LookupResponse(items, total);
    }

    /**
     * Count total entities.
     */
    public long count() {
        if (isTenantEnabled()) {
            return countAllTenant();
        }
        return countAll();
    }

    /**
     * Search entities with optional explicit searchable fields.
     * Empty search behaves exactly like regular list paging.
     */
    public List<TEntity> searchPage(String search, List<String> searchFields, int page, int size) {
        if (!hasText(search)) {
            return listPage(page, size);
        }
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        Specification<TEntity> spec = buildSearchSpecification(search, searchFields);
        return findAllBySpec(spec, safePage, safeSize);
    }

    /**
     * Search entities with sorting and optional explicit searchable fields.
     * Empty search behaves exactly like regular list paging.
     */
    public List<TEntity> searchPage(String search, List<String> searchFields, int page, int size, Sort sort) {
        if (!hasText(search)) {
            return listPage(page, size, sort);
        }
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        Specification<TEntity> spec = buildSearchSpecification(search, searchFields);
        return findAllBySpec(spec, safePage, safeSize, sort);
    }

    /**
     * Count entities matching search criteria.
     * Empty search behaves exactly like regular count.
     */
    public long countSearch(String search, List<String> searchFields) {
        if (!hasText(search)) {
            return count();
        }
        Specification<TEntity> spec = buildSearchSpecification(search, searchFields);
        return countBySpec(spec);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Flexible search (Specification pattern)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Find entities matching criteria using JPA Specification.
     * Use this for flexible queries without creating explicit repository methods.
     * 
     * Example:
     * <pre>
     * Specification<Item> spec = (root, query, cb) -> cb.and(
     *     cb.equal(root.get("type"), ItemType.PRODUCT),
     *     cb.equal(root.get("isActive"), true)
     * );
     * List<Item> items = service.findByCriteria(spec, 0, 20);
     * </pre>
     */
    public List<TEntity> findByCriteria(Specification<TEntity> spec, int page, int size) {
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        return findAllBySpec(spec, safePage, safeSize);
    }

    /**
     * Find entities matching criteria with sorting.
     */
    public List<TEntity> findByCriteria(Specification<TEntity> spec, int page, int size, Sort sort) {
        int safePage = normalizePage(page);
        int safeSize = normalizeSize(size);
        return findAllBySpec(spec, safePage, safeSize, sort);
    }

    /**
     * Count entities matching criteria.
     */
    public long countByCriteria(Specification<TEntity> spec) {
        return countBySpec(spec);
    }

    /**
     * Find at most one entity matching the given specification.
     */
    public Optional<TEntity> findOneByCriteria(Specification<TEntity> spec) {
        List<TEntity> list = findByCriteria(spec, 0, 1);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    /**
     * List entities for export (same filters as list/search, up to maxRows; size cap 10_000).
     */
    public List<TEntity> listForExport(String search, List<String> searchFields, Sort sort, int maxRows) {
        int capped = Math.min(Math.max(0, maxRows), 10_000);
        Specification<TEntity> spec = hasText(search)
                ? buildSearchSpecification(search, searchFields != null ? searchFields : List.of())
                : null;
        return findForExportBySpec(spec, capped, sort != null ? sort : Sort.unsorted());
    }

    /**
     * Export: find entities by spec with unbounded size (up to maxRows). Not capped by normal list page size.
     */
    protected abstract List<TEntity> findForExportBySpec(Specification<TEntity> spec, int maxRows, Sort sort);

    /**
     * Build a specification that matches an entity by natural key (field values from row).
     * Subclasses may override; default builds equality for each key field from row values.
     */
    protected Specification<TEntity> buildNaturalKeySpecification(Map<String, String> row, List<String> naturalKeyFields) {
        throw new CrudOperationException("Natural key lookup not supported; override buildNaturalKeySpecification or disable import");
    }

    /**
     * Import from CSV rows. Per-row processing; failed rows do not roll back others.
     * Default throws; override in JpaCrudService (or subclass) when import is enabled.
     */
    public ImportResult importFromCsvRows(List<Map<String, String>> rows, Class<TEntity> entityClass,
                                          List<String> importFields, List<String> naturalKeyFields,
                                          ma.nafura.platform.framework.service.csv.CsvImportService csvImportService) {
        throw new CrudOperationException("Import not supported by this service");
    }

    /**
     * Build a search specification.
     * Subclasses can override with entity-specific behavior.
     */
    protected Specification<TEntity> buildSearchSpecification(String search, List<String> searchFields) {
        throw new CrudOperationException("Search is not supported by this CRUD service implementation");
    }

    private LookupItem toLookupItem(TEntity entity, String labelField, String valueField) {
        Object key = hasText(valueField) ? readProperty(entity, valueField) : null;
        if (key == null) {
            key = readPropertyByCandidates(entity, List.of("id", "code", "key"));
        }
        if (key == null) {
            key = getId(entity);
        }

        Object label = hasText(labelField) ? readProperty(entity, labelField) : null;
        if (label == null) {
            label = readPropertyByCandidates(entity, List.of("name", "label", "title", "code", "id"));
        }

        Object code = readProperty(entity, "code");
        String resolvedLabel = label != null ? String.valueOf(label) : (key != null ? String.valueOf(key) : "");
        String resolvedCode = code != null ? String.valueOf(code) : null;

        return new LookupItem(key, resolvedLabel, resolvedCode);
    }

    private Object readPropertyByCandidates(TEntity entity, List<String> candidates) {
        for (String candidate : candidates) {
            Object value = readProperty(entity, candidate);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private Object readProperty(TEntity entity, String property) {
        if (entity == null || !hasText(property)) {
            return null;
        }

        String suffix = property.substring(0, 1).toUpperCase() + property.substring(1);
        List<String> methodCandidates = List.of("get" + suffix, "is" + suffix, property);

        for (String methodName : methodCandidates) {
            try {
                Method method = entity.getClass().getMethod(methodName);
                if (method.getParameterCount() == 0) {
                    return method.invoke(entity);
                }
            } catch (Exception ignored) {
                // Try next candidate.
            }
        }

        Class<?> type = entity.getClass();
        while (type != null) {
            try {
                Field field = type.getDeclaredField(property);
                field.setAccessible(true);
                return field.get(entity);
            } catch (Exception ignored) {
                type = type.getSuperclass();
            }
        }

        return null;
    }

    private int normalizePage(int page) {
        return page < 0 ? DEFAULT_PAGE : page;
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return DEFAULT_SIZE;
        }
        return Math.min(size, MAX_SIZE);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    protected CrudNotFoundException notFoundException(TId id) {
        return new CrudNotFoundException("Entity not found: " + id);
    }
}

