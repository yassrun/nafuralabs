package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.marches.domain.model.OrdreServiceMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.OrdreServiceMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrdreServiceMarcheSeedService {

    private final OrdreServiceMarcheRepository ordreRepository;
    private final ContratMarcheRepository contratRepository;
    private final ObjectMapper objectMapper;

    public OrdreServiceMarcheSeedService(
            OrdreServiceMarcheRepository ordreRepository,
            ContratMarcheRepository contratRepository,
            ObjectMapper objectMapper) {
        this.ordreRepository = ordreRepository;
        this.contratRepository = contratRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (ordreRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/ordres-service-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("ordresService")) {
                String contratId = node.get("contratMarcheId").asText();
                if (contratRepository.findByIdAndTenantId(contratId, tenantId).isEmpty()) {
                    continue;
                }
                OrdreServiceMarche entity = OrdreServiceMarche.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .contratMarcheId(contratId)
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .type(node.path("type").asText(OrdreServiceMarche.TYPE_COMMENCEMENT))
                        .dateEmission(
                                node.hasNonNull("dateEmission")
                                        ? LocalDate.parse(node.get("dateEmission").asText())
                                        : null)
                        .emetteur(textOrNull(node, "emetteur"))
                        .objet(textOrNull(node, "objet"))
                        .description(textOrNull(node, "description"))
                        .impactDelai(node.hasNonNull("impactDelai") ? node.get("impactDelai").asInt() : null)
                        .impactCout(
                                node.has("impactCout")
                                        ? new BigDecimal(node.path("impactCout").asText("0"))
                                        : null)
                        .status(node.path("status").asText(OrdreServiceMarche.STATUS_BROUILLON))
                        .dateAccuseReception(
                                node.hasNonNull("dateAccuseReception")
                                        ? LocalDate.parse(node.get("dateAccuseReception").asText())
                                        : null)
                        .build();
                ordreRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed ordres service demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
