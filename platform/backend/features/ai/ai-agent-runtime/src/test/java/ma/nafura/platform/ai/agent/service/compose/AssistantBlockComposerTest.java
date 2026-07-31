package ma.nafura.platform.ai.agent.service.compose;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import ma.nafura.platform.ai.agent.model.AssistantBlock;
import ma.nafura.platform.ai.agent.model.AssistantBlockType;
import ma.nafura.platform.ai.agent.service.tool.AgentToolResult;
import org.junit.jupiter.api.Test;

class AssistantBlockComposerTest {

    private final AssistantBlockComposer composer = new AssistantBlockComposer();

    @Test
    void composeReadBlocksFromListToolResult() {
        AgentToolResult result = AgentToolResult.builder()
                .success(true)
                .message("Found 12 articles")
                .payload(Map.of(
                        "count", 12L,
                        "metric", "Articles en stock",
                        "route", "/catalog/items"
                ))
                .build();

        List<AssistantBlock> blocks = composer.fromToolResult(result);

        assertTrue(blocks.stream().anyMatch(block -> block.getType() == AssistantBlockType.KPI));
    }
}
