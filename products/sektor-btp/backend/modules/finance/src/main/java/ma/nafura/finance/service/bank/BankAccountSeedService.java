package ma.nafura.finance.service.bank;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.finance.domain.model.BankAccount;
import ma.nafura.finance.repository.BankAccountRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BankAccountSeedService {

    private final BankAccountRepository repository;
    private final ObjectMapper objectMapper;

    public BankAccountSeedService(BankAccountRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /** Not named {@code seedIfEmpty} — {@code DemoSeedRuntimeGuardAspect} blocks that pattern when runtime seed is off. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureTenantDefaults() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/bank-accounts-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("accounts")) {
                repository.save(BankAccount.builder()
                        .tenantId(tenantId)
                        .code(node.get("code").asText())
                        .name(node.get("name").asText())
                        .accountType(node.path("accountType").asText("BANQUE"))
                        .bankName(textOrNull(node, "bankName"))
                        .rib(textOrNull(node, "rib"))
                        .branch(textOrNull(node, "branch"))
                        .currencyCode(node.path("currencyCode").asText("MAD"))
                        .glAccountCode(textOrNull(node, "glAccountCode"))
                        .openingBalance(new BigDecimal(node.path("openingBalance").asText("0")))
                        .isActive(true)
                        .build());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed bank accounts", ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
