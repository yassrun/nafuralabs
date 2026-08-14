package ma.nafura.finance.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.finance.domain.model.TradeEffect;
import ma.nafura.finance.repository.TradeEffectRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TradeEffectSeedService {

    private final TradeEffectRepository repository;
    private final ObjectMapper objectMapper;

    public TradeEffectSeedService(TradeEffectRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/trade-effects-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("effects")) {
                repository.save(TradeEffect.builder()
                        .tenantId(tenantId)
                        .effectNumber(node.get("effectNumber").asText())
                        .effectType(node.get("effectType").asText())
                        .invoiceId(node.get("invoiceId").asText())
                        .clientId(node.get("clientId").asText())
                        .clientName(textOrNull(node, "clientName"))
                        .domicileBank(node.get("domicileBank").asText())
                        .amount(new BigDecimal(node.get("amount").asText()))
                        .dueDate(LocalDate.parse(node.get("dueDate").asText()))
                        .status(node.path("status").asText(TradeEffect.STATUS_PORTEFEUILLE))
                        .build());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed trade effects", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
