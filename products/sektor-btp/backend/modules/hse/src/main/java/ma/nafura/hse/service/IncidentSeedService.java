package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.hse.domain.model.Incident;
import ma.nafura.hse.repository.IncidentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IncidentSeedService {

    private final IncidentRepository repository;
    private final ObjectMapper objectMapper;

    public IncidentSeedService(IncidentRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/incidents-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("incidents")) {
                Incident entity = Incident.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .employeId(textOrNull(node, "employeId"))
                        .victimeNom(textOrNull(node, "victimeNom"))
                        .dateIncident(LocalDate.parse(node.get("dateIncident").asText()))
                        .heureIncident(parseTime(node, "heureIncident"))
                        .lieu(node.get("lieu").asText())
                        .typeIncident(node.get("typeIncident").asText())
                        .gravite(node.get("gravite").asText())
                        .description(node.get("description").asText())
                        .causes(textOrNull(node, "causes"))
                        .actionsImmediates(textOrNull(node, "actionsImmediates"))
                        .planAction(textOrNull(node, "planAction"))
                        .joursArret(node.hasNonNull("joursArret") ? node.get("joursArret").asInt() : null)
                        .status(node.path("status").asText(Incident.STATUS_OUVERT))
                        .cnssDatDeclare(node.path("cnssDatDeclare").asBoolean(false))
                        .cnssDatXmlUrl(textOrNull(node, "cnssDatXmlUrl"))
                        .cnssReferenceDeclaration(textOrNull(node, "cnssReferenceDeclaration"))
                        .cnssDateDeclaration(
                                node.hasNonNull("cnssDateDeclaration")
                                        ? LocalDate.parse(node.get("cnssDateDeclaration").asText())
                                        : null)
                        .notes(textOrNull(node, "notes"))
                        .photosUrls(readStringList(node, "photosUrls"))
                        .temoins(readStringList(node, "temoins"))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed incidents", ex);
        }
    }

    private static LocalTime parseTime(JsonNode node, String field) {
        if (!node.hasNonNull(field)) {
            return null;
        }
        String raw = node.get(field).asText();
        if (raw.length() == 5) {
            return LocalTime.parse(raw + ":00");
        }
        return LocalTime.parse(raw);
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
