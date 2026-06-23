package ma.nafura.platform.ai.llm.service;

import ma.nafura.platform.ai.llm.model.ToolCall;
import ma.nafura.platform.ai.llm.model.ToolResult;

import java.util.List;

/**
 * Executes tool calls requested by the LLM. Implementations typically
 * dispatch to AgentToolRegistry or other tool runners.
 */
public interface ToolExecutor {
    List<ToolResult> executeTools(List<ToolCall> toolCalls);
}
