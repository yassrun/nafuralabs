package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.marches.domain.model.DgdMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.DgdMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DgdMarcheSeedService {

    private final DgdMarcheRepository dgdRepository;
    private final ContratMarcheRepository contratRepository;
    private final DgdCalculatorService calculator;
    private final ObjectMapper objectMapper;

    public DgdMarcheSeedService(
            DgdMarcheRepository dgdRepository,
            ContratMarcheRepository contratRepository,
            DgdCalculatorService calculator,
            ObjectMapper objectMapper) {
        this.dgdRepository = dgdRepository;
        this.contratRepository = contratRepository;
        this.calculator = calculator;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (dgdRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/dgd-marche-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("dgds")) {
                String contratId = node.get("contratMarcheId").asText();
                if (contratRepository.findByIdAndTenantId(contratId, tenantId).isEmpty()) {
                    continue;
                }
                DgdMarche entity = DgdMarche.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .contratMarcheId(contratId)
                        .marcheNumero(textOrNull(node, "marcheNumero"))
                        .cumulSituationsTtc(decimal(node, "cumulSituationsTtc"))
                        .cumulRetenueGarantie(decimal(node, "cumulRetenueGarantie"))
                        .cumulRevisionK(decimal(node, "cumulRevisionK"))
                        .cumulPenalites(decimal(node, "cumulPenalites"))
                        .reprisesRg(decimal(node, "reprisesRg"))
                        .status(node.path("status").asText(DgdMarche.STATUS_BROUILLON))
                        .build();
                refreshNet(entity);
                dgdRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed dgd marche demo data", ex);
        }
    }

    private void refreshNet(DgdMarche entity) {
        entity.setMontantNetAPayer(calculator.computeMontantNetAPayer(
                entity.getCumulSituationsTtc(),
                entity.getCumulRetenueGarantie(),
                entity.getCumulRevisionK(),
                entity.getCumulPenalites(),
                entity.getReprisesRg()));
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static BigDecimal decimal(JsonNode node, String field) {
        return new BigDecimal(node.path(field).asText("0"));
    }
}
