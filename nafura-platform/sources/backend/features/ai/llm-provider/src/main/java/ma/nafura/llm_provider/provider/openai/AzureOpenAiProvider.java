package ma.nafura.platform.ai.llm.provider.openai;

import org.springframework.web.reactive.function.client.WebClient;

/**
 * Azure OpenAI uses the OpenAI Chat Completions wire format but authenticates with an
 * {@code api-key} header and routes to a customer deployment name ("model" = deployment).
 */
public class AzureOpenAiProvider extends OpenAiCompatibleProvider {

    private final String apiVersion;

    public AzureOpenAiProvider(WebClient webClient, String apiKey, String deployment, String apiVersion) {
        super("azure-openai", webClient, apiKey, deployment);
        this.apiVersion = apiVersion;
    }

    @Override
    protected String buildUri(String model) {
        return "/openai/deployments/" + model + "/chat/completions?api-version=" + apiVersion;
    }

    @Override
    protected String authHeaderName() {
        return "api-key";
    }

    @Override
    protected String authHeaderValue(String key) {
        return key;
    }
}
