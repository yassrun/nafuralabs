package ma.nafura.platform.ai.llm.provider;

import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmResponse;
import ma.nafura.platform.ai.llm.model.NormalizedLlmRequest;

import java.util.concurrent.CompletableFuture;

public interface AiProvider {
    String getProviderName();

    CompletableFuture<LlmResponse> call(NormalizedLlmRequest request, LlmCallContext context);
}

