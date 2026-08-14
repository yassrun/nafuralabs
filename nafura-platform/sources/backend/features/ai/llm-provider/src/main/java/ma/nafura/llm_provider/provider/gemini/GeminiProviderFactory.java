package ma.nafura.platform.ai.llm.provider.gemini;

import org.springframework.web.reactive.function.client.WebClient;

public class GeminiProviderFactory {
    public static GeminiProvider create(String apiKey, String baseUrl, String model) {
        WebClient webClient = WebClient.builder()
            .baseUrl(baseUrl)
            .build();
        
        return new GeminiProvider(webClient, apiKey, baseUrl, model);
    }
}

