package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.hse.domain.model.Ppsps;
import ma.nafura.hse.domain.model.PpspsSection;
import ma.nafura.hse.repository.PpspsRepository;
import ma.nafura.hse.repository.PpspsSectionRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PpspsSeedService {

    private final PpspsRepository ppspsRepository;
    private final PpspsSectionRepository sectionRepository;
    private final ObjectMapper objectMapper;

    public PpspsSeedService(
            PpspsRepository ppspsRepository,
            PpspsSectionRepository sectionRepository,
            ObjectMapper objectMapper) {
        this.ppspsRepository = ppspsRepository;
        this.sectionRepository = sectionRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (ppspsRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/ppsps-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            JsonNode template = root.get("sectionsTemplate");
            for (JsonNode node : root.get("ppsps")) {
                String ppspsId = node.get("id").asText();
                Ppsps entity = Ppsps.builder()
                        .id(ppspsId)
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .chantierId(node.get("chantierId").asText())
                        .chantierCode(node.get("chantierCode").asText())
                        .chantierNom(node.get("chantierNom").asText())
                        .coordonnateurSpsNom(node.get("coordonnateurSpsNom").asText())
                        .coordonnateurSpsTel(textOrNull(node, "coordonnateurSpsTel"))
                        .date(LocalDate.parse(node.get("date").asText()))
                        .mesuresCollectives(node.get("mesuresCollectives").asText())
                        .effectifsMaxJour(intOrNull(node, "effectifsMaxJour"))
                        .hommesJourEstimes(intOrNull(node, "hommesJourEstimes"))
                        .observations(textOrNull(node, "observations"))
                        .status(node.path("status").asText(Ppsps.STATUS_BROUILLON))
                        .version(node.path("version").asInt(1))
                        .build();
                ppspsRepository.save(entity);
                seedSections(tenantId, ppspsId, template);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed PPSPS", ex);
        }
    }

    private void seedSections(UUID tenantId, String ppspsId, JsonNode template) {
        if (template == null || !template.isArray()) {
            return;
        }
        int ordre = 0;
        for (JsonNode section : template) {
            String code = section.get("code").asText();
            sectionRepository.save(PpspsSection.builder()
                    .id(ppspsId + "-sec-" + code)
                    .tenantId(tenantId)
                    .ppspsId(ppspsId)
                    .code(code)
                    .titre(section.get("titre").asText())
                    .contenu(textOrNull(section, "contenu"))
                    .ordre(ordre++)
                    .build());
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static Integer intOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asInt() : null;
    }
}
