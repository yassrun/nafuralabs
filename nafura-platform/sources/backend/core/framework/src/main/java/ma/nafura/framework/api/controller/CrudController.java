package ma.nafura.platform.framework.api.controller;

import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.platform.framework.service.csv.CsvExportService;
import ma.nafura.platform.framework.service.csv.CsvImportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Generic REST controller providing standard CRUD endpoints.
 * Subclasses only need to provide the service instance and path mapping.
 *
 * Standard routes:
 * - GET    /{basePath}              → list with pagination & sorting
 * - GET    /{basePath}/lookup       → lightweight lookup list (key/value)
 * - GET    /{basePath}/count        → count total entities
 * - GET    /{basePath}/{id}         → get by ID
 * - POST   /{basePath}              → create
 * - PUT    /{basePath}/{id}         → update
 * - DELETE /{basePath}/{id}         → delete
 * - POST   /{basePath}/batch        → create batch
 * - DELETE /{basePath}/batch        → delete batch
 *
 * @param <TId>     Entity ID type
 * @param <TEntity> Entity type
 * @param <TCreate> Create DTO type
 * @param <TUpdate> Update DTO type
 */
@Validated
public abstract class CrudController<TId, TEntity, TCreate, TUpdate> {

    private static final int IMPORT_EXPORT_MAX_ROWS = 10_000;
    private static final long MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    @Autowired(required = false)
    private CsvImportService csvImportService;
    @Autowired(required = false)
    private CsvExportService csvExportService;

    /**
     * Subclasses must provide the CRUD service instance.
     */
    protected abstract CrudService<TId, TEntity, TCreate, TUpdate> getService();

    /** Override to enable import; default false. When true, also override getEntityClass(), getImportFields(), getNaturalKeyFields(). */
    protected boolean isImportEnabled() { return false; }
    /** Override to enable export; default false. When true, also override getEntityClass(), getExportFields(). */
    protected boolean isExportEnabled() { return false; }
    /** Entity class for import/export; override when enabling. Default null. */
    @SuppressWarnings("unchecked")
    protected Class<TEntity> getEntityClass() { return null; }
    /** CSV column/field names for import; override when enabling import. */
    protected List<String> getImportFields() { return List.of(); }
    /** Field names for export columns; override when enabling export. */
    protected List<String> getExportFields() { return List.of(); }
    /** Natural key fields for import (determines create vs update); override when enabling import. */
    protected List<String> getNaturalKeyFields() { return List.of(); }

    protected CsvImportService getCsvImportService() { return csvImportService; }
    protected CsvExportService getCsvExportService() { return csvExportService; }

    // ─────────────────────────────────────────────────────────────────────────
    // Standard CRUD endpoints
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /{basePath}
     * List entities with pagination and optional sorting.
     * 
     * @param page Page number (0-indexed)
     * @param size Page size
     * @param sort Optional sort parameter (e.g., "name,asc" or "createdAt,desc")
     */
    @GetMapping
    public ResponseEntity<Page<TEntity>> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", required = false) String sort,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "searchFields", required = false) String searchFields) {

        List<TEntity> items;
        long total;
        String effectiveSearch = hasText(search) ? search : q;
        Sort sortObj = hasText(sort) ? parseSort(sort) : null;

        if (hasText(effectiveSearch)) {
            List<String> fields = parseSearchFields(searchFields);
            total = getService().countSearch(effectiveSearch, fields);
            if (sortObj != null) {
                items = getService().searchPage(effectiveSearch, fields, page, size, sortObj);
            } else {
                items = getService().searchPage(effectiveSearch, fields, page, size);
            }
        } else {
            total = getService().count();
            if (sortObj != null) {
                items = getService().listPage(page, size, sortObj);
            } else {
                items = getService().listPage(page, size);
            }
        }

        Page<TEntity> pageResult = new PageImpl<>(items, PageRequest.of(page, size), total);
        return ResponseEntity.ok(pageResult);
    }

    /**
     * GET /{basePath}/lookup
     * Lightweight lookup payload for selects/autocomplete.
     *
     * @param q Optional search text
     * @param page Page number (0-indexed)
     * @param size Page size
     * @param sort Optional sort parameter (e.g., "name,asc")
     * @param searchFields Optional comma-separated fields used for search
     * @param labelField Optional field used as display value
     * @param valueField Optional field used as key value
     */
    @GetMapping("/lookup")
    public ResponseEntity<CrudService.LookupResponse> lookup(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", required = false) String sort,
            @RequestParam(value = "searchFields", required = false) String searchFields,
            @RequestParam(value = "labelField", required = false) String labelField,
            @RequestParam(value = "valueField", required = false) String valueField) {

        String effectiveSearch = hasText(search) ? search : q;
        Sort sortObj = hasText(sort) ? parseSort(sort) : null;
        List<String> fields = parseSearchFields(searchFields);
        CrudService.LookupResponse result = getService().lookup(
                effectiveSearch,
                fields,
                page,
                size,
                sortObj,
                labelField,
                valueField
        );
        return ResponseEntity.ok(result);
    }

    /**
     * GET /{basePath}/count
     * Get total count of entities.
     */
    @GetMapping("/count")
    public ResponseEntity<Long> count() {
        long total = getService().count();
        return ResponseEntity.ok(total);
    }

    /**
     * GET /{basePath}/{id}
     * Get entity by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<TEntity> getById(@PathVariable TId id) {
        return getService().getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /{basePath}
     * Create new entity.
     */
    @PostMapping
    public ResponseEntity<TEntity> create(@Valid @RequestBody TCreate request) {
        TEntity created = getService().create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /{basePath}/{id}
     * Update existing entity.
     */
    @PutMapping("/{id}")
        public ResponseEntity<TEntity> update(
            @PathVariable TId id,
            @Valid @RequestBody TUpdate request) {
        
        TEntity updated = getService().update(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /{basePath}/{id}
     * Delete entity by ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable TId id) {
        getService().delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /{basePath}/batch
     * Create multiple entities.
     */
    @PostMapping("/batch")
    public ResponseEntity<List<TEntity>> createBatch(@Valid @RequestBody List<TCreate> requests) {
        List<TEntity> created = getService().createAll(requests);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * DELETE /{basePath}/batch
     * Delete multiple entities by IDs.
     */
    @DeleteMapping("/batch")
    public ResponseEntity<BatchDeleteResponse> deleteBatch(@RequestBody List<TId> ids) {
        int deleted = getService().deleteAll(ids);
        return ResponseEntity.ok(new BatchDeleteResponse(deleted));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Response DTOs & Helpers
    // ─────────────────────────────────────────────────────────────────────────

    public record BatchDeleteResponse(int deletedCount) {}

    /**
     * Parse sort string (e.g., "name,asc" or "createdAt,desc") into Sort object.
     */
    private Sort parseSort(String sortStr) {
        String[] parts = sortStr.split(",");
        String property = parts[0];
        Sort.Direction direction = parts.length > 1 && "desc".equalsIgnoreCase(parts[1])
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return Sort.by(direction, property);
    }

    private List<String> parseSearchFields(String raw) {
        if (!hasText(raw)) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toList());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}

