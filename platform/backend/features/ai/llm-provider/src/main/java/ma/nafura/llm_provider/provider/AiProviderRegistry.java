package ma.nafura.platform.ai.llm.provider;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public class AiProviderRegistry {

    private final Map<String, AiProvider> providers;
    private final String defaultProvider;

    public AiProviderRegistry(Map<String, AiProvider> providers, String defaultProvider) {
        this.providers = new LinkedHashMap<>();
        if (providers != null) {
            providers.forEach((k, v) -> {
                if (k != null && v != null) {
                    this.providers.put(k.trim().toLowerCase(), v);
                }
            });
        }
        String fallback = defaultProvider != null ? defaultProvider.trim().toLowerCase() : "gemini";
        if (!this.providers.containsKey(fallback) && !this.providers.isEmpty()) {
            fallback = this.providers.keySet().iterator().next();
        }
        this.defaultProvider = fallback;
    }

    public Collection<AiProvider> all() {
        return providers.values();
    }

    public boolean has(String name) {
        return name != null && providers.containsKey(name.trim().toLowerCase());
    }

    public Optional<AiProvider> find(String name) {
        if (name == null || name.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(providers.get(name.trim().toLowerCase()));
    }

    public AiProvider require(String name) {
        return find(name).orElseThrow(() -> new IllegalArgumentException("Unknown AI provider: " + name));
    }

    public AiProvider defaultProvider() {
        return require(defaultProvider);
    }

    public String defaultProviderName() {
        return defaultProvider;
    }
}
