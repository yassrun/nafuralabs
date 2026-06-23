package ma.nafura.platform.framework.service.crud;

import ma.nafura.platform.framework.api.controller.ImportError;
import ma.nafura.platform.framework.api.controller.ImportResult;
import ma.nafura.platform.framework.mapper.EntityMapper;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import ma.nafura.platform.framework.service.csv.CsvImportRowException;
import ma.nafura.platform.framework.service.csv.CsvImportService;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.metamodel.SingularAttribute;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Default CRUD implementation backed by a tenant-aware JPA repository.
 * Auto-implements mapping via EntityMapper, eliminating manual createEntity/applyUpdate overrides.
 *
 * @param <TId>     Entity ID type
 * @param <TEntity> Entity type
 * @param <TCreate> Create DTO type
 * @param <TUpdate> Update DTO type
 */
public abstract class JpaCrudService<TId, TEntity, TCreate, TUpdate>
    extends CrudService<TId, TEntity, TCreate, TUpdate> {

    private static final int IMPORT_MAX_ROWS = 10_000;

    private final JpaRepository<TEntity, TId> repository;
    private final EntityMapper<TEntity, TCreate, TUpdate> mapper;
    private Optional<CrudAuditHook> crudAuditHook = Optional.empty();
    private Optional<CsvImportService> csvImportService = Optional.empty();
    private Optional<TransactionTemplate> transactionTemplate = Optional.empty();

    protected JpaCrudService(
            JpaRepository<TEntity, TId> repository,
            EntityMapper<TEntity, TCreate, TUpdate> mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    /**
     * Set the audit hook (e.g. via {@link org.springframework.beans.factory.config.BeanPostProcessor}).
     * When set, create/update/delete will be reported for opt-in auditing.
     */
    public void setCrudAuditHook(CrudAuditHook crudAuditHook) {
        this.crudAuditHook = crudAuditHook == null ? Optional.empty() : Optional.of(crudAuditHook);
    }

    /**
     * Set CSV import service for import endpoint. When set, importFromCsvRows is available.
     */
    public void setCsvImportService(CsvImportService csvImportService) {
        this.csvImportService = csvImportService == null ? Optional.empty() : Optional.of(csvImportService);
    }

    /**
     * Set transaction template for per-row import transactions. When set, each import row is committed separately.
     */
    public void setTransactionTemplate(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate == null ? Optional.empty() : Optional.of(transactionTemplate);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Auto-implemented mapping (no subclass override needed)
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    protected TEntity createEntity(TCreate request) {
        return mapper.toEntity(request);
    }

    @Override
    protected void applyUpdate(TEntity entity, TUpdate request) {
        mapper.updateEntity(request, entity);
    }

    @Override
    @SuppressWarnings("unchecked")
    protected void setTenantId(TEntity entity, UUID tenantId) {
        mapper.setTenantId(entity, tenantId);
    }

    @Override
    @SuppressWarnings("unchecked")
    protected TId getId(TEntity entity) {
        return (TId) mapper.getId(entity);
    }

    @Override
    protected void afterCreate(TEntity entity) {
        crudAuditHook.ifPresent(h -> h.afterCreate(entity));
    }

    @Override
    protected Map<String, Object> beforeUpdate(TEntity entity) {
        return crudAuditHook
            .map(h -> h.beforeUpdate(entity))
            .orElse(Collections.emptyMap());
    }

    @Override
    protected void afterUpdate(TEntity entity, Map<String, Object> beforeSnapshot) {
        crudAuditHook.ifPresent(h -> h.afterUpdate(entity, beforeSnapshot));
    }

    @Override
    protected void afterDelete(TEntity entity) {
        crudAuditHook.ifPresent(h -> h.afterDelete(entity));
    }

    @Override
    protected Optional<TEntity> findById(TId id) {
        if (!isTenantEnabled()) {
            return repository.findById(id);
        }
        if (repository instanceof TenantScopedRepository<?, ?> tenantRepo) {
            @SuppressWarnings("unchecked")
            TenantScopedRepository<TEntity, TId> repo = (TenantScopedRepository<TEntity, TId>) tenantRepo;
            return repo.findByIdAndTenantId(id, tenantId());
        }
        throw new CrudOperationException("Tenant repository required when tenant mode is enabled");
    }

    @Override
    protected boolean existsById(TId id) {
        if (!isTenantEnabled()) {
            return repository.existsById(id);
        }
        if (repository instanceof TenantScopedRepository<?, ?> tenantRepo) {
            @SuppressWarnings("unchecked")
            TenantScopedRepository<TEntity, TId> repo = (TenantScopedRepository<TEntity, TId>) tenantRepo;
            return repo.existsByIdAndTenantId(id, tenantId());
        }
        throw new CrudOperationException("Tenant repository required when tenant mode is enabled");
    }

    @Override
    protected List<TEntity> findAllTenant() {
        if (!isTenantEnabled()) {
            return repository.findAll();
        }
        if (repository instanceof TenantScopedRepository<?, ?> tenantRepo) {
            @SuppressWarnings("unchecked")
            TenantScopedRepository<TEntity, TId> repo = (TenantScopedRepository<TEntity, TId>) tenantRepo;
            return repo.findByTenantId(tenantId());
        }
        throw new CrudOperationException("Tenant repository required when tenant mode is enabled");
    }

    @Override
    protected List<TEntity> findAllTenant(int page, int size) {
        if (!isTenantEnabled()) {
            return repository.findAll(PageRequest.of(page, size)).getContent();
        }
        if (repository instanceof TenantScopedRepository<?, ?> tenantRepo) {
            @SuppressWarnings("unchecked")
            TenantScopedRepository<TEntity, TId> repo = (TenantScopedRepository<TEntity, TId>) tenantRepo;
            return repo.findByTenantId(tenantId(), PageRequest.of(page, size)).getContent();
        }
        throw new CrudOperationException("Tenant repository required when tenant mode is enabled");
    }

    @Override
    protected TEntity save(TEntity entity) {
        return repository.save(entity);
    }

    @Override
    protected void deleteEntity(TEntity entity) {
        repository.delete(entity);
    }

    @Override
    protected List<TEntity> findAll(int page, int size) {
        return repository.findAll(PageRequest.of(page, size)).getContent();
    }

    @Override
    protected List<TEntity> findAll(int page, int size, Sort sort) {
        return repository.findAll(PageRequest.of(page, size, sort)).getContent();
    }

    @Override
    protected long countAll() {
        return repository.count();
    }

    @Override
    protected long countAllTenant() {
        if (!isTenantEnabled()) {
            return repository.count();
        }
        if (repository instanceof TenantScopedRepository<?, ?> tenantRepo) {
            @SuppressWarnings("unchecked")
            TenantScopedRepository<TEntity, TId> repo = (TenantScopedRepository<TEntity, TId>) tenantRepo;
            return repo.countByTenantId(tenantId());
        }
        throw new CrudOperationException("Tenant repository required when tenant mode is enabled");
    }

    @Override
    protected List<TEntity> findAllBySpec(Specification<TEntity> spec, int page, int size) {
        if (repository instanceof JpaSpecificationExecutor<?>) {
            @SuppressWarnings("unchecked")
            JpaSpecificationExecutor<TEntity> specExecutor = (JpaSpecificationExecutor<TEntity>) repository;
            return specExecutor.findAll(spec, PageRequest.of(page, size)).getContent();
        }
        throw new CrudOperationException("Repository must implement JpaSpecificationExecutor for criteria-based search");
    }

    @Override
    protected List<TEntity> findAllBySpec(Specification<TEntity> spec, int page, int size, Sort sort) {
        if (repository instanceof JpaSpecificationExecutor<?>) {
            @SuppressWarnings("unchecked")
            JpaSpecificationExecutor<TEntity> specExecutor = (JpaSpecificationExecutor<TEntity>) repository;
            return specExecutor.findAll(spec, PageRequest.of(page, size, sort)).getContent();
        }
        throw new CrudOperationException("Repository must implement JpaSpecificationExecutor for criteria-based search");
    }

    @Override
    protected long countBySpec(Specification<TEntity> spec) {
        if (repository instanceof JpaSpecificationExecutor<?>) {
            @SuppressWarnings("unchecked")
            JpaSpecificationExecutor<TEntity> specExecutor = (JpaSpecificationExecutor<TEntity>) repository;
            return specExecutor.count(spec);
        }
        throw new CrudOperationException("Repository must implement JpaSpecificationExecutor for criteria-based search");
    }

    @Override
    protected List<TEntity> findForExportBySpec(Specification<TEntity> spec, int maxRows, Sort sort) {
        Specification<TEntity> effectiveSpec = spec != null ? spec : (root, query, cb) -> cb.conjunction();
        if (repository instanceof JpaSpecificationExecutor<?>) {
            @SuppressWarnings("unchecked")
            JpaSpecificationExecutor<TEntity> specExecutor = (JpaSpecificationExecutor<TEntity>) repository;
            return specExecutor.findAll(effectiveSpec, PageRequest.of(0, maxRows, sort)).getContent();
        }
        throw new CrudOperationException("Repository must implement JpaSpecificationExecutor for export");
    }

    @Override
    protected Specification<TEntity> buildNaturalKeySpecification(Map<String, String> row, List<String> naturalKeyFields) {
        return (root, query, cb) -> {
            List<Predicate> andPredicates = new ArrayList<>();
            if (isTenantEnabled()) {
                andPredicates.add(cb.equal(root.get("tenantId"), tenantId()));
            }
            if (naturalKeyFields != null) {
                for (String field : naturalKeyFields) {
                    String val = row != null ? row.get(field) : null;
                    if (val != null && !val.isBlank()) {
                        andPredicates.add(cb.equal(root.get(field).as(String.class), val.trim()));
                    }
                }
            }
            return andPredicates.isEmpty() ? cb.conjunction() : cb.and(andPredicates.toArray(new Predicate[0]));
        };
    }

    @Override
    public ImportResult importFromCsvRows(List<Map<String, String>> rows, Class<TEntity> entityClass,
                                          List<String> importFields, List<String> naturalKeyFields,
                                          CsvImportService csvImportService) {
        if (csvImportService == null) {
            throw new CrudOperationException("CsvImportService is required for import");
        }
        int totalRows = rows != null ? rows.size() : 0;
        if (totalRows > IMPORT_MAX_ROWS) {
            throw new CrudOperationException("Import exceeds maximum rows: " + IMPORT_MAX_ROWS);
        }
        Map<String, String> fieldMapping = null; // CSV header = entity field name
        List<String> skipOnUpdate = List.of("id", "tenantId", "createdAt", "updatedAt");

        int created = 0, updated = 0, skipped = 0, failed = 0;
        List<ImportError> errors = new ArrayList<>();

        for (int i = 0; rows != null && i < rows.size(); i++) {
            int rowNum = i + 2; // 1-based, and +1 for header
            Map<String, String> row = rows.get(i);
            final boolean[] wasUpdate = { false };
            Runnable runOne = () -> {
                List<String> validationErrors = csvImportService.validate(row, naturalKeyFields != null ? naturalKeyFields : List.of());
                if (!validationErrors.isEmpty()) {
                    throw new CsvImportRowException(validationErrors);
                }
                Optional<TEntity> existing = naturalKeyFields != null && !naturalKeyFields.isEmpty()
                        ? findOneByCriteria(buildNaturalKeySpecification(row, naturalKeyFields))
                        : Optional.empty();
                if (existing.isPresent()) {
                    wasUpdate[0] = true;
                    TEntity entity = existing.get();
                    Map<String, Object> beforeSnapshot = beforeUpdate(entity);
                    csvImportService.applyToEntity(row, entity, fieldMapping, skipOnUpdate);
                    save(entity);
                    afterUpdate(entity, beforeSnapshot);
                } else {
                    TEntity entity = csvImportService.mapToEntity(row, entityClass, fieldMapping);
                    if (isTenantEnabled()) {
                        setTenantId(entity, tenantId());
                    }
                    save(entity);
                    afterCreate(entity);
                }
            };
            try {
                if (transactionTemplate.isPresent()) {
                    transactionTemplate.get().executeWithoutResult(status -> runOne.run());
                } else {
                    runOne.run();
                }
                if (wasUpdate[0]) {
                    updated++;
                } else {
                    created++;
                }
            } catch (CsvImportRowException e) {
                failed++;
                for (String msg : e.getMessages()) {
                    errors.add(new ImportError(rowNum, null, msg));
                }
            } catch (Exception e) {
                failed++;
                String message = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                errors.add(new ImportError(rowNum, null, message));
            }
        }

        return new ImportResult(created, updated, skipped, failed, errors, totalRows);
    }

    @Override
    protected Specification<TEntity> buildSearchSpecification(String search, List<String> searchFields) {
        final String normalizedSearch = search == null ? "" : search.trim().toLowerCase();

        return (root, query, cb) -> {
            List<Predicate> andPredicates = new ArrayList<>();

            // Always enforce tenant scope when enabled.
            if (isTenantEnabled()) {
                andPredicates.add(cb.equal(root.get("tenantId"), tenantId()));
            }

            Set<String> resolvedFields = resolveSearchableStringFields(root, searchFields);
            if (resolvedFields.isEmpty() || !StringUtils.hasText(normalizedSearch)) {
                return andPredicates.isEmpty()
                        ? cb.conjunction()
                        : cb.and(andPredicates.toArray(new Predicate[0]));
            }

            String likePattern = "%" + normalizedSearch + "%";
            List<Predicate> orPredicates = new ArrayList<>();
            for (String field : resolvedFields) {
                orPredicates.add(cb.like(cb.lower(root.get(field).as(String.class)), likePattern));
            }

            andPredicates.add(cb.or(orPredicates.toArray(new Predicate[0])));
            return cb.and(andPredicates.toArray(new Predicate[0]));
        };
    }

    private Set<String> resolveSearchableStringFields(Root<TEntity> root, List<String> requestedFields) {
        Set<String> availableStringFields = new LinkedHashSet<>();
        for (SingularAttribute<? super TEntity, ?> attribute : root.getModel().getSingularAttributes()) {
            Class<?> javaType = attribute.getJavaType();
            if (javaType == String.class) {
                String name = attribute.getName();
                if (!"tenantId".equals(name)) {
                    availableStringFields.add(name);
                }
            }
        }

        if (requestedFields == null || requestedFields.isEmpty()) {
            return availableStringFields;
        }

        Set<String> selected = new LinkedHashSet<>();
        for (String field : requestedFields) {
            if (field == null) {
                continue;
            }
            String normalized = field.trim();
            if (!normalized.isEmpty() && availableStringFields.contains(normalized)) {
                selected.add(normalized);
            }
        }
        return selected.isEmpty() ? availableStringFields : selected;
    }
}

