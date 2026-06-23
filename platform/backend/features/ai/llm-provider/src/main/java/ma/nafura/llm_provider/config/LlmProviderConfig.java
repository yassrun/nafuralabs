package ma.nafura.platform.ai.llm.config;

import ma.nafura.platform.ai.llm.cost.CostCalculator;
import ma.nafura.platform.ai.llm.cost.DefaultCostCalculator;
import ma.nafura.platform.ai.llm.provider.AiProvider;
import ma.nafura.platform.ai.llm.provider.gemini.GeminiProviderFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

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
    
    @Bean
    @ConditionalOnMissingBean
    public AiProvider aiProvider() {
        if ("gemini".equalsIgnoreCase(provider)) {
            return GeminiProviderFactory.create(geminiApiKey, geminiBaseUrl, geminiModel);
        }
        throw new IllegalArgumentException("Unsupported AI provider: " + provider);
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

