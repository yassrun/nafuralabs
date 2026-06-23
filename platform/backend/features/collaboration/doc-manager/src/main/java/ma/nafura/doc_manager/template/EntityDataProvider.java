package ma.nafura.platform.collaboration.docmanager.template;

import java.util.Map;
import java.util.UUID;

/**
 * Optional provider for entity data used in template rendering.
 * Applications may register a bean to supply entity data by type and id;
 * if none is registered, entity variables will be empty.
 */
public interface EntityDataProvider {

    /**
     * Fetch entity data as a map suitable for Thymeleaf (e.g. entity.code, entity.customer.name).
     *
     * @param entityType entity type identifier (e.g. "invoice", "quote")
     * @param entityId   entity id
     * @return map of flattened or nested properties; empty if not found or not supported
     */
    Map<String, Object> getEntityData(String entityType, UUID entityId);
}
