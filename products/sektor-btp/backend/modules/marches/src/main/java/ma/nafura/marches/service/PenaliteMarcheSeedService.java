package ma.nafura.marches.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.marches.domain.model.PenaliteMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.PenaliteMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PenaliteMarcheSeedService {

    private final PenaliteMarcheRepository penaliteRepository;
    private final ContratMarcheRepository contratRepository;
    private final ObjectMapper objectMapper;

    public PenaliteMarcheSeedService(
            PenaliteMarcheRepository penaliteRepository,
            ContratMarcheRepository contratRepository,
            ObjectMapper objectMapper) {
        this.penaliteRepository = penaliteRepository;
        this.contratRepository = contratRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (penaliteRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/penalites-marche-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("penalites")) {
                String contratId = node.get("contratMarcheId").asText();
                if (contratRepository.findByIdAndTenantId(contratId, tenantId).isEmpty()) {
                    continue;
                }
                PenaliteMarche entity = PenaliteMarche.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .contratMarcheId(contratId)
                        .marcheNumero(textOrNull(node, "marcheNumero"))
                        .type(node.path("type").asText(PenaliteMarche.TYPE_RETARD))
                        .motif(textOrNull(node, "motif"))
                        .montantHt(new BigDecimal(node.path("montantHt").asText("0")))
                        .joursRetard(node.hasNonNull("joursRetard") ? node.get("joursRetard").asInt() : null)
                        .dateConstat(
                                node.hasNonNull("dateConstat")
                                        ? LocalDate.parse(node.get("dateConstat").asText())
                                        : null)
                        .status(node.path("status").asText(PenaliteMarche.STATUS_BROUILLON))
                        .build();
                penaliteRepository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed penalites marche demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
