package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Supplies the {@code tenant.*} variables of a printed document: the issuing company's
 * identity (legal name, registration numbers, address, logo…).
 *
 * <p>The platform ships a minimal implementation built from the {@code Tenant} record. Products
 * that hold a richer legal identity (in Morocco: ICE, IF, RC, patente, CNSS) register their own
 * higher-priority bean — the platform must never read a product entity directly.
 *
 * <p>{@link #describe()} keeps the editor's variable catalog in sync with what
 * {@link #identity(UUID)} actually returns: one source of truth, so the sidebar cannot advertise
 * a variable that resolves to nothing.
 */
public interface TenantIdentityProvider {

    /** Lower runs first; the first provider returning a non-empty map wins. */
    default int order() {
        return 0;
    }

    /**
     * Identity values keyed by the name used after {@code tenant.} in templates
     * (e.g. {@code "ice"} is read as {@code ${tenant.ice}}). Empty = no identity available,
     * fall through to the next provider.
     */
    Map<String, Object> identity(UUID tenantId);

    /** Catalog entries for the keys {@link #identity(UUID)} can return, in display order. */
    List<TemplateVariableDescriptor> describe();
}
