package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import ma.nafura.hse.domain.model.RegistreLegal;
import ma.nafura.hse.repository.RegistreLegalRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistreLegalSeedService {

    private static final java.util.Set<String> CORE_FIELDS = java.util.Set.of(
            "id",
            "registre",
            "numero",
            "date",
            "reference",
            "chantierId",
            "chantierCode",
            "employeId",
            "employeNom",
            "description",
            "statut",
            "derniereMaj");

    private final RegistreLegalRepository repository;
    private final ObjectMapper objectMapper;

    public RegistreLegalSeedService(RegistreLegalRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/registres-legaux-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("registresLegaux")) {
                RegistreLegal entity = RegistreLegal.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .registre(node.get("registre").asText())
                        .numero(node.get("numero").asText())
                        .date(LocalDate.parse(node.get("date").asText()))
                        .reference(textOrNull(node, "reference"))
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .employeId(textOrNull(node, "employeId"))
                        .employeNom(textOrNull(node, "employeNom"))
                        .description(node.get("description").asText())
                        .statut(node.path("statut").asText(RegistreLegal.STATUT_OUVERT))
                        .derniereMaj(
                                node.hasNonNull("derniereMaj")
                                        ? LocalDate.parse(node.get("derniereMaj").asText())
                                        : LocalDate.parse(node.get("date").asText()))
                        .extensionJson(buildExtensionJson(node))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed registres légaux", ex);
        }
    }

    private String buildExtensionJson(JsonNode node) throws Exception {
        ObjectNode extra = objectMapper.createObjectNode();
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> entry = fields.next();
            if (!CORE_FIELDS.contains(entry.getKey())) {
                extra.set(entry.getKey(), entry.getValue());
            }
        }
        if (extra.isEmpty()) {
            return null;
        }
        return objectMapper.writeValueAsString(extra);
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
