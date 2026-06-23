package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import ma.nafura.chantiers.domain.model.PosteBudgetaire;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PosteBudgetaireSeedService {

    private final PosteBudgetaireRepository repository;
    private final ObjectMapper objectMapper;

    public PosteBudgetaireSeedService(PosteBudgetaireRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        if (repository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        ClassPathResource resource = new ClassPathResource("seed/postes-budgetaires-seed.json");
        if (!resource.exists()) {
            return;
        }
        try (InputStream in = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            if (!root.has("postes")) {
                return;
            }
            for (JsonNode node : root.get("postes")) {
                PosteBudgetaire entity = PosteBudgetaire.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .lotId(node.get("lotId").asText())
                        .code(node.get("code").asText())
                        .designation(node.get("designation").asText())
                        .unite(textOrNull(node, "unite"))
                        .quantite(
                                node.hasNonNull("quantite")
                                        ? new BigDecimal(node.get("quantite").asText())
                                        : null)
                        .prixUnitaireHt(
                                node.hasNonNull("prixUnitaireHt")
                                        ? new BigDecimal(node.get("prixUnitaireHt").asText())
                                        : null)
                        .montantHt(
                                node.hasNonNull("montantHt")
                                        ? new BigDecimal(node.get("montantHt").asText())
                                        : null)
                        .ordre(node.path("ordre").asInt(0))
                        .build();
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed postes budgetaires", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
