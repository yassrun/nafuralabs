package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import ma.nafura.chantiers.domain.model.ChantierPhase;
import ma.nafura.chantiers.repository.ChantierPhaseRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChantierPhaseSeedService {

    private final ChantierPhaseRepository repository;
    private final ObjectMapper objectMapper;

    public ChantierPhaseSeedService(ChantierPhaseRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        if (repository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/chantier-phases-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("phases")) {
                ChantierPhase entity = ChantierPhase.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .chantierId(node.get("chantierId").asText())
                        .lotId(textOrNull(node, "lotId"))
                        .code(node.get("code").asText())
                        .designation(node.get("designation").asText())
                        .dateDebut(LocalDate.parse(node.get("dateDebut").asText()))
                        .dateFin(LocalDate.parse(node.get("dateFin").asText()))
                        .responsableId(textOrNull(node, "responsableId"))
                        .responsableName(textOrNull(node, "responsableName"))
                        .equipeName(textOrNull(node, "equipeName"))
                        .quantite(
                                node.hasNonNull("quantite")
                                        ? new BigDecimal(node.get("quantite").asText())
                                        : null)
                        .unite(textOrNull(node, "unite"))
                        .avancementPercent(new BigDecimal(node.path("avancementPercent").asText("0")))
                        .status(node.path("status").asText("PLANIFIE"))
                        .ordre(node.path("ordre").asInt(0))
                        .build();
                if (node.has("dependances") && node.get("dependances").isArray()) {
                    entity.setDependancesList(objectMapper.convertValue(
                            node.get("dependances"),
                            objectMapper.getTypeFactory().constructCollectionType(java.util.List.class, String.class)));
                }
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed chantier phases", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
