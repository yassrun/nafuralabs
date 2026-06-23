package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableCatalogResponse;
import ma.nafura.platform.collaboration.docmanager.api.response.TemplateVariableDescriptor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Builds the variable catalog for the template editor (available placeholders per entity type).
 */
@Service
public class TemplateVariableCatalogService {

    public TemplateVariableCatalogResponse getCatalog(String entityType) {
        List<TemplateVariableDescriptor> entity = List.of(
                desc("entity.code", "Code", "string", "INV-001"),
                desc("entity.id", "Id", "string", null),
                desc("entity.amount", "Amount", "number", "1500.00"),
                desc("entity.date", "Date", "date", null),
                desc("entity.customer.name", "Customer Name", "string", "Acme Corp"),
                desc("entity.customer.address", "Customer Address", "string", null)
        );
        List<TemplateVariableDescriptor> tenant = List.of(
                desc("tenant.name", "Organization Name", "string", null),
                desc("tenant.key", "Tenant Key", "string", null),
                desc("tenant.logo", "Logo URL", "image", null),
                desc("tenant.address", "Address", "string", null)
        );
        List<TemplateVariableDescriptor> system = List.of(
                desc("today", "Today's Date", "date", null),
                desc("now", "Current Date/Time", "datetime", null),
                desc("currentUser", "Current User", "string", null)
        );
        return TemplateVariableCatalogResponse.builder()
                .entity(entity)
                .tenant(tenant)
                .system(system)
                .build();
    }

    private static TemplateVariableDescriptor desc(String path, String label, String type, String example) {
        return TemplateVariableDescriptor.builder()
                .path(path)
                .label(label)
                .type(type)
                .example(example)
                .build();
    }
}
