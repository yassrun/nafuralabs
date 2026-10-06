package ma.nafura.platform.collaboration.audit;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import ma.nafura.platform.framework.audit.Auditable;
import ma.nafura.platform.framework.autonumber.ApplicationContextProvider;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Queues audit rows and writes them in {@code beforeCompletion} via {@link #flushPending()}
 * so Hibernate interceptors never persist {@code AuditEvent} mid-flush (which would recurse).
 * {@code beforeCompletion} is required: when capture runs from an interceptor during the
 * commit flush, a sync registered then is too late for {@code beforeCommit} (Spring walks a
 * snapshot). The writer must not be named {@code flush()} — that resolves to
 * {@link TransactionSynchronization#flush()} inside the sync and would no-op.
 *
 * <p>Dedupes hook + interceptor for the same entity/action in one transaction.
 */
@Component
public class AuditableCapture {

    private static final ThreadLocal<List<Pending>> QUEUE = ThreadLocal.withInitial(ArrayList::new);
    private static final ThreadLocal<Set<String>> SEEN = ThreadLocal.withInitial(LinkedHashSet::new);
    private static final ThreadLocal<Boolean> REGISTERED = ThreadLocal.withInitial(() -> Boolean.FALSE);

    /** Resolved on flush so Hibernate interceptor registration cannot cycle with JPA. */

    public void afterCreate(Object entity) {
        afterCreate(entity, AuditableIds.of(entity));
    }

    public void afterCreate(Object entity, Object assignedId) {
        Auditable meta = meta(entity);
        if (meta == null) {
            return;
        }
        String id = assignedId != null ? assignedId.toString() : AuditableIds.of(entity);
        if (id == null || !seen(AuditActions.CREATE, meta.entityType(), id)) {
            return;
        }
        String[] fields = meta.trackedFields();
        enqueue(meta.entityType(), id, AuditActions.CREATE,
                AuditDetails.created(meta.entityType(), entity, fields),
                AuditPayloadBuilder.created(entity, fields));
    }

    public Map<String, Object> beforeUpdate(Object entity) {
        Auditable meta = meta(entity);
        if (meta == null || meta.trackedFields().length == 0) {
            return Map.of();
        }
        return AuditPayloadBuilder.snapshot(entity, meta.trackedFields());
    }

    public void afterUpdate(Object entity, Map<String, Object> beforeSnapshot) {
        afterUpdate(entity, beforeSnapshot, AuditableIds.of(entity));
    }

    public void afterUpdate(Object entity, Map<String, Object> beforeSnapshot, Object assignedId) {
        Auditable meta = meta(entity);
        if (meta == null) {
            return;
        }
        String id = assignedId != null ? assignedId.toString() : AuditableIds.of(entity);
        String[] fields = meta.trackedFields();
        Map<String, Object> payload = AuditPayloadBuilder.changes(beforeSnapshot, entity, fields);
        if (isEmptyChanges(payload)) {
            return;
        }
        String action = isStatusOnlyChange(payload) ? AuditActions.STATUS_CHANGE : AuditActions.UPDATE;
        if (id == null || !seen(action, meta.entityType(), id)) {
            return;
        }
        String details = action.equals(AuditActions.STATUS_CHANGE)
                ? AuditDetails.statusChanged(meta.entityType(), payload)
                : AuditDetails.updated(meta.entityType(), entity, beforeSnapshot, payload);
        enqueue(meta.entityType(), id, action, details, payload);
    }

    public void afterDelete(Object entity) {
        afterDelete(entity, AuditableIds.of(entity));
    }

    public void afterDelete(Object entity, Object assignedId) {
        Auditable meta = meta(entity);
        if (meta == null) {
            return;
        }
        String id = assignedId != null ? assignedId.toString() : AuditableIds.of(entity);
        if (id == null || !seen(AuditActions.DELETE, meta.entityType(), id)) {
            return;
        }
        String[] fields = meta.trackedFields();
        enqueue(meta.entityType(), id, AuditActions.DELETE,
                AuditDetails.deleted(meta.entityType(), entity, fields),
                AuditPayloadBuilder.deleted(entity, fields));
    }

    static Auditable meta(Object entity) {
        if (entity == null) {
            return null;
        }
        Class<?> type = entity.getClass();
        if (type.getName().contains("AuditEvent") || type.getName().contains("IntegrationError")) {
            return null;
        }
        // Proxies / bytecode-enhanced subclasses do not redeclare @Auditable.
        while (type != null && type != Object.class) {
            Auditable found = type.getAnnotation(Auditable.class);
            if (found != null) {
                return found;
            }
            type = type.getSuperclass();
        }
        return null;
    }

    private boolean seen(String action, String entityType, String entityId) {
        return SEEN.get().add(action + ":" + entityType + ":" + entityId);
    }

    private void enqueue(String entityType, String entityId, String action, String details, Map<String, Object> payload) {
        if (!TenantContext.isSet()) {
            return;
        }
        QUEUE.get().add(new Pending(entityType, entityId, action, details, payload));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            if (Boolean.FALSE.equals(REGISTERED.get())) {
                REGISTERED.set(Boolean.TRUE);
                // beforeCompletion — not beforeCommit: Hibernate may flush during another
                // sync's beforeCommit (interceptor path). Spring's beforeCommit walks a
                // snapshot, so a sync registered mid-flush would never run beforeCommit.
                // beforeCompletion still sees us; on rollback the AuditEvent joins the
                // same TX and is discarded with it.
                //
                // Method must not be named flush(): TransactionSynchronization declares
                // default flush(), and an unqualified flush() inside the sync would no-op.
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void beforeCompletion() {
                        flushPending();
                    }

                    @Override
                    public void afterCompletion(int status) {
                        clear();
                    }
                });
            }
        } else {
            flushPending();
            clear();
        }
    }

    private void flushPending() {
        List<Pending> pending = List.copyOf(QUEUE.get());
        QUEUE.get().clear();
        AuditService auditService = auditService();
        if (auditService == null) {
            return;
        }
        for (Pending row : pending) {
            auditService.log(row.entityType(), row.entityId(), row.action(), row.details(), row.payload());
        }
    }

    private static AuditService auditService() {
        ApplicationContext ctx = ApplicationContextProvider.getContext();
        if (ctx == null) {
            return null;
        }
        try {
            return ctx.getBean(AuditService.class);
        } catch (Exception e) {
            return null;
        }
    }

    private static void clear() {
        QUEUE.remove();
        SEEN.remove();
        REGISTERED.remove();
    }

    @SuppressWarnings("unchecked")
    static boolean isEmptyChanges(Map<String, Object> payload) {
        if (payload == null) {
            return true;
        }
        Object changes = payload.get("changes");
        return !(changes instanceof List<?> list) || list.isEmpty();
    }

    /** Lifecycle transitions typically touch only {@code status} among tracked fields. */
    @SuppressWarnings("unchecked")
    static boolean isStatusOnlyChange(Map<String, Object> payload) {
        if (payload == null) {
            return false;
        }
        Object changes = payload.get("changes");
        if (!(changes instanceof List<?> list) || list.size() != 1) {
            return false;
        }
        Object first = list.get(0);
        if (!(first instanceof Map<?, ?> m)) {
            return false;
        }
        Object field = m.get("field");
        return field != null && "status".equals(field.toString());
    }

    private record Pending(
            String entityType,
            String entityId,
            String action,
            String details,
            Map<String, Object> payload) {}
}
