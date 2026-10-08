package ma.nafura.platform.framework.record;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.server.ResponseStatusException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.domain.TenantEntity;
import ma.nafura.platform.framework.service.crud.CrudAuditHook;

/**
 * The REST API of a business record, from its entity and repository: list (page, sort, search, filters),
 * options for selects, read, create, update, delete, and its lifecycle when it has one.
 * A business context writes {@code @SecuredResource(...) class XController extends RecordController<X>}:
 * permissions follow the HTTP method, Bean Validation on the entity validates the body.
 * Business logic goes in {@link #validate}, {@link #beforeSave}, {@link #afterSave}, {@link #beforeDelete} and
 * {@link #readOnlyFields}; redefining an endpoint of this class or {@link ReadOnlyRecordController} fails startup.
 */
public abstract class RecordController<E extends TenantEntity> extends ReadOnlyRecordController<E> {

    private static final Logger log = LoggerFactory.getLogger(RecordController.class);
    private static final Set<String> MANAGED = Set.of("id", "tenantId", "createdAt", "updatedAt", "createdBy", "updatedBy", "status");
    private static final Set<String> ENDPOINTS = Set.of(
            "create", "update", "delete", "lifecycle", "transitions", "fire");

    @Autowired
    private LifecycleEngine lifecycles;

    @Autowired
    private RecordAccess recordAccess;

    @Autowired
    private ObjectProvider<LifecycleNotifications> notifications;

    @Autowired
    private ObjectProvider<CrudAuditHook> auditHook;

    private Lifecycle lifecycle;

    /**
     * Rules across fields, field → message. Not empty refuses the save (422, field errors) and nothing is stored.
     * {@code previous} is a detached copy of the stored record, {@code null} while creating. Also applied to seeds.
     */
    protected Map<String, String> validate(E record, E previous) {
        return Map.of();
    }

    /** Computed values and normalisation, after {@link #validate}, in the transaction. Also applied to seeds. */
    protected void beforeSave(E record, E previous) {
    }

    /** Effects once the record and its audit are saved (a parent's total, lines), in the transaction. Also applied to seeds. */
    protected void afterSave(E saved, E previous) {
    }

    /** After the editable check: throw {@link RecordRuleException#refused} to keep the record (409). */
    protected void beforeDelete(E record) {
    }

    /** Fields the API never writes (hash, secret, values set by {@link #beforeSave}): ignored in a create or update body. */
    protected Set<String> readOnlyFields() {
        return Set.of();
    }

    @Override
    protected void afterRecordRegistered(Class<?> recordType) {
        refuseRedefinedWriteEndpoints();
        registerRules(recordType);
        RecordDescriptor descriptor = descriptor();
        if (descriptor != null) {
            lifecycle = descriptor.lifecycle();
            if (lifecycle != null) {
                String source = recordResource();
                checkNotify(lifecycle, recordType, source);
                checkApproval(lifecycle, source);
                lifecycles.<HasStatus>register(recordType, lifecycle, id -> find(id).map(HasStatus.class::cast), r -> repository().save(cast(r)));
            }
        }
        registerAccess();
    }

    /** An endpoint redefined by a subclass would skip the editable check, the audit or the rules. */
    private void refuseRedefinedWriteEndpoints() {
        for (Class<?> type = ClassUtils.getUserClass(getClass());
                type != null && type != RecordController.class && type != ReadOnlyRecordController.class;
                type = type.getSuperclass()) {
            for (Method method : type.getDeclaredMethods()) {
                if (method.isBridge() || method.isSynthetic() || Modifier.isStatic(method.getModifiers())) {
                    continue;
                }
                if (ENDPOINTS.contains(method.getName())) {
                    throw new IllegalStateException(type.getName() + " redefines the endpoint " + method.getName()
                            + "() of RecordController: use validate, beforeSave, afterSave, beforeDelete or readOnlyFields");
                }
            }
        }
    }

