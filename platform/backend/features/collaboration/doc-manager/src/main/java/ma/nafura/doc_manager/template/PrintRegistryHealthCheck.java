package ma.nafura.platform.collaboration.docmanager.template;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * A printable type needs both a catalog contributor (what the editor offers) and a data provider
 * (what actually renders). Declaring only one half produces a template that looks fine in the
 * editor and comes out blank — the failure is silent, so it is reported at startup instead.
 */
@Component
public class PrintRegistryHealthCheck {

    private static final Logger log = LoggerFactory.getLogger(PrintRegistryHealthCheck.class);

    private final TemplateVariableCatalogService catalogService;
    private final List<EntityDataProvider> entityDataProviders;

    public PrintRegistryHealthCheck(
            TemplateVariableCatalogService catalogService,
            List<EntityDataProvider> entityDataProviders) {
        this.catalogService = catalogService;
        this.entityDataProviders = entityDataProviders != null ? entityDataProviders : List.of();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void report() {
        List<PrintEntityTypeDescriptor> declared = catalogService.listEntityTypeDescriptors();
        if (declared.isEmpty()) {
            log.warn("No printable document type declared: no module registered a "
                    + "TemplateVariableCatalogContributor. The template editor will be empty.");
            return;
        }

        List<String> withoutProvider = declared.stream()
                .map(PrintEntityTypeDescriptor::code)
                .filter(code -> entityDataProviders.stream().noneMatch(p -> p.supports(code)))
                .toList();

        if (!withoutProvider.isEmpty()) {
            log.warn("Printable types declared in the catalog but served by no EntityDataProvider: "
                    + "{}. Templates for these types will render with empty data.", withoutProvider);
        }

        log.info("Printable document types registered: {}",
                declared.stream().map(PrintEntityTypeDescriptor::code).toList());
    }
}
