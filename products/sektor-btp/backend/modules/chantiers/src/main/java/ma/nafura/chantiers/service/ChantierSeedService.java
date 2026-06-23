package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChantierSeedService {

    private final ChantierRepository repository;
    private final ObjectMapper objectMapper;

    public ChantierSeedService(ChantierRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        if (repository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/chantiers-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("chantiers")) {
                Chantier entity = Chantier.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .code(node.get("code").asText())
                        .label(node.get("label").asText())
                        .chantierType(node.path("chantierType").asText("BATIMENT"))
                        .clientId(textOrNull(node, "clientId"))
                        .clientName(textOrNull(node, "clientName"))
                        .ville(textOrNull(node, "ville"))
                        .dateDemarrage(
                                node.hasNonNull("dateDemarrage")
                                        ? LocalDate.parse(node.get("dateDemarrage").asText())
                                        : null)
                        .dateFinPrevue(
                                node.hasNonNull("dateFinPrevue")
                                        ? LocalDate.parse(node.get("dateFinPrevue").asText())
                                        : null)
                        .montantHt(new BigDecimal(node.path("montantHt").asText("0")))
                        .tauxTva(new BigDecimal(node.path("tauxTva").asText("20")))
                        .tauxRg(
                                node.hasNonNull("tauxRg")
                                        ? new BigDecimal(node.get("tauxRg").asText())
                                        : null)
                        .avancementPercent(new BigDecimal(node.path("avancementPercent").asText("0")))
                        .status(node.path("status").asText(Chantier.STATUS_EN_COURS))
                        .chefChantierName(textOrNull(node, "chefChantierName"))
                        .conducteurTravauxName(textOrNull(node, "conducteurTravauxName"))
                        .active(true)
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed chantiers", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
