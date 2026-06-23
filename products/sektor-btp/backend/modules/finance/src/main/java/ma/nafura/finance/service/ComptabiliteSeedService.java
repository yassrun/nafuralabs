package ma.nafura.finance.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.UUID;
import ma.nafura.finance.domain.model.AccountingJournal;
import ma.nafura.finance.domain.model.ChartOfAccount;
import ma.nafura.finance.repository.AccountingJournalRepository;
import ma.nafura.finance.repository.ChartOfAccountRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ComptabiliteSeedService {

    private final ChartOfAccountRepository chartOfAccountRepository;
    private final AccountingJournalRepository accountingJournalRepository;
    private final ObjectMapper objectMapper;

    public ComptabiliteSeedService(
            ChartOfAccountRepository chartOfAccountRepository,
            AccountingJournalRepository accountingJournalRepository,
            ObjectMapper objectMapper) {
        this.chartOfAccountRepository = chartOfAccountRepository;
        this.accountingJournalRepository = accountingJournalRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = tenantId();
        boolean needsAccounts = chartOfAccountRepository.countByTenantId(tenantId) == 0;
        boolean needsJournals = accountingJournalRepository.countByTenantId(tenantId) == 0;
        if (!needsAccounts && !needsJournals) {
            return;
        }
        seedFromClasspath(needsJournals, needsAccounts);
    }

    /**
     * Loads CGNC accounts and standard journals from classpath seed data.
     * Not subject to {@code DemoSeedRuntimeGuardAspect} — used by onboarding preset and reset API.
     */
    @Transactional
    public void seedFromClasspath() {
        seedFromClasspath(true, true);
    }

    private void seedFromClasspath(boolean seedJournals, boolean seedAccounts) {
        UUID tenantId = tenantId();
        try (InputStream in = new ClassPathResource("seed/comptabilite-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            if (seedJournals) {
                for (JsonNode journalNode : root.get("journals")) {
                    String code = journalNode.get("code").asText();
                    if (accountingJournalRepository.existsByTenantIdAndCode(tenantId, code)) {
                        continue;
                    }
                    accountingJournalRepository.save(AccountingJournal.builder()
                            .tenantId(tenantId)
                            .code(code)
                            .name(journalNode.get("name").asText())
                            .journalType(journalNode.get("journalType").asText())
                            .defaultCounterpartCode(textOrNull(journalNode, "defaultCounterpartCode"))
                            .isActive(true)
                            .build());
                }
            }
            if (seedAccounts) {
                for (JsonNode accountNode : root.get("accounts")) {
                    String code = accountNode.get("code").asText();
                    if (chartOfAccountRepository.existsByTenantIdAndCode(tenantId, code)) {
                        continue;
                    }
                    chartOfAccountRepository.save(ChartOfAccount.builder()
                            .tenantId(tenantId)
                            .code(code)
                            .name(textOrDefault(accountNode, "name", code))
                            .accountClass(accountNode.get("accountClass").asInt())
                            .accountType(accountNode.get("accountType").asText())
                            .parentAccountCode(textOrNull(accountNode, "parentAccountCode"))
                            .isCollectif(boolOrDefault(accountNode, "isCollectif", false))
                            .isLettrable(boolOrDefault(accountNode, "isLettrable", false))
                            .isAuxiliaire(boolOrDefault(accountNode, "isAuxiliaire", false))
                            .axeAnalytiqueObligatoire(boolOrDefault(accountNode, "axeAnalytiqueObligatoire", false))
                            .isActive(true)
                            .build());
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed chart of accounts: " + ex.getMessage(), ex);
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }

    private static String textOrDefault(JsonNode node, String field, String defaultValue) {
        return node.hasNonNull(field) ? node.get(field).asText() : defaultValue;
    }

    private static boolean boolOrDefault(JsonNode node, String field, boolean defaultValue) {
        return node.has(field) ? node.get(field).asBoolean() : defaultValue;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
