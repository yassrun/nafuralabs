package ma.nafura.platform.ai.agent.admin;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.llm.catalog.AiProviderCatalog;
import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.NormalizedLlmRequest;
import ma.nafura.platform.ai.llm.model.ScopeType;
import ma.nafura.platform.ai.llm.provider.AiProvider;
import ma.nafura.platform.ai.llm.provider.AiProviderRegistry;
import ma.nafura.platform.ai.llm.provider.AiRuntimePreferencePort;
import ma.nafura.platform.ai.llm.provider.RoutingAiProvider;
import ma.nafura.platform.ai.llm.provider.gemini.GeminiProvider;
import ma.nafura.platform.ai.llm.provider.openai.OpenAiCompatibleProvider;
import ma.nafura.platform.ai.llm.service.AiCredentialCipher;
import ma.nafura.platform.ai.llm.service.AiCredentialService;
import ma.nafura.platform.ai.llm.service.TenantAiPolicyService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Enterprise AI provider administration: runtime selection, BYOK credentials, limits & privacy,
 * connection test. Read = {@code administration.ai.read}, write = {@code administration.ai.configure}.
 */
@RestController
@RequestMapping("/api/v1/platform/admin/ai-providers")
@RequiredArgsConstructor
public class AiProvidersAdminController {

    private final AiProviderRegistry registry;
    private final AiRuntimePreferencePort preferences;
    private final AiProvider aiProvider;
    private final AiCredentialService credentialService;
    private final AiCredentialCipher cipher;
    private final TenantAiPolicyService policyService;
    private final AiProvidersAudit audit;

    @GetMapping
    @RequirePermission(value = "administration.ai.read", fullPermission = true)
    public AiProvidersStateResponse getState() {
        UUID tenantId = TenantContext.getTenantId();
        String tenant = tenantId != null ? tenantId.toString() : null;

        String activeProvider = resolveActiveProvider(tenant);
        String activeModel = resolveActiveModel(tenant, activeProvider);

        List<AiProviderCard> cards = new ArrayList<>();
        for (AiProvider p : registry.all()) {
            String name = p.getProviderName();
            boolean platformKey = isPlatformKeyConfigured(p);
            boolean byok = tenantId != null && credentialService.hasCredential(tenantId, name);
            String hint = byok ? credentialService.keyHint(tenantId, name).orElse(null) : null;
            List<String> models = AiProviderCatalog.models(name);
            if (models.isEmpty() && !AiProviderCatalog.isDeploymentBased(name)) {
                models = List.of(defaultModelOf(p));
            }
            cards.add(new AiProviderCard(
                name,
                AiProviderCatalog.displayName(name),
                platformKey || byok,
                byok,
                hint,
                models,
                name.equalsIgnoreCase(activeProvider)));
        }

        TenantAiPolicyService.AiRuntimePolicy policy = policyService.policyFor(tenant);
        AiLimits limits = new AiLimits(
            policy.enabled(),
            policy.monthlyBudgetUsd() == null ? null : policy.monthlyBudgetUsd().toPlainString(),
            policy.retainPayloads(),
            cipher.configured());

        return new AiProvidersStateResponse(activeProvider, activeModel, cards, limits);
    }

    @PutMapping
    @RequirePermission(value = "administration.ai.configure", fullPermission = true)
    public ResponseEntity<AiProvidersStateResponse> update(@RequestBody UpdateAiProviderRequest request) {
        UUID tenantId = requireTenant();
        String provider = AiProviderCatalog.normalize(request.provider());
        if (!registry.has(provider)) {
            throw badRequest("Unknown provider: " + provider);
        }

        String model = request.model() == null ? "" : request.model().trim();
        if (!isModelAllowed(provider, model)) {
            throw badRequest("Unsupported model: " + model);
        }

        boolean platformKey = isPlatformKeyConfigured(registry.require(provider));
        boolean byok = credentialService.hasCredential(tenantId, provider);
        if (!platformKey && !byok) {
            throw new ResponseStatusException(HttpStatus.PRECONDITION_FAILED, "API key missing for provider: " + provider);
        }

        String previousModel = resolveActiveModel(tenantId.toString(), provider);
        preferences.save(tenantId.toString(), provider, model);
        audit.providerChanged(provider, previousModel, model);
        return ResponseEntity.ok(getState());
    }

