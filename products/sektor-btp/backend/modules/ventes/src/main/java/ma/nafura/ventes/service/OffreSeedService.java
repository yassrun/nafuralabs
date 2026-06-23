package ma.nafura.ventes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.ventes.domain.model.Offre;
import ma.nafura.ventes.domain.model.OffreLigne;
import ma.nafura.ventes.repository.OffreRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OffreSeedService {

    private final OffreRepository repository;
    private final ObjectMapper objectMapper;

    public OffreSeedService(OffreRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/offres-commerciales-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("offres")) {
                Offre entity = Offre.builder()
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .clientId(node.get("clientId").asText())
                        .clientName(textOrNull(node, "clientName"))
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .dateEmission(LocalDate.parse(node.get("dateEmission").asText()))
                        .dateValidite(LocalDate.parse(node.get("dateValidite").asText()))
                        .objet(node.get("objet").asText())
                        .tvaTaux(new BigDecimal(node.path("tvaTaux").asText("20")))
                        .status(node.path("status").asText(Offre.STATUS_BROUILLON))
                        .motifRefus(textOrNull(node, "motifRefus"))
                        .notes(textOrNull(node, "notes"))
                        .lignes(new ArrayList<>())
                        .build();
                if (node.has("lignes") && node.get("lignes").isArray()) {
                    int ordre = 0;
                    for (JsonNode line : node.get("lignes")) {
                        ordre++;
                        entity.getLignes()
                                .add(OffreLigne.builder()
                                        .tenantId(tenantId)
                                        .offre(entity)
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
                OffreTotalsCalculator.applyTotals(entity);
                repository.save(entity);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to seed offres commerciales", e);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
