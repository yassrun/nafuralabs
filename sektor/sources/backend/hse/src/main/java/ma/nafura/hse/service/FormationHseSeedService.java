package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.hse.domain.model.FormationHse;
import ma.nafura.hse.repository.FormationHseRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FormationHseSeedService {

    private final FormationHseRepository repository;
    private final ObjectMapper objectMapper;

    public FormationHseSeedService(FormationHseRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/formations-hse-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("formations")) {
                FormationHse entity = FormationHse.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .titre(node.get("titre").asText())
                        .dateDebut(LocalDate.parse(node.get("dateDebut").asText()))
                        .dateFin(
                                node.hasNonNull("dateFin")
                                        ? LocalDate.parse(node.get("dateFin").asText())
                                        : null)
                        .dureeHeures(node.get("dureeHeures").asInt())
                        .formateur(textOrNull(node, "formateur"))
                        .lieu(textOrNull(node, "lieu"))
                        .nbParticipants(node.path("nbParticipants").asInt(0))
                        .habilitationCode(textOrNull(node, "habilitationCode"))
                        .attestationReference(textOrNull(node, "attestationReference"))
                        .attestationValidite(
                                node.hasNonNull("attestationValidite")
                                        ? LocalDate.parse(node.get("attestationValidite").asText())
                                        : null)
                        .status(node.path("status").asText(FormationHse.STATUS_PLANIFIEE))
                        .notes(textOrNull(node, "notes"))
                        .participants(readStringList(node, "participants"))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed formations HSE", ex);
        }
    }

    private static ArrayList<String> readStringList(JsonNode node, String field) {
        ArrayList<String> values = new ArrayList<>();
        if (node.has(field) && node.get(field).isArray()) {
            for (JsonNode item : node.get(field)) {
                values.add(item.asText());
            }
        }
        return values;
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
