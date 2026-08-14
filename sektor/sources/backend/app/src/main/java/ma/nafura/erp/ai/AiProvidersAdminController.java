package ma.nafura.erp.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.ai.llm.provider.AiProvider;
import ma.nafura.platform.ai.llm.provider.AiProviderRegistry;
import ma.nafura.platform.ai.llm.provider.AiRuntimePreferencePort;
import ma.nafura.platform.ai.llm.provider.RoutingAiProvider;
import ma.nafura.platform.ai.llm.provider.gemini.GeminiProvider;
import ma.nafura.platform.ai.llm.provider.openai.OpenAiCompatibleProvider;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/platform/admin/ai-providers")
@RequiredArgsConstructor
public class AiProvidersAdminController {

    private static final Map<String, List<String>> MODELS = Map.of(
        "gemini", List.of("gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"),
        "deepseek", List.of("deepseek-v4-flash", "deepseek-v4-pro")
    );

    private final AiProviderRegistry registry;
    private final AiRuntimePreferencePort preferences;
    private final AiProvider aiProvider;

    @GetMapping
    @RequirePermission(value = "tenant.settings.read", fullPermission = true)
    public AiProvidersStateResponse getState() {
        UUID tenantId = TenantContext.getTenantId();
        String tenant = tenantId != null ? tenantId.toString() : null;

        String activeProvider = resolveActiveProvider(tenant);
        String activeModel = resolveActiveModel(tenant, activeProvider);

        List<AiProviderCard> cards = new ArrayList<>();
        for (AiProvider p : registry.all()) {
            String name = p.getProviderName();
            boolean keyConfigured = isKeyConfigured(p);
            List<String> models = MODELS.getOrDefault(name, List.of(defaultModelOf(p)));
            cards.add(new AiProviderCard(
                name,
                displayName(name),
                keyConfigured,
                models,
                name.equalsIgnoreCase(activeProvider)
            ));
        }

        return new AiProvidersStateResponse(activeProvider, activeModel, cards);
    }

    @PutMapping
    @RequirePermission(value = "tenant.settings.write", fullPermission = true)
    public ResponseEntity<AiProvidersStateResponse> update(@Valid @RequestBody UpdateAiProviderRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant required");
        }

        String provider = request.provider().trim().toLowerCase();
        if (!registry.has(provider)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown provider: " + provider);
        }

        AiProvider impl = registry.require(provider);
        if (!isKeyConfigured(impl)) {
            throw new ResponseStatusException(
                HttpStatus.PRECONDITION_FAILED,
                "API key missing for provider: " + provider
            );
        }

        String model = request.model() != null ? request.model().trim() : "";
        List<String> allowed = MODELS.getOrDefault(provider, List.of(defaultModelOf(impl)));
        if (!model.isBlank() && !allowed.contains(model)) {
            // Allow custom model string but prefer catalog
            if (!model.startsWith(provider.equals("gemini") ? "gemini" : "deepseek")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported model: " + model);
            }
        }
        if (model.isBlank()) {
            model = allowed.isEmpty() ? defaultModelOf(impl) : allowed.get(0);
        }

        preferences.save(tenantId.toString(), provider, model);
        return ResponseEntity.ok(getState());
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

    private static boolean isKeyConfigured(AiProvider p) {
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

    private static String displayName(String id) {
        return switch (id) {
            case "gemini" -> "Google Gemini";
            case "deepseek" -> "DeepSeek";
            default -> id;
        };
    }

    public record AiProviderCard(
        String id,
        String displayName,
        boolean keyConfigured,
        List<String> models,
        boolean active
    ) {}

    public record AiProvidersStateResponse(
        String activeProvider,
        String activeModel,
        List<AiProviderCard> providers
    ) {}

    public record UpdateAiProviderRequest(
        @NotBlank String provider,
        String model
    ) {}
}
