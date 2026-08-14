package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;

import java.util.List;
import java.util.Set;

/**
 * Product modules may register contributors to expose entity-type-specific
 * template variables (and entity type keys for the admin catalog).
 */
public interface TemplateVariableCatalogContributor {

    /** Entity types this contributor documents (e.g. {@code devis}). */
    Set<String> supportedEntityTypes();

    /** Entity.* placeholders for the given type; empty if unsupported. */
    List<TemplateVariableDescriptor> entityVariables(String entityType);

    /**
     * Display metadata for the declared types. Override to give the admin UI a translatable
     * label; the default derives a conventional key so existing contributors keep working.
     */
    default List<PrintEntityTypeDescriptor> entityTypeDescriptors() {
        return supportedEntityTypes().stream()
                .map(code -> PrintEntityTypeDescriptor.of(
                        code, "administration.templates.entityTypes." + code, moduleName()))
                .toList();
    }

    /** Owning module, used only in startup diagnostics. */
    default String moduleName() {
        return getClass().getSimpleName();
    }
}
