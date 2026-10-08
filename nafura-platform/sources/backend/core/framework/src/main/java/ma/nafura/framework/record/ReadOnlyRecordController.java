package ma.nafura.platform.framework.record;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.scope.DataScope;

/**
 * Read-only REST API of a record (or a SQL view / projection): list (page, sort, search, filters),
 * {@code /properties} and {@code /aggregate}. No create, update or delete.
 * Same classpath descriptor as {@link RecordController} ({@code records/<record>.json}).
 */
public abstract class ReadOnlyRecordController<E extends TenantEntity> {

    private static final int MAX_PAGE = 500;
    private static final Set<String> ENDPOINTS = Set.of("list", "options", "get", "properties", "aggregate");

    @Autowired
    private RecordCatalog records;

    @Autowired
    private EntityManager entities;

    @Autowired
    private ObjectProvider<OrganizationZone> zones;

    @Autowired
    private ObjectProvider<DataScope> dataScope;

    private RecordDescriptor descriptor;

    protected abstract RecordRepository<E> repository();

    /** Field shown by {@code /options}. */
    protected String labelField() {
        return "id";
    }

    protected Sort defaultSort() {
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }

    /** Classpath JSON of the record, e.g. {@code "records/audit-event.json"}; none by default. */
    protected String recordResource() {
        return null;
    }

    /**
     * When true, list/get also include rows whose {@code tenantId} is null (platform-wide rows shared with every tenant).
     */
    protected boolean includeSharedTenantRows() {
        return false;
    }

    /** Called before list, options and aggregate (e.g. refresh a projection before the listing). */
    protected void beforeQuery(Map<String, String> params) {
    }

    /** The loaded descriptor, or null when {@link #recordResource()} is unset. */
    protected final RecordDescriptor descriptor() {
        return descriptor;
    }

    /** Catalog of record types (targets of relations, endpoints). */
    protected final RecordCatalog records() {
        return records;
    }

    @PostConstruct
    void registerReadOnlyRecord() {
        refuseRedefinedEndpoints();
        String resource = recordResource();
        Class<?> recordType = entityClass();
        if (resource != null) {
            descriptor = RecordDescriptor.load(resource, recordType);
            records.register(descriptor, mappingPath(), readPermission(), ClassUtils.getUserClass(getClass()));
        }
        afterRecordRegistered(recordType);
    }

    /**
     * Hook for {@link RecordController}: register rules, lifecycle and write access after the descriptor is loaded.
     */
    protected void afterRecordRegistered(Class<?> recordType) {
    }

    /** An endpoint redefined by a subclass would skip filters or the descriptor. */
    private void refuseRedefinedEndpoints() {
        for (Class<?> type = ClassUtils.getUserClass(getClass());
                type != null && type != ReadOnlyRecordController.class;
                type = type.getSuperclass()) {
            if (type == RecordController.class) {
                continue;
            }
            for (Method method : type.getDeclaredMethods()) {
                if (method.isBridge() || method.isSynthetic() || Modifier.isStatic(method.getModifiers())) {
                    continue;
                }
                if (ENDPOINTS.contains(method.getName())) {
                    throw new IllegalStateException(type.getName() + " redefines the endpoint " + method.getName()
                            + "() of ReadOnlyRecordController: customise beforeQuery or the descriptor instead");
                }
            }
        }
    }

    private String readPermission() {
        SecuredResource secured = getClass().getAnnotation(SecuredResource.class);
        if (secured == null) {
            return null;
        }
        String domain = secured.domain() == null ? "" : secured.domain().trim();
        String feature = secured.feature() == null ? "" : secured.feature().trim();
        String module = secured.module() == null ? "" : secured.module().trim();
        String resource = secured.resource() == null ? "" : secured.resource().trim();
        if (!domain.isEmpty() && !feature.isEmpty() && !resource.isEmpty()) {
            return domain + "." + feature + "." + resource + ".read";
        }
        if (!module.isEmpty() && !resource.isEmpty()) {
            return module + "." + resource + ".read";
        }
        return null;
    }

