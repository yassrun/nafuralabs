package ma.nafura.platform.collaboration.docmanager.template;

import java.util.UUID;

/**
 * Optional product hook to seed system document templates for the current tenant.
 * Called before listing templates so print dialogs see defaults.
 */
public interface DocumentTemplateBootstrap {

    void ensureDefaults(UUID tenantId);
}
