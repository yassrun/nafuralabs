package ma.nafura.ventes.print;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentTemplateRepository;
import ma.nafura.platform.collaboration.docmanager.template.DocumentTemplateBootstrap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Seeds the system A4 template for client invoices (per tenant). */
@Component
public class VentesDocumentTemplateBootstrap implements DocumentTemplateBootstrap {

    private static final Logger log = LoggerFactory.getLogger(VentesDocumentTemplateBootstrap.class);

    private final DocumentTemplateRepository repository;

    public VentesDocumentTemplateBootstrap(DocumentTemplateRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void ensureDefaults(UUID tenantId) {
        if (tenantId == null) {
            return;
        }
        seed(
                tenantId,
                VentesPrintEntityTypes.CODE_FACTURE_A4,
                "Facture client A4",
                VentesPrintEntityTypes.FACTURE_CLIENT,
                "print-templates/facture-client-a4.html");
    }

    private void seed(UUID tenantId, String code, String name, String entityType, String resource) {
        String body = loadResource(resource);
        var existing = repository.findByTenantIdAndCode(tenantId, code);
        if (existing.isPresent()) {
            DocumentTemplate t = existing.get();
            if (!Boolean.TRUE.equals(t.getIsSystem())) {
                return;
            }
            boolean bodyChanged = body != null && !body.equals(t.getTemplateBody());
            boolean nameChanged = !name.equals(t.getName());
            if (bodyChanged || nameChanged) {
                if (bodyChanged) {
                    t.setTemplateBody(body);
                }
                t.setName(name);
                repository.save(t);
                log.info("Refreshed system print template {} for tenant {}", code, tenantId);
            }
            return;
        }
        DocumentTemplate t = DocumentTemplate.builder()
                .tenantId(tenantId)
                .code(code)
                .name(name)
                .entityType(entityType)
                .format("pdf")
                .templateBody(body)
                .isSystem(true)
                .isDefault(true)
                .isActive(true)
                .paperSize("A4")
                .orientation("portrait")
                .marginsCss("15mm 12mm 15mm 12mm")
                .build();
        repository.save(t);
        log.info("Seeded system print template {} for tenant {}", code, tenantId);
    }

    private static String loadResource(String path) {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Missing print template resource: " + path, e);
        }
    }
}