    private String mappingPath() {
        RequestMapping mapping = getClass().getAnnotation(RequestMapping.class);
        return mapping != null && mapping.value().length > 0 ? mapping.value()[0] : "";
    }

    @GetMapping
    public Map<String, Object> list(
            @RequestParam Map<String, String> params,
            @RequestParam(value = "sort", required = false) List<String> sortParams) {
        beforeQuery(params);
        int page = Math.max(integer(params.get("page"), 0), 0);
        int size = Math.min(Math.max(integer(params.get("size"), 20), 1), MAX_PAGE);
        Page<E> result = repository().findAll(specification(params), PageRequest.of(page, size, sort(sortParams)));
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("content", result.getContent());
        body.put("totalElements", result.getTotalElements());
        body.put("size", size);
        return body;
    }

    /** {@code [{ value, label }]} for selects and lookups. */
    @GetMapping("/options")
    public List<Map<String, Object>> options(@RequestParam(value = "q", required = false) String q) {
        Map<String, String> params = new LinkedHashMap<>();
        if (q != null) {
            params.put("q", q);
        }
        beforeQuery(params);
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

    /** Declared properties: type, label, whether they can be filtered or sorted, and the values of a select. */
    @GetMapping("/properties")
    public Map<String, Object> properties() {
        if (descriptor == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This record has no properties");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        descriptor.properties().forEach((key, property) -> body.put(key, propertyView(property)));
        return body;
    }

    /** Sum, average and count of the whole filtered result, not of the current page. */
    @GetMapping("/aggregate")
    public Map<String, Object> aggregate(
            @RequestParam Map<String, String> params,
            @RequestParam(value = "sum", required = false) List<String> sums,
            @RequestParam(value = "avg", required = false) List<String> avgs,
            @RequestParam(value = "count", required = false) List<String> counts) {
        beforeQuery(params);
        Specification<E> spec = specification(params);
        Map<String, Object> sum = new LinkedHashMap<>();
        Map<String, Object> avg = new LinkedHashMap<>();
        Map<String, Object> count = new LinkedHashMap<>();
        for (String field : sums == null ? List.<String>of() : sums) {
            requireNumeric(field, "sum");
            sum.put(field, aggregate(spec, "sum", field));
        }
        for (String field : avgs == null ? List.<String>of() : avgs) {
            requireNumeric(field, "avg");
            avg.put(field, aggregate(spec, "avg", field));
        }
        for (String field : counts == null ? List.<String>of() : counts) {
            requireProperty(field);
            count.put(field, aggregate(spec, "count", field));
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sum", sum);
        body.put("avg", avg);
        body.put("count", count);
        return body;
    }

    protected Optional<E> find(UUID id) {
        return find(id, readPermission());
    }

    /** {@code permission} selects the grant closure (read, update, delete). {@code null}: organisation visibility only. */
    protected Optional<E> find(UUID id, String permission) {
        UUID tenantId = TenantContext.getTenantId();
        return repository().findById(id).filter(record -> visibleToTenant(record, tenantId) && visibleToCaller(record, permission));
    }

    private boolean visibleToTenant(E record, UUID tenantId) {
        if (tenantId.equals(record.getTenantId())) {
            return true;
        }
        return includeSharedTenantRows() && record.getTenantId() == null;
    }

    /** External audiences only see records they own. Members are narrowed to their scope grants when the record declares one. */
    private boolean visibleToCaller(E record, String permission) {
        if (externalAudience()) {
            String field = ownerField();
            if (field == null) {
                return false;
            }
            Object owner = new BeanWrapperImpl(record).getPropertyValue(field);
            UUID userId = UserContext.getUserIdOrNull();
            return userId != null && userId.equals(owner);
        }
        DataScope scope = dataScope.getIfAvailable();
        if (scope == null || descriptor == null || permission == null) {
            return true;
        }
        return scope.visible(descriptor.entity(), record.getId(), record, permission);
    }

    private boolean externalAudience() {
        return !"members".equals(UserContext.getAudience());
    }

    private String ownerField() {
        Class<?> type = entityClass();
        if (type == null) {
            return null;
        }
        for (Field field : type.getDeclaredFields()) {
            if (field.getAnnotation(OwnedBy.class) != null) {
                return field.getName();
            }
        }
        return null;
    }

    protected final E require(UUID id) {
        return require(id, readPermission());
    }

    protected final E require(UUID id, String permission) {
        return find(id, permission).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found: " + id));
    }

    /** Permission of this record for an action ({@code read}, {@code create}, {@code update}, {@code delete}). */
    protected final String permission(String action) {
        String read = readPermission();
        if (read == null || !read.endsWith(".read") || action == null || action.isBlank()) {
            return null;
        }
        return read.substring(0, read.length() - "read".length()) + action;
    }

    /** A create or update of a scoped record stays on a node the caller holds for that action. */
    protected final void place(E record, String action) {
        DataScope scope = dataScope.getIfAvailable();
        if (scope == null || descriptor == null) {
            return;
        }
        scope.assertPlaced(descriptor.entity(), record, permission(action));
    }

    protected final Specification<E> specification(Map<String, String> params) {
        UUID tenantId = TenantContext.getTenantId();
        RecordFilter.Context context = filterContext(tenantId);
        Specification<E> search = RecordFilter.search(params.get("q"), descriptor, context);
        Specification<E> filter = descriptor == null ? null : RecordFilter.compile(params.get("filter"), descriptor.properties(), context);
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (includeSharedTenantRows()) {
                predicates.add(cb.or(cb.equal(root.get("tenantId"), tenantId), cb.isNull(root.get("tenantId"))));
            } else {
                predicates.add(cb.equal(root.get("tenantId"), tenantId));
            }
            if (externalAudience()) {
                String field = ownerField();
                UUID userId = UserContext.getUserIdOrNull();
                if (field == null || userId == null) {
                    predicates.add(cb.disjunction());
                } else {
                    predicates.add(cb.equal(root.get(field), userId));
                }
            }
            DataScope scope = dataScope.getIfAvailable();
            if (scope != null && descriptor != null) {
                Specification<E> narrowed = scope.restriction(descriptor.entity(), readPermission());
                if (narrowed != null) {
                    Predicate predicate = narrowed.toPredicate(root, query, cb);
                    if (predicate != null) {
                        predicates.add(predicate);
                    }
                }
            }
            for (Specification<E> extra : Arrays.asList(search, filter)) {
                if (extra == null) {
                    continue;
                }
                Predicate predicate = extra.toPredicate(root, query, cb);
                if (predicate != null) {
                    predicates.add(predicate);
                }
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private RecordFilter.Context filterContext(UUID tenantId) {
        ZoneId zone = zone();
        return new RecordFilter.Context(tenantId, UserContext.getUserIdOrNull(), LocalDate.now(zone), zone, externalAudience(),
                records::target,
                entity -> {
                    RecordCatalog.Target target = records.target(entity);
                    if (target == null || target.readPermission() == null) {
                        return target != null;
                    }
                    if (UserContext.hasPermission(target.readPermission())) {
                        return true;
                    }
                    DataScope scope = dataScope.getIfAvailable();
                    return scope != null && scope.granted(target.readPermission());
                });
    }

    /**
     * Multi-sort: repeated {@code sort=field:asc} (preferred). Also accepts {@code field,asc} and the
     * Spring-split form {@code [field, asc, …]} where a comma inside one query value becomes two list entries.
     */
    private Sort sort(List<String> sortParams) {
        if (sortParams == null || sortParams.isEmpty()) {
            return defaultSort();
        }
        List<Sort.Order> orders = new ArrayList<>();
        for (int i = 0; i < sortParams.size(); i++) {
            String entry = sortParams.get(i);
            if (entry == null || entry.isBlank()) {
                continue;
            }
            if (entry.equalsIgnoreCase("asc") || entry.equalsIgnoreCase("desc")) {
                continue;
            }
            String field;
            Sort.Direction direction = Sort.Direction.ASC;
            if (entry.contains(":")) {
                String[] parts = entry.split(":", 2);
                field = parts[0].trim();
                if (parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc")) {
                    direction = Sort.Direction.DESC;
                }
            } else if (entry.contains(",")) {
                String[] parts = entry.split(",", 2);
                field = parts[0].trim();
                if (parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc")) {
                    direction = Sort.Direction.DESC;
                }
            } else {
                field = entry.trim();
                if (i + 1 < sortParams.size()) {
                    String next = sortParams.get(i + 1);
                    if (next != null && (next.equalsIgnoreCase("asc") || next.equalsIgnoreCase("desc"))) {
                        if (next.equalsIgnoreCase("desc")) {
                            direction = Sort.Direction.DESC;
                        }
                        i++;
                    }
                }
            }
            if (field.isBlank()) {
                continue;
            }
            if (descriptor != null) {
                RecordProperty property = descriptor.property(field);
                if (property == null || !property.sortable()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Property " + field + " is not sortable");
                }
            }
            orders.add(new Sort.Order(direction, field));
        }
        return orders.isEmpty() ? defaultSort() : Sort.by(orders);
    }

    private Map<String, Object> propertyView(RecordProperty property) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("label", property.label());
        view.put("type", property.type());
        view.put("filterable", property.filterable());
        view.put("sortable", property.sortable());
        if (property.target() != null) {
            view.put("target", property.target());
            String endpoint = records.endpoint(property.target());
            if (endpoint != null) {
                view.put("endpoint", endpoint);
                view.put("options", endpoint + "/options");
            }
        }
        if (property.via() != null) {
            view.put("via", property.via());
        }
        if (property.currency() != null) {
            view.put("currency", property.currency());
        }
        if (property.display() != null) {
            view.put("display", property.display());
        }
        if ("status".equals(property.type()) && descriptor != null && descriptor.lifecycle() != null) {
            view.put("values", descriptor.lifecycle().states().stream().map(state -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", state.id());
                item.put("label", state.label());
                item.put("tone", state.tone());
                return item;
            }).toList());
        } else if ("select".equals(property.type())) {
            view.put("values", property.options().stream().map(option -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", option);
                item.put("label", option);
                return item;
            }).toList());
        }
        return view;
    }

    private void requireNumeric(String field, String function) {
        RecordProperty property = requireProperty(field);
        if (!"number".equals(property.type()) && !"money".equals(property.type())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot " + function + " property " + field);
        }
    }

    private RecordProperty requireProperty(String field) {
        if (descriptor == null || descriptor.property(field) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown property " + field);
        }
        return descriptor.property(field);
    }

    private Number aggregate(Specification<E> spec, String function, String field) {
        CriteriaBuilder cb = entities.getCriteriaBuilder();
        CriteriaQuery<Number> query = cb.createQuery(Number.class);
        Root<E> root = query.from(entityClass());
        query.select(switch (function) {
            case "sum" -> cb.sum(root.get(field));
            case "avg" -> cb.avg(root.get(field));
            case "count" -> cb.count(root.get(field));
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown aggregate " + function);
        });
        query.where(spec.toPredicate(root, query, cb));
        Number value = entities.createQuery(query).getSingleResult();
        return value == null ? BigDecimal.ZERO : value;
    }

    private ZoneId zone() {
        ZoneId found = ZoneId.of("UTC");
        for (OrganizationZone candidate : zones) {
            if (candidate instanceof UtcOrganizationZone) {
                continue;
            }
            try {
                return candidate.zone();
            } catch (RuntimeException ignored) {
                return found;
            }
        }
        return found;
    }

    @SuppressWarnings("unchecked")
    protected final Class<E> entityClass() {
        Class<?> fromReadOnly = GenericTypeResolver.resolveTypeArgument(getClass(), ReadOnlyRecordController.class);
        if (fromReadOnly != null) {
            return (Class<E>) fromReadOnly;
        }
        return (Class<E>) GenericTypeResolver.resolveTypeArgument(getClass(), RecordController.class);
    }

    private static int integer(String value, int fallback) {
        try {
            return value == null ? fallback : Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }
}
