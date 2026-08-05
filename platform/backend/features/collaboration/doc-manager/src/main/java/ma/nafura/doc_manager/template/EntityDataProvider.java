package ma.nafura.platform.collaboration.docmanager.template;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Provider for entity data used in template rendering.
 *
 * <p>Product modules register one bean per functional area (études, ventes, achats…). Several
 * providers coexist: {@link TemplateVariableResolver} picks the first one whose
 * {@link #supports(String)} returns {@code true} for the requested entity type. If no provider
 * supports the type, entity variables are empty.
 */
public interface EntityDataProvider {

    /**
     * Whether this provider knows the given entity type. Must be side-effect free and cheap:
     * it is called on every render for every registered provider.
     *
     * @param entityType entity type identifier (e.g. "devis", "facture_client")
     */
    boolean supports(String entityType);

    /**
     * Fetch entity data as a map suitable for Thymeleaf (e.g. entity.code, entity.customer.name).
     *
     * @param entityType entity type identifier
     * @param entityId   entity id
     * @return map of flattened or nested properties; empty if not found
     */
    Map<String, Object> getEntityData(String entityType, UUID entityId);

    /**
     * Sample entity map for admin PDF preview. Empty = fall back to platform defaults.
     */
    default Map<String, Object> getSampleEntityData(String entityType) {
        return Map.of();
    }

    /**
     * Normalised projection exposed as {@code ${document.*}}. Implement it for every type you
     * support: it is what lets a shared header, footer or line table work across document types.
     * Empty = the type has no normalised view yet and shared fragments will render blank.
     */
    default Optional<PrintDocument> getDocument(String entityType, UUID entityId) {
        return Optional.empty();
    }

    /** Sample counterpart of {@link #getDocument}, used by the editor preview. */
    default Optional<PrintDocument> getSampleDocument(String entityType) {
        return Optional.empty();
    }

    /**
     * Records offered in the "preview with a real record" picker. Must be tenant-scoped and
     * respect the caller's read permissions.
     *
     * @param query free-text filter; blank means "most recent"
     * @param limit maximum number of results
     */
    default List<SampleRecord> searchRecords(String entityType, String query, int limit) {
        return List.of();
    }
}
