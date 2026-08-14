package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import ma.nafura.marches.domain.model.Avenant;
import ma.nafura.marches.repository.AvenantRepository;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AvenantSeedService {

    private final AvenantRepository avenantRepository;
    private final ContratMarcheRepository contratRepository;
    private final ObjectMapper objectMapper;

    public AvenantSeedService(
            AvenantRepository avenantRepository,
            ContratMarcheRepository contratRepository,
            ObjectMapper objectMapper) {
        this.avenantRepository = avenantRepository;
        this.contratRepository = contratRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (avenantRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/avenants-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("avenants")) {
                String contratId = node.get("contratMarcheId").asText();
                if (contratRepository.findByIdAndTenantId(contratId, tenantId).isEmpty()) {
                    continue;
                }
                Avenant entity = Avenant.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .contratMarcheId(contratId)
                        .marcheNumero(node.get("marcheNumero").asText())
                        .type(node.path("type").asText(Avenant.TYPE_TVX_SUPPLEMENTAIRES))
                        .objet(node.get("objet").asText())
                        .motif(textOrNull(node, "motif"))
                        .montantHt(new BigDecimal(node.path("montantHt").asText("0")))
                        .prolongationJours(node.path("prolongationJours").asInt(0))
                        .dateSignature(
                                node.hasNonNull("dateSignature")
                                        ? LocalDate.parse(node.get("dateSignature").asText())
                                        : null)
                        .status(node.path("status").asText(Avenant.STATUS_BROUILLON))
                        .impactPropageLe(
                                node.hasNonNull("impactPropageLe")
                                        ? OffsetDateTime.parse(node.get("impactPropageLe").asText())
                                        : null)
                        .build();
                avenantRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed avenants demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
