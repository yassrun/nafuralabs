package ma.nafura.platform.ai.llm.provider.openai;

import org.springframework.web.reactive.function.client.WebClient;

public final class DeepSeekProviderFactory {

    private DeepSeekProviderFactory() {}

    public static OpenAiCompatibleProvider create(String apiKey, String baseUrl, String model) {
        String base = (baseUrl == null || baseUrl.isBlank())
            ? "https://api.deepseek.com"
            : baseUrl.replaceAll("/+$", "");
        // DeepSeek OpenAI-compat path is /v1/chat/completions
        if (!base.endsWith("/v1")) {
            base = base + "/v1";
        }
        WebClient webClient = WebClient.builder().baseUrl(base).build();
        String resolvedModel = (model == null || model.isBlank()) ? "deepseek-v4-flash" : model;
        return new OpenAiCompatibleProvider("deepseek", webClient, apiKey, resolvedModel);
    }
}
