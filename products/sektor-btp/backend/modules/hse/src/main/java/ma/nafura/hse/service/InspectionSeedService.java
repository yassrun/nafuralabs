package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.hse.domain.model.Inspection;
import ma.nafura.hse.repository.InspectionRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InspectionSeedService {

    private final InspectionRepository repository;
    private final ObjectMapper objectMapper;

    public InspectionSeedService(InspectionRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/inspections-audits-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("inspections")) {
                Inspection entity = Inspection.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .dateInspection(LocalDate.parse(node.get("dateInspection").asText()))
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .inspecteurNom(node.get("inspecteurNom").asText())
                        .organismeType(textOrNull(node, "organismeType"))
                        .referenceRapport(textOrNull(node, "referenceRapport"))
                        .thematique(node.get("thematique").asText())
                        .nbObservations(node.path("nbObservations").asInt(0))
                        .nbNonConformites(node.path("nbNonConformites").asInt(0))
                        .noteGlobale(
                                node.hasNonNull("noteGlobale")
                                        ? new BigDecimal(node.get("noteGlobale").asText())
                                        : null)
                        .status(node.path("status").asText(Inspection.STATUS_PLANIFIEE))
                        .observations(textOrNull(node, "observations"))
                        .notes(textOrNull(node, "notes"))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed inspections", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