    @PutMapping("/credentials/{provider}")
    @RequirePermission(value = "administration.ai.configure", fullPermission = true)
    public ResponseEntity<CredentialResponse> putCredential(
        @PathVariable String provider,
        @RequestBody CredentialRequest request
    ) {
        UUID tenantId = requireTenant();
        String p = AiProviderCatalog.normalize(provider);
        if (!registry.has(p)) {
            throw badRequest("Unknown provider: " + p);
        }
        if (!cipher.configured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI credentials master key is not configured");
        }
        if (request.secret() == null || request.secret().isBlank()) {
            throw badRequest("Secret is required");
        }

        credentialService.save(tenantId, p, request.secret(), UserContext.getUserEmail());
        String hint = credentialService.keyHint(tenantId, p).orElse("");
        audit.credentialRotated(p, hint);
        return ResponseEntity.ok(new CredentialResponse(true, hint));
    }

    @DeleteMapping("/credentials/{provider}")
    @RequirePermission(value = "administration.ai.configure", fullPermission = true)
    public ResponseEntity<CredentialResponse> revokeCredential(@PathVariable String provider) {
        UUID tenantId = requireTenant();
        String p = AiProviderCatalog.normalize(provider);
        if (!registry.has(p)) {
            throw badRequest("Unknown provider: " + p);
        }
        credentialService.revoke(tenantId, p);
        audit.credentialRevoked(p);
        return ResponseEntity.ok(new CredentialResponse(false, null));
    }

    @PostMapping("/test")
    @RequirePermission(value = "administration.ai.configure", fullPermission = true)
    public ResponseEntity<TestResponse> test(@RequestBody TestRequest request) {
        UUID tenantId = requireTenant();
        String provider = AiProviderCatalog.normalize(request.provider());
        if (provider.isBlank()) {
            provider = resolveActiveProvider(tenantId.toString());
        }
        if (!registry.has(provider)) {
            throw badRequest("Unknown provider: " + provider);
        }

        TenantAiPolicyService.AiRuntimePolicy policy = policyService.policyFor(tenantId.toString());
        if (!policy.enabled()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "AI is disabled for this organisation");
        }

