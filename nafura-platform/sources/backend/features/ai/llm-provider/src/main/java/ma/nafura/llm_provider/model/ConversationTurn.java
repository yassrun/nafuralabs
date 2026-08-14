package ma.nafura.platform.ai.llm.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationTurn {
    private Role role;
    private String content;
    private List<ToolCall> toolCalls;
    private ToolResult toolResult;

    public enum Role {
        USER,
        ASSISTANT,
        SYSTEM,
        TOOL
    }

    public static ConversationTurn user(String content) {
        return ConversationTurn.builder().role(Role.USER).content(content).build();
    }

    public static ConversationTurn assistant(String content) {
        return ConversationTurn.builder().role(Role.ASSISTANT).content(content).build();
    }

    public static ConversationTurn assistantToolCalls(List<ToolCall> toolCalls) {
        return ConversationTurn.builder().role(Role.ASSISTANT).toolCalls(toolCalls).build();
    }

    public static ConversationTurn system(String content) {
        return ConversationTurn.builder().role(Role.SYSTEM).content(content).build();
    }

    public static ConversationTurn tool(ToolResult toolResult) {
        return ConversationTurn.builder().role(Role.TOOL).toolResult(toolResult).build();
    }
}
