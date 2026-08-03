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
}
