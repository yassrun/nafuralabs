package ma.nafura.hse.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.hse.domain.model.EpiDotation;
import ma.nafura.hse.repository.EpiDotationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EpiDotationSeedService {

    private final EpiDotationRepository repository;
    private final ObjectMapper objectMapper;

    public EpiDotationSeedService(EpiDotationRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/epi-dotations-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("epiDotations")) {
                EpiDotation entity = EpiDotation.builder()
                        .id(node.get("id").asText())
                        .tenantId(tenantId)
                        .reference(node.get("reference").asText())
                        .designation(node.get("designation").asText())
                        .categorie(node.get("categorie").asText())
                        .marque(node.get("marque").asText())
                        .normeCe(textOrNull(node, "normeCe"))
                        .employeId(node.get("employeId").asText())
                        .employeNom(node.get("employeNom").asText())
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .dateAttribution(LocalDate.parse(node.get("dateAttribution").asText()))
                        .dateExpiration(
                                node.hasNonNull("dateExpiration")
                                        ? LocalDate.parse(node.get("dateExpiration").asText())
                                        : null)
                        .prixUnitaire(new BigDecimal(node.path("prixUnitaire").asText("0")))
                        .status(node.path("status").asText(EpiDotation.STATUS_OK))
                        .articleId(textOrNull(node, "articleId"))
                        .dateDerniereVerification(
                                node.hasNonNull("dateDerniereVerification")
                                        ? LocalDate.parse(node.get("dateDerniereVerification").asText())
                                        : null)
                        .prochaineVerification(
                                node.hasNonNull("prochaineVerification")
                                        ? LocalDate.parse(node.get("prochaineVerification").asText())
                                        : null)
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed EPI dotations", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