    /** The seed applies the same rules as the API. */
    private void registerRules(Class<?> recordType) {
        if (recordType == null) {
            return;
        }
        records().registerRules(recordType, new RecordCatalog.Rules() {
            @Override
            public Map<String, String> validate(Object record) {
                Map<String, String> errors = RecordController.this.validate(entity(record), null);
                return errors == null ? Map.of() : errors;
            }

            @Override
            public void beforeSave(Object record) {
                RecordController.this.beforeSave(entity(record), null);
            }

            @Override
            public void afterSave(Object record) {
                RecordController.this.afterSave(entity(record), null);
            }
        });
    }

    /** Entity key of attachments and notes: the lifecycle entity, otherwise the last segment of the mapping. */
    private void registerAccess() {
        SecuredResource secured = getClass().getAnnotation(SecuredResource.class);
        if (secured == null || recordAccess == null) {
            return;
        }
        String scope = secured.domain() + "." + secured.feature() + "." + secured.resource();
        recordAccess.register(recordKey(), scope + ".read", scope + ".update", id -> find(id).isPresent());
    }

    private String recordKey() {
        if (lifecycle != null && lifecycle.entity() != null && !lifecycle.entity().isBlank()) {
            return lifecycle.entity();
        }
        String path = mappingPath();
        int slash = path.lastIndexOf('/');
        return slash >= 0 ? path.substring(slash + 1) : path;
    }

    private String mappingPath() {
        org.springframework.web.bind.annotation.RequestMapping mapping =
                getClass().getAnnotation(org.springframework.web.bind.annotation.RequestMapping.class);
        return mapping != null && mapping.value().length > 0 ? mapping.value()[0] : "";
    }

    private void checkNotify(Lifecycle declared, Class<?> recordType, String source) {
        boolean any = declared.transitions().stream().anyMatch(t -> t.notifications() != null && !t.notifications().isEmpty());
        if (!any) {
            return;
        }
        if (notifications == null || notifications.getIfAvailable() == null) {
            log.warn("Lifecycle {} declares notify but notifications are disabled; they will be ignored ({})", declared.entity(), source);
        }
        Set<String> permissions = DeclaredPermissions.load();
        Set<String> events = DeclaredNotifications.load().keySet();
        Set<String> properties = recordType == null ? Set.of() : Stream.of(BeanUtils.getPropertyDescriptors(recordType)).map(d -> d.getName()).collect(java.util.stream.Collectors.toSet());
        for (Lifecycle.Transition transition : declared.transitions()) {
            if (transition.notifications() == null) {
                continue;
            }
            for (Lifecycle.Notify notify : transition.notifications()) {
                if (!events.contains(notify.event())) {
                    throw new IllegalStateException("Invalid lifecycle " + source + ": " + transition.id() + " notifies undeclared event " + notify.event());
                }
                String to = notify.to();
                if (to.startsWith("field:")) {
                    String field = to.substring("field:".length());
                    if (!properties.contains(field)) {
                        throw new IllegalStateException("Invalid lifecycle " + source + ": " + transition.id() + " notifies unknown field " + field);
                    }
                }
                if (to.startsWith("permission:")) {
                    String permission = to.substring("permission:".length());
                    if (!permissions.isEmpty() && !permissions.contains(permission)) {
                        throw new IllegalStateException("Invalid lifecycle " + source + ": " + transition.id() + " notifies undeclared permission " + permission);
                    }
                }
            }
        }
    }

