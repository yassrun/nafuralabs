package ma.nafura.etudes.print;

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

/**
 * Seeds system A4 HTML templates for devis / bordereau / synthèse (per tenant).
 */
@Component
public class EtudesDocumentTemplateBootstrap implements DocumentTemplateBootstrap {

    private static final Logger log = LoggerFactory.getLogger(EtudesDocumentTemplateBootstrap.class);

    private final DocumentTemplateRepository repository;

    public EtudesDocumentTemplateBootstrap(DocumentTemplateRepository repository) {
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
                EtudesPrintEntityTypes.CODE_DEVIS_A4,
                "Devis client A4",
                EtudesPrintEntityTypes.DEVIS,
                "print-templates/devis-a4.html");
        seed(
                tenantId,
                EtudesPrintEntityTypes.CODE_BORDEREAU_A4,
                "Bordereau étude A4",
                EtudesPrintEntityTypes.DOSSIER_BORDEREAU,
                "print-templates/dossier-bordereau-a4.html");
        seed(
                tenantId,
                EtudesPrintEntityTypes.CODE_SYNTHESE_A4,
                "Synthèse étude A4",
                EtudesPrintEntityTypes.DOSSIER_SYNTHESE,
                "print-templates/dossier-synthese-a4.html");
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
            // The name is refreshed too: templates seeded before the UTF-8 compile fix carry a
            // mangled name in the database ("Bordereau Ã©tude A4") that no body update would heal.
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
