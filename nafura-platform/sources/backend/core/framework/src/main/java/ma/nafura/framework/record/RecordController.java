package ma.nafura.platform.framework.record;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.convert.ConversionException;
import org.springframework.core.convert.support.DefaultConversionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.domain.TenantEntity;

/**
 * The REST API of a business record, from its entity and repository: list (page, sort, search, filters),
 * options for selects, read, create, update, delete, and its lifecycle when it has one.
 * A business context writes {@code @SecuredResource(...) class XController extends RecordController<X>}:
 * permissions follow the HTTP method, Bean Validation on the entity validates the body.
 */
public abstract class RecordController<E extends TenantEntity> {

    private static final Set<String> MANAGED = Set.of("id", "tenantId", "createdAt", "updatedAt", "createdBy", "updatedBy", "status");
    private static final int MAX_PAGE = 500;

    @Autowired
    private LifecycleEngine lifecycles;

    private Lifecycle lifecycle;

    protected abstract RecordRepository<E> repository();

    /** Fields searched by {@code q} (contains, case-insensitive). */
    protected List<String> searchFields() {
        return List.of();
    }

    /** Fields filterable by equality, as query parameters ({@code ?supplierId=...}). */
    protected Set<String> filterFields() {
        return Set.of();
    }

    /** Field shown by {@code /options}. */
    protected String labelField() {
        return "id";
    }

    protected Sort defaultSort() {
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    /** Classpath JSON of the record lifecycle, e.g. {@code "lifecycle/purchase-request.json"}; none by default. */
    protected String lifecycleResource() {
        return null;
    }

    @PostConstruct
    void registerLifecycle() {
        String resource = lifecycleResource();
        if (resource != null) {
            lifecycle = Lifecycle.load(resource);
            lifecycles.<HasStatus>register(lifecycle, id -> find(id).map(HasStatus.class::cast), r -> repository().save(cast(r)));
        }
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        int page = Math.max(integer(params.get("page"), 0), 0);
        int size = Math.min(Math.max(integer(params.get("size"), 20), 1), MAX_PAGE);
        Page<E> result = repository().findAll(specification(params), PageRequest.of(page, size, sort(params.get("sort"))));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content", result.getContent());
        body.put("totalElements", result.getTotalElements());
        return body;
    }

    /** {@code [{ value, label }]} for selects and lookups. */
    @GetMapping("/options")
    public List<Map<String, Object>> options(@RequestParam(value = "q", required = false) String q) {
        Map<String, String> params = new LinkedHashMap<>();
        if (q != null) {
            params.put("q", q);
        }
        return repository().findAll(specification(params), PageRequest.of(0, MAX_PAGE, Sort.by(labelField()))).stream()
                .map(record -> {
                    Map<String, Object> option = new LinkedHashMap<>();
                    option.put("value", record.getId());
                    option.put("label", new BeanWrapperImpl(record).getPropertyValue(labelField()));
                    return option;
                })
                .toList();
    }

    @GetMapping("/{id}")
    public E get(@PathVariable UUID id) {
        return require(id);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<E> create(@Valid @RequestBody E body) {
        body.setId(null);
        body.setTenantId(TenantContext.getTenantId());
        if (body instanceof HasStatus record) {
            record.setStatus(lifecycle != null ? lifecycle.initial() : record.getStatus());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(repository().save(body));
    }

    /** Replaces the editable fields; id, tenant, audit fields and status stay. */
    @PutMapping("/{id}")
    @Transactional
    public E update(@PathVariable UUID id, @Valid @RequestBody E body) {
        E record = require(id);
        requireEditable(record);
        BeanUtils.copyProperties(body, record, MANAGED.toArray(String[]::new));
        return repository().save(record);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        E record = require(id);
        requireEditable(record);
        repository().delete(record);
        return ResponseEntity.noContent().build();
    }

    /** Declared states and transitions (labels, tones) — the UI draws the status from it. */
    @GetMapping("/lifecycle")
    public Lifecycle lifecycle() {
        return requireLifecycle();
    }

    /** Transitions the current user may fire on this record now. */
    @GetMapping("/{id}/transitions")
    public List<Map<String, Object>> transitions(@PathVariable UUID id) {
        Lifecycle declared = requireLifecycle();
        E record = require(id);
        List<Map<String, Object>> available = new ArrayList<>();
        for (Lifecycle.Transition t : lifecycles.available(declared, (HasStatus) record)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", t.id());
            item.put("label", t.label());
            item.put("to", t.to());
            item.put("approval", t.approval() != null);
            available.add(item);
        }
        return available;
    }

    /** Reading the record is enough to call it: each transition checks its own permission. */
    @PostMapping("/{id}/transitions/{transition}")
    @RequirePermission("read")
    @Transactional
    public E fire(@PathVariable UUID id, @PathVariable String transition) {
        Lifecycle declared = requireLifecycle();
        E record = require(id);
        lifecycles.fire(declared, (HasStatus) record, id, transition, r -> repository().save(record));
        return record;
    }

    protected Optional<E> find(UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        return repository().findById(id).filter(record -> tenantId.equals(record.getTenantId()));
    }

    private E require(UUID id) {
        return find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found: " + id));
    }

    private void requireEditable(E record) {
        if (lifecycle != null && record instanceof HasStatus status && !lifecycle.isEditable(status.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Record not editable in status " + status.getStatus());
        }
    }

    private Lifecycle requireLifecycle() {
        if (lifecycle == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This record has no lifecycle");
        }
        return lifecycle;
    }

    private Specification<E> specification(Map<String, String> params) {
        UUID tenantId = TenantContext.getTenantId();
        Set<String> filters = filterFields();
        String q = params.get("q");
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("tenantId"), tenantId));
            if (q != null && !q.isBlank() && !searchFields().isEmpty()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.or(searchFields().stream()
                        .map(f -> cb.like(cb.lower(root.get(f).as(String.class)), like))
                        .toArray(Predicate[]::new)));
            }
            params.forEach((field, value) -> {
                if (filters.contains(field) && value != null && !value.isBlank()) {
                    var path = root.get(field);
                    predicates.add(value.equals("null")
                            ? cb.isNull(path)
                            : cb.equal(path, typed(value, path.getJavaType())));
                }
            });
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Sort sort(String sort) {
        if (sort == null || sort.isBlank()) {
            return defaultSort();
        }
        String[] parts = sort.split(",");
        Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        return Stream.of(parts[0]).filter(f -> !f.isBlank()).findFirst().map(f -> Sort.by(direction, f)).orElse(defaultSort());
    }

    private static Object typed(String value, Class<?> type) {
        try {
            return DefaultConversionService.getSharedInstance().convert(value, type);
        } catch (ConversionException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid filter value: " + value);
        }
    }

    private static int integer(String value, int fallback) {
        try {
            return value == null ? fallback : Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    @SuppressWarnings("unchecked")
    private E cast(HasStatus record) {
        return (E) record;
    }
}
