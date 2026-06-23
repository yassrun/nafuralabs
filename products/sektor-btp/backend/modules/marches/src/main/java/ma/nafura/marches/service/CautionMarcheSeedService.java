package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.marches.domain.model.CautionMarche;
import ma.nafura.marches.repository.CautionMarcheRepository;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CautionMarcheSeedService {

    private final CautionMarcheRepository cautionRepository;
    private final ContratMarcheRepository contratRepository;
    private final ObjectMapper objectMapper;

    public CautionMarcheSeedService(
            CautionMarcheRepository cautionRepository,
            ContratMarcheRepository contratRepository,
            ObjectMapper objectMapper) {
        this.cautionRepository = cautionRepository;
        this.contratRepository = contratRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (cautionRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/cautions-marche-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("cautions")) {
                String contratId = node.get("contratMarcheId").asText();
                if (contratRepository.findByIdAndTenantId(contratId, tenantId).isEmpty()) {
                    continue;
                }
                CautionMarche entity = CautionMarche.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .contratMarcheId(contratId)
                        .marcheNumero(textOrNull(node, "marcheNumero"))
                        .type(node.path("type").asText(CautionMarche.TYPE_PROVISOIRE))
                        .banquePartnerId(textOrNull(node, "banquePartnerId"))
                        .banqueNom(textOrNull(node, "banqueNom"))
                        .montant(new BigDecimal(node.path("montant").asText("0")))
                        .dateEmission(
                                node.hasNonNull("dateEmission")
                                        ? LocalDate.parse(node.get("dateEmission").asText())
                                        : null)
                        .dateExpiration(
                                node.hasNonNull("dateExpiration")
                                        ? LocalDate.parse(node.get("dateExpiration").asText())
                                        : null)
                        .status(node.path("status").asText(CautionMarche.STATUS_ACTIVE))
                        .scanUrl(textOrNull(node, "scanUrl"))
                        .build();
                cautionRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed cautions marche demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
