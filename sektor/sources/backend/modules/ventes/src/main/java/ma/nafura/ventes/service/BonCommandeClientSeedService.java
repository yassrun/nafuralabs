package ma.nafura.ventes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.ventes.domain.model.BonCommandeClient;
import ma.nafura.ventes.domain.model.BonCommandeClientLigne;
import ma.nafura.ventes.repository.BonCommandeClientRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BonCommandeClientSeedService {

    private final BonCommandeClientRepository repository;
    private final ObjectMapper objectMapper;

    public BonCommandeClientSeedService(BonCommandeClientRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/bons-commande-client-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("bonsCommandeClient")) {
                BonCommandeClient entity = BonCommandeClient.builder()
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .numeroClient(node.get("numeroClient").asText())
                        .clientId(node.get("clientId").asText())
                        .clientName(textOrNull(node, "clientName"))
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .dateReception(LocalDate.parse(node.get("dateReception").asText()))
                        .dateFinPrevue(node.hasNonNull("dateFinPrevue")
                                ? LocalDate.parse(node.get("dateFinPrevue").asText())
                                : null)
                        .tvaTaux(new BigDecimal(node.path("tvaTaux").asText("20")))
                        .montantFactureHt(new BigDecimal(node.path("montantFactureHt").asText("0")))
                        .status(node.path("status").asText(BonCommandeClient.STATUS_RECU))
                        .notes(textOrNull(node, "notes"))
                        .lignes(new ArrayList<>())
                        .build();
                if (node.has("lignes") && node.get("lignes").isArray()) {
                    int ordre = 0;
                    for (JsonNode line : node.get("lignes")) {
                        ordre++;
                        entity.getLignes()
                                .add(BonCommandeClientLigne.builder()
                                        .tenantId(tenantId)
                                        .bcc(entity)
                                        .ordre(ordre)
                                        .designation(line.get("designation").asText())
                                        .unite(textOrNull(line, "unite"))
                                        .quantite(line.hasNonNull("quantite")
                                                ? new BigDecimal(line.get("quantite").asText())
                                                : null)
                                        .prixUnitaireHt(line.hasNonNull("prixUnitaireHt")
                                                ? new BigDecimal(line.get("prixUnitaireHt").asText())
                                                : null)
                                        .totalHt(new BigDecimal(line.get("totalHt").asText()))
                                        .build());
                    }
                }
                BccTotalsCalculator.applyTotals(entity);
                repository.save(entity);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to seed bons commande client", e);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
