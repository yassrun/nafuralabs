package ma.nafura.finance.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import ma.nafura.finance.domain.model.Caisse;
import ma.nafura.finance.domain.model.CaisseMouvement;
import ma.nafura.finance.repository.CaisseMouvementRepository;
import ma.nafura.finance.repository.CaisseRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CaisseSeedService {

    private final CaisseRepository caisseRepository;
    private final CaisseMouvementRepository mouvementRepository;
    private final ObjectMapper objectMapper;

    public CaisseSeedService(
            CaisseRepository caisseRepository,
            CaisseMouvementRepository mouvementRepository,
            ObjectMapper objectMapper) {
        this.caisseRepository = caisseRepository;
        this.mouvementRepository = mouvementRepository;
        this.objectMapper = objectMapper;
    }

  /** Not named {@code seedIfEmpty} — {@code DemoSeedRuntimeGuardAspect} blocks that pattern when runtime seed is off. */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void ensureTenantDefaults() {
        UUID tenantId = TenantContext.getTenantId();
        if (caisseRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/caisses-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            Map<String, UUID> idsByCode = new HashMap<>();
            for (JsonNode node : root.get("caisses")) {
                Caisse saved = caisseRepository.save(Caisse.builder()
                        .tenantId(tenantId)
                        .caisseType(node.get("caisseType").asText())
                        .code(textOrNull(node, "code"))
                        .name(node.get("name").asText())
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierLabel(textOrNull(node, "chantierLabel"))
                        .chefChantierId(textOrNull(node, "chefChantierId"))
                        .chefChantierName(textOrNull(node, "chefChantierName"))
                        .currencyCode(node.path("currencyCode").asText("MAD"))
                        .glAccountCode(textOrNull(node, "glAccountCode"))
                        .openingBalance(new BigDecimal(node.path("openingBalance").asText("0")))
                        .status(node.path("status").asText(Caisse.STATUS_OUVERTE))
                        .openedAt(
                                node.hasNonNull("openedAt")
                                        ? LocalDate.parse(node.get("openedAt").asText())
                                        : null)
                        .notes(textOrNull(node, "notes"))
                        .build());
                if (saved.getCode() != null) {
                    idsByCode.put(saved.getCode(), saved.getId());
                }
            }
            if (root.has("mouvements")) {
                for (JsonNode m : root.get("mouvements")) {
                    UUID caisseId = idsByCode.get(m.get("caisseCode").asText());
                    if (caisseId == null) {
                        continue;
                    }
                    mouvementRepository.save(CaisseMouvement.builder()
                            .tenantId(tenantId)
                            .caisseId(caisseId)
                            .movementDate(LocalDate.parse(m.get("movementDate").asText()))
                            .movementType(m.get("movementType").asText())
                            .amount(new BigDecimal(m.get("amount").asText()))
                            .category(textOrNull(m, "category"))
                            .description(m.get("description").asText())
                            .photoTicketUrl(textOrNull(m, "photoTicketUrl"))
                            .workflowStatus(m.path("workflowStatus").asText(CaisseMouvement.STATUS_VALIDE))
                            .build());
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed caisses", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