        Optional<String> byok = credentialService.apiKeyForTenant(tenantId.toString(), provider);
        boolean platformKey = isPlatformKeyConfigured(registry.require(provider));
        if (byok.isEmpty() && !platformKey) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No API key configured for provider: " + provider);
        }

        String model = (request.model() == null || request.model().isBlank())
            ? defaultModelOf(registry.require(provider))
            : request.model().trim();

        NormalizedLlmRequest probe = new NormalizedLlmRequest();
        probe.setPrompt("ping");
        probe.setMode(LlmMode.ASK);

        LlmCallContext context = LlmCallContext.builder()
            .tenantId(tenantId.toString())
            .scopeType(ScopeType.TENANT)
            .mode(LlmMode.ASK)
            .modelOverride(model)
            .apiKeyOverride(byok.orElse(null))
            .build();

        try {
            registry.require(provider).call(probe, context).orTimeout(10, TimeUnit.SECONDS).join();
            return ResponseEntity.ok(new TestResponse(true, provider, model, "ok"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new TestResponse(false, provider, model, message(e)));
        }
    }

    @GetMapping("/limits")
    @RequirePermission(value = "administration.ai.read", fullPermission = true)
    public AiLimits getLimits() {
        UUID tenantId = TenantContext.getTenantId();
        String tenant = tenantId != null ? tenantId.toString() : null;
        TenantAiPolicyService.AiRuntimePolicy policy = policyService.policyFor(tenant);
        return new AiLimits(
            policy.enabled(),
            policy.monthlyBudgetUsd() == null ? null : policy.monthlyBudgetUsd().toPlainString(),
            policy.retainPayloads(),
            cipher.configured());
    }

    @PutMapping("/limits")
    @RequirePermission(value = "administration.ai.configure", fullPermission = true)
    public ResponseEntity<AiLimits> updateLimits(@RequestBody LimitsRequest request) {
        UUID tenantId = requireTenant();
        TenantAiPolicyService.AiRuntimePolicy before = policyService.policyFor(tenantId.toString());
        policyService.saveLimits(tenantId, request.enabled(), request.monthlyBudgetUsd(), request.retainPayloads());

        LinkedHashMap<String, Object> changes = new LinkedHashMap<>();
        changes.put("enabled", before.enabled() + " → " + (request.enabled() == null ? before.enabled() : request.enabled()));
        changes.put("monthlyBudgetUsd", text(before.monthlyBudgetUsd()) + " → " + text(request.monthlyBudgetUsd()));
        changes.put("retainPayloads", before.retainPayloads() + " → " + (request.retainPayloads() == null ? before.retainPayloads() : request.retainPayloads()));
        audit.limitsChanged(changes);

        return ResponseEntity.ok(getLimits());
    }

    private static String text(Object v) {
        if (v == null) {
            return "";
        }
        if (v instanceof BigDecimal b) {
            return b.toPlainString();
        }
        return v.toString();
    }

    private String resolveActiveProvider(String tenant) {
        if (aiProvider instanceof RoutingAiProvider routing) {
            return routing.resolveProviderName(tenant);
        }
        return registry.defaultProviderName();
    }

    private String resolveActiveModel(String tenant, String provider) {
        if (aiProvider instanceof RoutingAiProvider routing) {
            String model = routing.resolveModel(tenant, provider, null);
            if (model != null && !model.isBlank()) {
                return model;
            }
        }
        return defaultModelOf(registry.require(provider));
    }

    private static boolean isModelAllowed(String provider, String model) {
        if (AiProviderCatalog.isDeploymentBased(provider)) {
            return !model.isBlank();
        }
        return AiProviderCatalog.models(provider).contains(model);
    }

    private static boolean isPlatformKeyConfigured(AiProvider p) {
        if (p instanceof GeminiProvider g) {
            return g.hasApiKey();
        }
        if (p instanceof OpenAiCompatibleProvider o) {
            return o.hasApiKey();
        }
        return true;
    }

    private static String defaultModelOf(AiProvider p) {
        if (p instanceof GeminiProvider g) {
            return g.getDefaultModel();
        }
        if (p instanceof OpenAiCompatibleProvider o) {
            return o.getDefaultModel();
        }
        return "";
    }

    private static UUID requireTenant() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant required");
        }
        return tenantId;
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private static String message(Throwable e) {
        Throwable cause = e;
        while (cause.getCause() != null && cause.getCause() != cause) {
            cause = cause.getCause();
        }
        String m = cause.getMessage();
        return m == null || m.isBlank() ? cause.getClass().getSimpleName() : m;
    }

    public record AiProviderCard(
        String id,
        String displayName,
        boolean keyConfigured,
        boolean byok,
        String keyHint,
        List<String> models,
        boolean active
    ) {}

    public record AiLimits(
        boolean enabled,
        String monthlyBudgetUsd,
        boolean retainPayloads,
        boolean byokAvailable
    ) {}

    public record AiProvidersStateResponse(
        String activeProvider,
        String activeModel,
        List<AiProviderCard> providers,
        AiLimits limits
    ) {}

    public record UpdateAiProviderRequest(String provider, String model) {}

    public record CredentialRequest(String secret) {}

    public record CredentialResponse(boolean configured, String keyHint) {}

    public record TestRequest(String provider, String model) {}

    public record TestResponse(boolean ok, String provider, String model, String message) {}

    public record LimitsRequest(Boolean enabled, String monthlyBudgetUsd, Boolean retainPayloads) {}
}
