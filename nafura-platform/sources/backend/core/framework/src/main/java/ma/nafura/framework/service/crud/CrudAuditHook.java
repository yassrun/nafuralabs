package ma.nafura.platform.framework.service.crud;

import java.util.Map;

/**
 * Optional hook for auditing CRUD operations.
 * When a bean implementing this interface is present, {@link JpaCrudService} and
 * {@link ma.nafura.platform.framework.record.RecordController} call it after
 * create/update/delete (and lifecycle transitions). Implementations no-op for
 * entities that are not {@link ma.nafura.platform.framework.audit.Auditable}.
 */
public interface CrudAuditHook {

    /**
     * Called after an entity is created and saved.
     */
    void afterCreate(Object entity);

    /**
     * Called before an entity is updated. Returns a snapshot of tracked fields for diffing.
     * Return an empty map to skip audit or if no snapshot is needed.
     */
    Map<String, Object> beforeUpdate(Object entity);

    /**
     * Called after an entity is updated. {@code beforeSnapshot} is the map returned by
     * {@link #beforeUpdate(Object)} for this entity.
     */
    void afterUpdate(Object entity, Map<String, Object> beforeSnapshot);

    /**
     * Called after an entity is deleted (before transaction commit).
     */
    void afterDelete(Object entity);
}
