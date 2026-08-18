package ma.nafura.platform.ai.agent.service.intent;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.List;
import ma.nafura.platform.ai.agent.model.IntentType;
import ma.nafura.platform.ai.agent.service.tool.AgentToolDescriptions;
import ma.nafura.platform.ai.llm.model.ToolDefinition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IntentToolSelectorTest {

    @Mock
    private AgentToolDescriptions agentToolDescriptions;

    private IntentToolSelector selector;

    @BeforeEach
    void setUp() {
        when(agentToolDescriptions.all()).thenReturn(List.of(
                tool("execute_sql"),
                tool("list"),
                tool("summarize"),
                tool("dashboard"),
                tool("search"),
                tool("navigate"),
                tool("help"),
                tool("action")
        ));
        selector = new IntentToolSelector(agentToolDescriptions);
    }

    @Test
    void readIntentAllowsDataToolsOnly() {
        List<String> names = selector.toolsFor(IntentType.READ).stream().map(ToolDefinition::getName).toList();
        assertTrue(names.contains("list"));
        assertTrue(names.contains("execute_sql"));
        assertFalse(names.contains("action"));
    }

    @Test
    void navigateIntentAllowsNavigationToolsOnly() {
        List<String> names = selector.toolsFor(IntentType.NAVIGATE).stream().map(ToolDefinition::getName).toList();
        assertTrue(names.contains("navigate"));
        assertTrue(names.contains("help"));
        assertFalse(names.contains("action"));
    }

    @Test
    void actionIntentAllowsActionToolOnly() {
        List<String> names = selector.toolsFor(IntentType.ACTION).stream().map(ToolDefinition::getName).toList();
        assertTrue(names.contains("action"));
        assertFalse(names.contains("navigate"));
    }

    private static ToolDefinition tool(String name) {
        return new ToolDefinition(name, name, null);
    }
}
