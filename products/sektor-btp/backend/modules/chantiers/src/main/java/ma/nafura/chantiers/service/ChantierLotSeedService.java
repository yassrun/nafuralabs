package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChantierLotSeedService {

    private final ChantierLotRepository repository;
    private final ObjectMapper objectMapper;

    public ChantierLotSeedService(ChantierLotRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        if (repository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/chantier-lots-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("lots")) {
                ChantierLot entity = ChantierLot.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .chantierId(node.get("chantierId").asText())
                        .code(node.get("code").asText())
                        .designation(node.get("designation").asText())
                        .unite(textOrNull(node, "unite"))
                        .quantite(
                                node.hasNonNull("quantite")
                                        ? new BigDecimal(node.get("quantite").asText())
                                        : null)
                        .avancementPercent(new BigDecimal(node.path("avancementPercent").asText("0")))
                        .ordre(node.path("ordre").asInt(0))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed chantier lots", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
