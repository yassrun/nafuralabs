package ma.nafura.erp.onboarding.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.ApplyPresetRequest;
import ma.nafura.erp.onboarding.api.dto.OnboardingDtos.ApplyPresetResponse;
import ma.nafura.erp.onboarding.domain.TenantOnboardingMeta;
import ma.nafura.erp.onboarding.repository.TenantOnboardingMetaRepository;
import ma.nafura.finance.repository.ChartOfAccountRepository;
import ma.nafura.finance.service.ChartOfAccountService;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.platform.administration.iam.service.IamService;
import ma.nafura.platform.appsettings.domain.model.TenantSetting;
import ma.nafura.platform.appsettings.repository.TenantSettingRepository;
import ma.nafura.platform.configuration.sysconfig.domain.model.NumberingSequence;
import ma.nafura.platform.configuration.sysconfig.repository.NumberingSequenceRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.tenancy.domain.model.Tenant;
import ma.nafura.platform.tenancy.repository.TenantRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantPresetOrchestratorService {

    private static final Set<String> BASE_DOMAINS = Set.of(
        "finance", "chantiers", "achats", "ventes", "rh", "hse", "marches", "partner", "item", "stock"
    );

    private final TenantRepository tenantRepository;
    private final TenantOnboardingMetaRepository metaRepository;
    private final TenantSettingRepository tenantSettingRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final ChartOfAccountService chartOfAccountService;
    private final NumberingSequenceRepository numberingSequenceRepository;
    private final ItemRepository itemRepository;
    private final IamService iamService;
    private final TenantReferenceDataSeedService referenceDataSeedService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ApplyPresetResponse applyPreset(UUID tenantId, ApplyPresetRequest request) {
        long started = System.currentTimeMillis();
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("Tenant not found"));

        TenantOnboardingMeta meta = metaRepository.findById(tenantId).orElse(null);
        if (meta != null && meta.getPresetAppliedAt() != null && !request.forceReset()) {
            log.info("Onboarding preset already applied for tenant={}, idempotent success", tenantId);
            return new ApplyPresetResponse(
                tenantId.toString(),
                true,
                List.of("already-applied"),
                0L
            );
        }

        boolean skipChart = chartOfAccountRepository.countByTenantId(tenantId) > 0;
        boolean skipArticles = itemRepository.countByTenantId(tenantId) > 0;
        if ((skipChart || skipArticles) && !request.forceReset()) {
            log.warn(
                "Tenant {} has partial preset data (chart={}, articles={}); resuming onboarding preset",
                tenantId,
                skipChart,
                skipArticles
            );
        }

        List<String> steps = new ArrayList<>();
        UUID previousTenant = TenantContext.getTenantIdOrNull();
        try {
            TenantContext.setTenantId(tenantId);

            updateTenantIdentity(tenant, request);
            steps.add("identity");

            activateDomains(tenantId, request);
            steps.add("domains");

            applyFiscalAndUiSettings(tenantId, request);
            steps.add("fiscal");

            referenceDataSeedService.seedReferenceData(tenantId);
            steps.add("referenceData");

            if (request.forceReset() || !skipChart) {
                chartOfAccountService.resetToSeed();
                steps.add("chartOfAccounts");
            } else {
                steps.add("chartOfAccounts-skipped");
            }

            seedNumberingSequences(tenantId);
            steps.add("numbering");

            if (!skipArticles) {
                seedArticles(tenantId, request.secteur());
                steps.add("articles");
            } else {
                steps.add("articles-skipped");
            }

            try {
                persistMeta(tenantId, request);
            } catch (Exception ex) {
                throw new IllegalStateException("Failed to persist onboarding meta", ex);
            }
            steps.add("meta");
        } finally {
            if (previousTenant != null) {
                TenantContext.setTenantId(previousTenant);
            } else {
                TenantContext.clear();
            }
        }

        long duration = System.currentTimeMillis() - started;
        log.info("Applied onboarding preset tenant={} steps={} durationMs={}", tenantId, steps, duration);
        return new ApplyPresetResponse(tenantId.toString(), true, steps, duration);
    }

    private void updateTenantIdentity(Tenant tenant, ApplyPresetRequest request) {
        tenant.setName(request.societe().nom());
        tenant.setOwnerEmail(tenant.getOwnerEmail());
        tenantRepository.save(tenant);
        upsertSetting(tenant.getId(), "onboarding.societe.ice", request.societe().ice());
        upsertSetting(tenant.getId(), "onboarding.societe.forme", request.societe().forme() != null ? request.societe().forme() : "SARL");
        upsertSetting(tenant.getId(), "onboarding.societe.nom", request.societe().nom());
    }

    private void activateDomains(UUID tenantId, ApplyPresetRequest request) {
        for (String code : BASE_DOMAINS) {
            boolean enabled = true;
            if ("marches".equals(code) && "PRIVE".equalsIgnoreCase(request.marches())) {
                enabled = false;
            }
            iamService.updateDomain(tenantId, code, enabled);
        }
        if ("PUBLIC".equalsIgnoreCase(request.marches()) || "MIXTE".equalsIgnoreCase(request.marches())) {
            iamService.updateDomain(tenantId, "marches", true);
        }
    }

    private void applyFiscalAndUiSettings(UUID tenantId, ApplyPresetRequest request) {
        upsertSetting(tenantId, "onboarding.fiscal.tvaRate", "20");
        if ("PUBLIC".equalsIgnoreCase(request.marches()) || "MIXTE".equalsIgnoreCase(request.marches())) {
            upsertSetting(tenantId, "onboarding.fiscal.retenueSource", "7");
        }
        if ("S".equalsIgnoreCase(request.taille())) {
            upsertSetting(tenantId, "onboarding.ui.hideAnalyticalAccounting", "true");
        }
        if ("EXTERNE".equalsIgnoreCase(request.compta()) || "AUCUNE".equalsIgnoreCase(request.compta())) {
            upsertSetting(tenantId, "onboarding.ui.hideTechnicalAccounting", "true");
        }
        upsertSetting(tenantId, "onboarding.profile.secteur", request.secteur());
        upsertSetting(tenantId, "onboarding.profile.taille", request.taille());
        upsertSetting(tenantId, "onboarding.profile.marches", request.marches());
        upsertSetting(tenantId, "onboarding.profile.compta", request.compta());
    }

    private void seedNumberingSequences(UUID tenantId) {
        int year = Year.now().getValue();
        String yearStr = String.valueOf(year);
        createSequenceIfAbsent(tenantId, "FC", "Factures client", "FC", yearStr);
        createSequenceIfAbsent(tenantId, "BC", "Bons de commande", "BC", yearStr);
        createSequenceIfAbsent(tenantId, "CH", "Chantiers", "CH", yearStr);
        createSequenceIfAbsent(tenantId, "DEV", "Devis", "DEV", yearStr);
        createSequenceIfAbsent(tenantId, "AV", "Avoirs", "AV", yearStr);
        createSequenceIfAbsent(tenantId, "SIT", "Situations", "SIT", yearStr);
    }

    private void createSequenceIfAbsent(UUID tenantId, String code, String name, String prefix, String year) {
        if (numberingSequenceRepository.findByTenantId(tenantId).stream()
            .anyMatch(s -> code.equalsIgnoreCase(s.getCode()))) {
            return;
        }
        numberingSequenceRepository.save(NumberingSequence.builder()
            .tenantId(tenantId)
            .code(code)
            .name(name)
            .prefix(prefix)
            .separator("-")
            .yearFormat("YYYY")
            .padLength(3)
            .incrementBy(1)
            .currentNumber(0L)
            .resetPolicy("YEARLY")
            .build());
    }

    private void seedArticles(UUID tenantId, String secteur) {
        if (itemRepository.countByTenantId(tenantId) > 0) {
            return;
        }
        String resource = switch (normalizeSecteur(secteur)) {
            case "TP" -> "onboarding/articles-tp.json";
            case "VRD" -> "onboarding/articles-vrd.json";
            default -> "onboarding/articles-batiment.json";
        };
        try (InputStream in = new ClassPathResource(resource).getInputStream()) {
            List<JsonNode> nodes = objectMapper.readValue(in, new TypeReference<>() {});
            for (JsonNode node : nodes) {
                itemRepository.save(Item.builder()
                    .tenantId(tenantId)
                    .code(node.get("code").asText())
                    .name(node.get("name").asText())
                    .description(node.has("description") ? node.get("description").asText() : null)
                    .isActive(true)
                    .build());
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed articles from " + resource, ex);
        }
    }

    private void persistMeta(UUID tenantId, ApplyPresetRequest request) throws Exception {
        String json = objectMapper.writeValueAsString(request);
        String hash = sha256(json);
        TenantOnboardingMeta meta = metaRepository.findById(tenantId).orElseGet(() ->
            TenantOnboardingMeta.builder().tenantId(tenantId).build()
        );
        meta.setPresetAppliedAt(OffsetDateTime.now());
        meta.setPresetPayloadHash(hash);
        meta.setPresetProfileJson(json);
        metaRepository.save(meta);
    }

    private void upsertSetting(UUID tenantId, String key, String value) {
        tenantSettingRepository.findByTenantIdAndSettingKey(tenantId, key)
            .ifPresentOrElse(existing -> {
                existing.setValue(value);
                tenantSettingRepository.save(existing);
            }, () -> tenantSettingRepository.save(TenantSetting.builder()
                .tenantId(tenantId)
                .settingKey(key)
                .value(value)
                .build()));
    }

    private static String normalizeSecteur(String secteur) {
        if (secteur == null) {
            return "BATIMENT";
        }
        return secteur.trim().toUpperCase(Locale.ROOT);
    }

    private static String sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