    /** Approval permissions must be declared in a BC manifest (same rule as {@code notify}). */
    private void checkApproval(Lifecycle declared, String source) {
        Set<String> permissions = DeclaredPermissions.load();
        if (permissions.isEmpty()) {
            return;
        }
        for (Lifecycle.Transition transition : declared.transitions()) {
            if (transition.approval() == null) {
                continue;
            }
            String permission = transition.approval().permission();
            if (!permissions.contains(permission)) {
                throw new IllegalStateException("Invalid lifecycle " + source + ": " + transition.id()
                        + " approval uses undeclared permission " + permission);
            }
        }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<E> create(@Valid @RequestBody E body) {
        body.setId(null);
        body.setTenantId(TenantContext.getTenantId());
        if (body instanceof HasStatus record) {
            record.setStatus(lifecycle != null ? lifecycle.initial() : record.getStatus());
        }
        clearReadOnly(body);
        check(body, null);
        place(body, "create");
        beforeSave(body, null);
        E saved = repository().save(body);
        auditHook.ifAvailable(hook -> hook.afterCreate(saved));
        afterSave(saved, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** Replaces the editable fields; id, tenant, audit fields, status and {@link #readOnlyFields} stay. */
    @PutMapping("/{id}")
    @Transactional
    public E update(@PathVariable UUID id, @Valid @RequestBody E body) {
        E record = require(id, permission("update"));
        requireEditable(record);
        E previous = copy(record);
        CrudAuditHook hook = auditHook.getIfAvailable();
        Map<String, Object> before = hook != null ? hook.beforeUpdate(record) : Map.of();
        BeanUtils.copyProperties(body, record, kept(record));
        check(record, previous);
        place(record, "update");
        beforeSave(record, previous);
        E saved = repository().save(record);
        if (hook != null) {
            hook.afterUpdate(saved, before);
        }
        afterSave(saved, previous);
        return saved;
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        E record = require(id, permission("delete"));
        requireEditable(record);
        beforeDelete(record);
        auditHook.ifAvailable(hook -> hook.afterDelete(record));
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
        CrudAuditHook hook = auditHook.getIfAvailable();
        Map<String, Object> before = hook != null ? hook.beforeUpdate(record) : Map.of();
        lifecycles.fire(declared, (HasStatus) record, id, transition, r -> repository().save(record));
        if (hook != null) {
            hook.afterUpdate(record, before);
        }
        return record;
    }

    private void check(E record, E previous) {
        Map<String, String> errors = validate(record, previous);
        if (errors != null && !errors.isEmpty()) {
            throw RecordRuleException.fields(errors);
        }
    }

    /**
     * Properties an update body never overwrites: managed and {@link #readOnlyFields}, plus every field
     * outside {@code editableFields} for the current status (ignored silently, like managed fields).
     */
    private String[] kept(E existing) {
        Set<String> keep = new java.util.LinkedHashSet<>(MANAGED);
        keep.addAll(readOnlyFields());
        if (lifecycle != null && existing instanceof HasStatus status) {
            lifecycle.editableFieldsOf(status.getStatus()).ifPresent(allowed -> {
                for (java.beans.PropertyDescriptor descriptor : BeanUtils.getPropertyDescriptors(entityClass())) {
                    String name = descriptor.getName();
                    if ("class".equals(name) || allowed.contains(name)) {
                        continue;
                    }
                    keep.add(name);
                }
            });
        }
        return keep.toArray(String[]::new);
    }

    /** A create body cannot set a read-only field: it gets the value of a new record. */
    private void clearReadOnly(E record) {
        Set<String> readOnly = readOnlyFields();
        if (readOnly.isEmpty()) {
            return;
        }
        BeanWrapperImpl fresh = new BeanWrapperImpl(BeanUtils.instantiateClass(entityClass()));
        BeanWrapperImpl target = new BeanWrapperImpl(record);
        for (String field : readOnly) {
            target.setPropertyValue(field, fresh.getPropertyValue(field));
        }
    }

    /** A detached copy of the stored state, for {@code previous}. */
    private E copy(E record) {
        E copy = BeanUtils.instantiateClass(entityClass());
        BeanUtils.copyProperties(record, copy);
        return copy;
    }

    @SuppressWarnings("unchecked")
    private E entity(Object record) {
        return (E) record;
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

    @SuppressWarnings("unchecked")
    private E cast(HasStatus record) {
        return (E) record;
    }
}

