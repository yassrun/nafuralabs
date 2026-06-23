package ma.nafura.platform.ai.llm.service;

import ma.nafura.platform.ai.llm.model.LlmCallContext;
import ma.nafura.platform.ai.llm.model.LlmMode;
import ma.nafura.platform.ai.llm.model.LlmRequest;
import ma.nafura.platform.ai.llm.model.LlmResponseFormat;
import ma.nafura.platform.ai.llm.model.NormalizedLlmRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class LlmRequestNormalizer {

    public NormalizedLlmRequest normalize(LlmRequest request, LlmCallContext context) {
        if (request == null) {
            throw new IllegalArgumentException("LLM request is required");
        }

        LlmMode mode = context != null && context.getMode() != null
            ? context.getMode()
            : (request.getMode() != null ? request.getMode() : LlmMode.ASK);

        String prompt = trimToNull(request.getPrompt());
        String schema = trimToNull(request.getResponseSchema());
        String systemInstruction = trimToNull(request.getSystemInstruction());
        List<LlmRequest.MediaContent> media = sanitizeMedia(request.getMediaContents());

        if (prompt == null && media.isEmpty() && (request.getConversationHistory() == null || request.getConversationHistory().isEmpty())) {
            throw new IllegalArgumentException("LLM request must contain either prompt, media contents, or conversation history");
        }

        LlmResponseFormat responseFormat = schema != null || mode == LlmMode.AGENT
            ? LlmResponseFormat.JSON
            : LlmResponseFormat.TEXT;

        NormalizedLlmRequest.NormalizedLlmRequestBuilder builder = NormalizedLlmRequest.builder()
            .prompt(prompt)
            .responseSchema(schema)
            .systemInstruction(systemInstruction)
            .mediaContents(media)
            .metadata(request.getMetadata() != null ? request.getMetadata() : Map.of())
            .mode(mode)
            .responseFormat(responseFormat)
            .tools(request.getTools())
            .conversationHistory(request.getConversationHistory())
            .toolChoice(request.getToolChoice() != null ? request.getToolChoice() : LlmRequest.ToolChoice.AUTO);
        return builder.build();
    }

    private List<LlmRequest.MediaContent> sanitizeMedia(List<LlmRequest.MediaContent> mediaContents) {
        if (mediaContents == null || mediaContents.isEmpty()) {
            return List.of();
        }

        return mediaContents.stream()
            .filter(Objects::nonNull)
            .filter(media -> hasText(media.getUrl()) || hasText(media.getContentBase64()))
            .filter(media -> hasText(media.getMimeType()))
            .toList();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}

