package ma.nafura.platform.ai.llm.provider.openai;

import org.springframework.web.reactive.function.client.WebClient;

public final class AzureOpenAiProviderFactory {

    private AzureOpenAiProviderFactory() {}

    public static OpenAiCompatibleProvider create(String apiKey, String endpoint, String deployment, String apiVersion) {
        String base = (endpoint == null || endpoint.isBlank())
            ? "https://resource.openai.azure.com"
            : endpoint.replaceAll("/+$", "");
        WebClient webClient = WebClient.builder().baseUrl(base).build();
        String resolvedDeployment = (deployment == null || deployment.isBlank()) ? "gpt-4o-mini" : deployment;
        String resolvedApiVersion = (apiVersion == null || apiVersion.isBlank()) ? "2024-08-01-preview" : apiVersion;
        return new AzureOpenAiProvider(webClient, apiKey, resolvedDeployment, resolvedApiVersion);
    }
}
