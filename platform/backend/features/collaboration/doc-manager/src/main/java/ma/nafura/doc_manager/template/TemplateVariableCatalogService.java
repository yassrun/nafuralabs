package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableCatalogResponse;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds the variable catalog for the template editor (available placeholders per entity type).
 */
@Service
public class TemplateVariableCatalogService {

    private final List<TemplateVariableCatalogContributor> contributors;
    private final TemplateVariableResolver variableResolver;

    public TemplateVariableCatalogService(
            List<TemplateVariableCatalogContributor> contributors,
            TemplateVariableResolver variableResolver) {
        this.contributors = contributors != null ? contributors : List.of();
        this.variableResolver = variableResolver;
    }

    public TemplateVariableCatalogResponse getCatalog(String entityType) {
        List<TemplateVariableDescriptor> entity = new ArrayList<>(resolveEntityVariables(entityType));
        entity.addAll(documentVariables());
        return TemplateVariableCatalogResponse.builder()
                .entity(entity)
                // tenant.* comes from the identity providers that actually fill it, so the
                // sidebar can never advertise a variable that resolves to nothing.
                .tenant(variableResolver.describeTenantVariables())
                .system(systemVariables())
                .build();
    }

    /**
     * Printable types declared by product modules. No fallback: an empty registry means no
     * module declared one, and the UI must say so rather than offer types that resolve to
     * nothing.
     */
    public List<PrintEntityTypeDescriptor> listEntityTypeDescriptors() {
        Map<String, PrintEntityTypeDescriptor> byCode = new LinkedHashMap<>();
        for (TemplateVariableCatalogContributor c : contributors) {
            for (PrintEntityTypeDescriptor descriptor : c.entityTypeDescriptors()) {
                byCode.putIfAbsent(descriptor.code(), descriptor);
            }
        }
        return List.copyOf(byCode.values());
    }

    /** Codes only, for callers that do not need labels. */
    public List<String> listEntityTypes() {
        return listEntityTypeDescriptors().stream().map(PrintEntityTypeDescriptor::code).toList();
    }

    private List<TemplateVariableDescriptor> resolveEntityVariables(String entityType) {
        if (entityType == null || entityType.isBlank()) {
            return List.of();
        }
        for (TemplateVariableCatalogContributor c : contributors) {
            if (!c.supportedEntityTypes().contains(entityType)) {
                continue;
            }
            List<TemplateVariableDescriptor> vars = c.entityVariables(entityType);
            if (vars != null && !vars.isEmpty()) {
                return vars;
            }
        }
        return List.of();
    }

    /**
     * The normalised {@code document.*} contract, identical for every type — this is what
     * shared header, footer and line-table fragments are written against.
     */
    private static List<TemplateVariableDescriptor> documentVariables() {
        return List.of(
                desc("document.libelleType", "Type de document", "string", "Facture"),
                desc("document.numero", "Numéro", "string", "FAC-2026-001"),
                desc("document.date", "Date", "date", null),
                desc("document.dateEcheance", "Échéance", "date", null),
                desc("document.reference", "Référence", "string", null),
                desc("document.objet", "Objet", "string", null),
                desc("document.client.raisonSociale", "Client — raison sociale", "string", null),
                desc("document.client.ice", "Client — ICE", "string", null),
                desc("document.client.adresse", "Client — adresse", "string", null),
                desc("document.client.ville", "Client — ville", "string", null),
                desc("document.lignes", "Lignes (liste)", "list", null),
                desc("document.totaux.ht", "Total HT", "number", null),
                desc("document.totaux.tva", "Total TVA", "number", null),
                desc("document.totaux.ttc", "Total TTC", "number", null),
                desc("document.totaux.tauxTva", "Taux TVA", "number", "20"),
                desc("document.totaux.enLettres", "Total en lettres", "string", null),
                desc("document.mentions", "Mentions", "string", null));
    }

    private static List<TemplateVariableDescriptor> systemVariables() {
        return List.of(
                desc("today", "Date du jour", "date", null),
                desc("now", "Date et heure", "datetime", null),
                desc("currentUser", "Utilisateur courant", "string", null));
    }

    public static TemplateVariableDescriptor desc(String path, String label, String type, String example) {
        return TemplateVariableDescriptor.builder()
                .path(path)
                .label(label)
                .type(type)
                .example(example)
                .build();
    }
}
