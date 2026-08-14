package ma.nafura.platform.ai.llm.config;

import ma.nafura.platform.ai.llm.cost.CostCalculator;
import ma.nafura.platform.ai.llm.cost.DefaultCostCalculator;
import ma.nafura.platform.ai.llm.provider.AiProvider;
import ma.nafura.platform.ai.llm.provider.AiProviderRegistry;
import ma.nafura.platform.ai.llm.provider.AiRuntimePreferencePort;
import ma.nafura.platform.ai.llm.provider.RoutingAiProvider;
import ma.nafura.platform.ai.llm.provider.gemini.GeminiProvider;
import ma.nafura.platform.ai.llm.provider.gemini.GeminiProviderFactory;
import ma.nafura.platform.ai.llm.provider.openai.DeepSeekProviderFactory;
import ma.nafura.platform.ai.llm.provider.openai.OpenAiCompatibleProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@AutoConfiguration
@EnableConfigurationProperties(LlmExecutionProperties.class)
public class LlmProviderConfig {

    @Value("${ai.provider:gemini}")
    private String provider;

    @Value("${ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${ai.gemini.base-url:https://generativelanguage.googleapis.com}")
    private String geminiBaseUrl;

    @Value("${ai.gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Value("${ai.deepseek.api-key:}")
    private String deepseekApiKey;

    @Value("${ai.deepseek.base-url:https://api.deepseek.com}")
    private String deepseekBaseUrl;

    @Value("${ai.deepseek.model:deepseek-v4-flash}")
    private String deepseekModel;

    @Bean
    @ConditionalOnMissingBean
    public AiProviderRegistry aiProviderRegistry() {
        Map<String, AiProvider> providers = new LinkedHashMap<>();
        GeminiProvider gemini = GeminiProviderFactory.create(geminiApiKey, geminiBaseUrl, geminiModel);
        providers.put("gemini", gemini);

        OpenAiCompatibleProvider deepseek =
            DeepSeekProviderFactory.create(deepseekApiKey, deepseekBaseUrl, deepseekModel);
        providers.put("deepseek", deepseek);

        String defaultName = provider != null ? provider.trim().toLowerCase() : "gemini";
        if (!providers.containsKey(defaultName)) {
            throw new IllegalArgumentException("Unsupported AI provider: " + provider);
        }
        return new AiProviderRegistry(providers, defaultName);
    }

    @Bean
    @Primary
    @ConditionalOnMissingBean(name = "aiProvider")
    public AiProvider aiProvider(
        AiProviderRegistry registry,
        @Autowired(required = false) AiRuntimePreferencePort preferencePort
    ) {
        return new RoutingAiProvider(registry, Optional.ofNullable(preferencePort));
    }

    @Bean
    @ConditionalOnMissingBean
    public CostCalculator costCalculator() {
        return new DefaultCostCalculator();
    }

    @Bean(destroyMethod = "shutdown")
    @ConditionalOnMissingBean(name = "llmAuditExecutor")
    public Executor llmAuditExecutor() {
        return Executors.newFixedThreadPool(4);
    }
}
