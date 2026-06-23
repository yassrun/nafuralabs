package ma.nafura.platform.ai.llm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolResult {
    private String toolCallId;
    private String name;
    private String content;
    private boolean success;
    private String error;
}
