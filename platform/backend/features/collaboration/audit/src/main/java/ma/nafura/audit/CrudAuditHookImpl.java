package ma.nafura.platform.collaboration.audit;

import ma.nafura.platform.framework.service.crud.CrudAuditHook;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

/**
 * Implements {@link CrudAuditHook} for entities annotated with {@link Auditable}.
 * Builds payloads via {@link AuditPayloadBuilder} and human-readable details.
 */
@Component
public class CrudAuditHookImpl implements CrudAuditHook {

    private final AuditService auditService;

    public CrudAuditHookImpl(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    public void afterCreate(Object entity) {
        if (entity == null) return;
        Auditable a = entity.getClass().getAnnotation(Auditable.class);
        if (a == null) return;
        UUID entityId = getEntityId(entity);
        if (entityId == null) return;
        String[] fields = a.trackedFields().length > 0 ? a.trackedFields() : new String[0];
        Map<String, Object> payload = AuditPayloadBuilder.created(entity, fields);
        String details = formatDetails("Created", a.entityType(), entity, fields);
        auditService.log(a.entityType(), entityId, "create", details, payload);
    }

    @Override
    public Map<String, Object> beforeUpdate(Object entity) {
        if (entity == null) return Collections.emptyMap();
        Auditable a = entity.getClass().getAnnotation(Auditable.class);
        if (a == null || a.trackedFields().length == 0) return Collections.emptyMap();
        return AuditPayloadBuilder.snapshot(entity, a.trackedFields());
    }

    @Override
    public void afterUpdate(Object entity, Map<String, Object> beforeSnapshot) {
        if (entity == null || beforeSnapshot == null) return;
        Auditable a = entity.getClass().getAnnotation(Auditable.class);
        if (a == null) return;
        UUID entityId = getEntityId(entity);
        if (entityId == null) return;
        String[] fields = a.trackedFields().length > 0 ? a.trackedFields() : new String[0];
        Map<String, Object> payload = AuditPayloadBuilder.changes(beforeSnapshot, entity, fields);
        String details = formatUpdateDetails(a.entityType(), entity, beforeSnapshot, payload);
        auditService.log(a.entityType(), entityId, "update", details, payload);
    }

    @Override
    public void afterDelete(Object entity) {
        if (entity == null) return;
        Auditable a = entity.getClass().getAnnotation(Auditable.class);
        if (a == null) return;
        UUID entityId = getEntityId(entity);
        if (entityId == null) return;
        String[] fields = a.trackedFields().length > 0 ? a.trackedFields() : new String[0];
        Map<String, Object> payload = AuditPayloadBuilder.deleted(entity, fields);
        String details = formatDetails("Deleted", a.entityType(), entity, fields);
        auditService.log(a.entityType(), entityId, "delete", details, payload);
    }

    private static UUID getEntityId(Object entity) {
        Object id = AuditPayloadBuilder.getValue(entity, "id");
        if (id instanceof UUID uuid) return uuid;
        if (id != null) return UUID.fromString(id.toString());
        return null;
    }

    private static String formatDetails(String action, String entityType, Object entity, String[] fields) {
        String identifier = firstTrackedValue(entity, fields);
        if (identifier == null) identifier = "—";
        return String.format("%s %s %s", action, entityType, identifier);
    }

    @SuppressWarnings("unchecked")
    private static String formatUpdateDetails(String entityType, Object entity,
            Map<String, Object> beforeSnapshot, Map<String, Object> payload) {
        Object changesObj = payload != null ? payload.get("changes") : null;
        if (changesObj instanceof java.util.List<?> changes && !changes.isEmpty()) {
            Object first = changes.get(0);
            if (first instanceof Map<?, ?> m) {
                Object field = m.get("field");
                Object from = m.get("from");
                Object to = m.get("to");
                if (field != null && (from != null || to != null)) {
                    return String.format("Updated %s %s from %s to %s",
                        entityType, field, from, to);
                }
            }
        }
        String identifier = firstTrackedValue(entity, beforeSnapshot.keySet().toArray(new String[0]));
        return String.format("Updated %s %s", entityType, identifier != null ? identifier : "—");
    }

    private static String firstTrackedValue(Object entity, String[] fields) {
        if (fields == null || fields.length == 0) return null;
        for (String field : fields) {
            Object v = AuditPayloadBuilder.getValue(entity, field);
            if (v != null && !v.toString().isBlank()) return v.toString();
        }
        return null;
    }
}
