package ma.nafura.platform.ai.llm.provider.openai;

import org.springframework.web.reactive.function.client.WebClient;

public final class OpenAiProviderFactory {

    private OpenAiProviderFactory() {}

    public static OpenAiCompatibleProvider create(String apiKey, String baseUrl, String model) {
        String base = (baseUrl == null || baseUrl.isBlank())
            ? "https://api.openai.com"
            : baseUrl.replaceAll("/+$", "");
        if (!base.endsWith("/v1")) {
            base = base + "/v1";
        }
        WebClient webClient = WebClient.builder().baseUrl(base).build();
        String resolvedModel = (model == null || model.isBlank()) ? "gpt-4o-mini" : model;
        return new OpenAiCompatibleProvider("openai", webClient, apiKey, resolvedModel);
    }
}
