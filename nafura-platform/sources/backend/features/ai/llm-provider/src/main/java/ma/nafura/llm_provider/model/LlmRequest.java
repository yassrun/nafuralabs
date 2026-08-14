package ma.nafura.platform.ai.llm.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LlmRequest {
    private String prompt;
    private List<MediaContent> mediaContents; // images, audio, etc.
    private String responseSchema; // JSON schema for structured output
    private String systemInstruction;
    private Map<String, Object> metadata;
    private LlmMode mode; // optional fallback when context mode is not set

    /** Tool definitions available to the LLM. */
    private List<ToolDefinition> tools;
    /** Multi-turn conversation history. When set, prompt is ignored. */
    private List<ConversationTurn> conversationHistory;
    /** Tool choice strategy. */
    private ToolChoice toolChoice;

    public enum ToolChoice {
        AUTO,    // LLM decides whether to call a tool
        NONE,    // LLM must not call tools (text-only response)
        REQUIRED // LLM must call at least one tool
    }
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaContent {
        private String mimeType;
        private String contentBase64; // base64 encoded content
        private String url; // optional URL for content
        private MediaType type; // IMAGE, AUDIO, VIDEO, etc.
    }
    
    public enum MediaType {
        IMAGE,
        AUDIO,
        VIDEO,
        DOCUMENT
    }
}

