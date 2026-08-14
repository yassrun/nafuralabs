package ma.nafura.achats.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.achats.domain.model.DemandeAchat;
import ma.nafura.achats.domain.model.DemandeAchatLigne;
import ma.nafura.achats.repository.DemandeAchatRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemandeAchatSeedService {

    private final DemandeAchatRepository repository;
    private final ObjectMapper objectMapper;

    public DemandeAchatSeedService(DemandeAchatRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/demandes-achat-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("demandes")) {
                DemandeAchat entity = DemandeAchat.builder()
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .chantierName(textOrNull(node, "chantierName"))
                        .dateBesoin(LocalDate.parse(node.get("dateBesoin").asText()))
                        .demandeurId(node.get("demandeurId").asText())
                        .demandeurName(textOrNull(node, "demandeurName"))
                        .motif(textOrNull(node, "motif"))
                        .status(node.path("status").asText(DemandeAchat.STATUS_BROUILLON))
                        .approbateurId(textOrNull(node, "approbateurId"))
                        .approbateurName(textOrNull(node, "approbateurName"))
                        .approbationDate(
                                node.hasNonNull("approbationDate")
                                        ? LocalDate.parse(node.get("approbationDate").asText())
                                        : null)
                        .motifRejet(textOrNull(node, "motifRejet"))
                        .bcId(textOrNull(node, "bcId"))
                        .bcNumero(textOrNull(node, "bcNumero"))
                        .totalEstimeHt(new BigDecimal(node.path("totalEstimeHt").asText("0")))
                        .notes(textOrNull(node, "notes"))
                        .lignes(new ArrayList<>())
                        .build();
                if (node.has("lignes") && node.get("lignes").isArray()) {
                    for (JsonNode line : node.get("lignes")) {
                        BigDecimal qty = new BigDecimal(line.get("quantite").asText());
                        BigDecimal unit = line.hasNonNull("prixEstimeHt")
                                ? new BigDecimal(line.get("prixEstimeHt").asText())
                                : null;
                        BigDecimal total = line.hasNonNull("totalEstimeHt")
                                ? new BigDecimal(line.get("totalEstimeHt").asText())
                                : (unit != null ? unit.multiply(qty) : BigDecimal.ZERO);
                        entity.getLignes()
                                .add(DemandeAchatLigne.builder()
                                        .tenantId(tenantId)
                                        .demande(entity)
                                        .articleId(line.get("articleId").asText())
                                        .articleCode(textOrNull(line, "articleCode"))
                                        .articleName(textOrNull(line, "articleName"))
                                        .quantite(qty)
                                        .uomCode(textOrNull(line, "uomCode"))
                                        .prixEstimeHt(unit)
                                        .totalEstimeHt(total)
                                        .notes(textOrNull(line, "notes"))
                                        .build());
                    }
                }
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed demandes achat", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
