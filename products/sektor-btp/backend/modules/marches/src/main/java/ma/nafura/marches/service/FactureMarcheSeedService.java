package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.marches.domain.model.FactureMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.FactureMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FactureMarcheSeedService {

    private final FactureMarcheRepository factureRepository;
    private final ContratMarcheRepository contratRepository;
    private final ObjectMapper objectMapper;

    public FactureMarcheSeedService(
            FactureMarcheRepository factureRepository,
            ContratMarcheRepository contratRepository,
            ObjectMapper objectMapper) {
        this.factureRepository = factureRepository;
        this.contratRepository = contratRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (factureRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/factures-marche-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("factures")) {
                String contratId = node.get("contratMarcheId").asText();
                if (contratRepository.findByIdAndTenantId(contratId, tenantId).isEmpty()) {
                    continue;
                }
                FactureMarche entity = FactureMarche.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .contratMarcheId(contratId)
                        .marcheNumero(textOrNull(node, "marcheNumero"))
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .clientNom(textOrNull(node, "clientNom"))
                        .montantBrutHt(decimal(node, "montantBrutHt"))
                        .avanceDeduiteHt(decimal(node, "avanceDeduiteHt"))
                        .retenueGarantieHt(decimal(node, "retenueGarantieHt"))
                        .netHt(decimal(node, "netHt"))
                        .tvaTaux(decimal(node, "tvaTaux", "20"))
                        .tvaMontant(decimal(node, "tvaMontant"))
                        .netTtc(decimal(node, "netTtc"))
                        .retenueSourceTaux(decimal(node, "retenueSourceTaux"))
                        .retenueSourceMontant(decimal(node, "retenueSourceMontant"))
                        .timbreFiscal(decimal(node, "timbreFiscal"))
                        .netAPayer(decimal(node, "netAPayer"))
                        .dateEmission(
                                node.hasNonNull("dateEmission")
                                        ? LocalDate.parse(node.get("dateEmission").asText())
                                        : null)
                        .dateEcheance(
                                node.hasNonNull("dateEcheance")
                                        ? LocalDate.parse(node.get("dateEcheance").asText())
                                        : null)
                        .status(node.path("status").asText(FactureMarche.STATUS_BROUILLON))
                        .build();
                factureRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed factures marche demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static BigDecimal decimal(JsonNode node, String field) {
        return decimal(node, field, "0");
    }

    private static BigDecimal decimal(JsonNode node, String field, String fallback) {
        return new BigDecimal(node.path(field).asText(fallback));
    }
}
