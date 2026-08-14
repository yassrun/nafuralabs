package ma.nafura.platform.ai.llm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NormalizedLlmRequest {
    private String prompt;
    private List<LlmRequest.MediaContent> mediaContents;
    private String responseSchema;
    private String systemInstruction;
    private Map<String, Object> metadata;
    private LlmMode mode;
    private LlmResponseFormat responseFormat;
    private List<ToolDefinition> tools;
    private List<ConversationTurn> conversationHistory;
    private LlmRequest.ToolChoice toolChoice;
}

