package ma.nafura.chantiers.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import ma.nafura.chantiers.domain.model.BudgetChantier;
import ma.nafura.chantiers.domain.model.BudgetLigne;
import ma.nafura.chantiers.repository.BudgetChantierRepository;
import ma.nafura.chantiers.repository.BudgetLigneRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BudgetChantierSeedService {

    private final BudgetChantierRepository budgetRepository;
    private final BudgetLigneRepository ligneRepository;
    private final ObjectMapper objectMapper;

    public BudgetChantierSeedService(
            BudgetChantierRepository budgetRepository,
            BudgetLigneRepository ligneRepository,
            ObjectMapper objectMapper) {
        this.budgetRepository = budgetRepository;
        this.ligneRepository = ligneRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        if (budgetRepository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/budget-chantier-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode budgetNode : root.get("budgets")) {
                String chantierId = budgetNode.get("chantierId").asText();
                String budgetId = chantierId + "-budget";
                BudgetChantier budget = BudgetChantier.builder()
                        .id(budgetId)
                        .tenantId(TenantContext.getTenantId())
                        .chantierId(chantierId)
                        .previsionnelHt(new BigDecimal(budgetNode.path("previsionnelHt").asText("0")))
                        .reviseHt(new BigDecimal(budgetNode.path("reviseHt").asText("0")))
                        .build();
                budgetRepository.save(budget);

                int ordre = 1;
                for (JsonNode ligneNode : budgetNode.get("lignes")) {
                    String rubrique = ligneNode.get("rubrique").asText();
                    BudgetLigne ligne = BudgetLigne.builder()
                            .id(budgetId + "-ligne-" + rubrique.toLowerCase().replace('_', '-'))
                            .tenantId(TenantContext.getTenantId())
                            .budgetChantierId(budgetId)
                            .rubrique(rubrique)
                            .label(ligneNode.get("label").asText())
                            .lot(textOrNull(ligneNode, "lot"))
                            .previsionnelHt(new BigDecimal(ligneNode.path("previsionnelHt").asText("0")))
                            .reviseHt(new BigDecimal(ligneNode.path("reviseHt").asText("0")))
                            .engageHt(new BigDecimal(ligneNode.path("engageHt").asText("0")))
                            .realiseHt(new BigDecimal(ligneNode.path("realiseHt").asText("0")))
                            .ordre(ordre++)
                            .build();
                    ligneRepository.save(ligne);
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed budget chantier demo data", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
}
