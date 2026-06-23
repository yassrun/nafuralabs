package ma.nafura.platform.ai.llm.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai.execution")
public class LlmExecutionProperties {
    private long timeoutMs = 30000;
    private int maxRetries = 1;
    private long retryBackoffMs = 500;
}

