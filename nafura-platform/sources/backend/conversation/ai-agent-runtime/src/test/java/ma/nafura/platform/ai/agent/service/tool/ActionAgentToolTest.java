package ma.nafura.platform.ai.agent.service.tool;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.authorization.apikey.ApiKeyService;
import ma.nafura.platform.collaboration.workflow.ApprovalService;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

class ActionAgentToolTest {

    private ActionAgentTool tool;
    private AgentEntityActionHandler partnerHandler;

    @BeforeEach
    void setUp() {
        partnerHandler = mock(AgentEntityActionHandler.class);
        tool = new ActionAgentTool(
                providerOf(ApiKeyService.class),
                providerOf(ApprovalService.class),
                new AgentPermissionChecker(),
                List.of(partnerHandler)
        );
        TenantContext.setTenantId(UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void delegatesUnknownEntityTypeToHandlers() {
        when(partnerHandler.supports("partner", "create")).thenReturn(true);
        when(partnerHandler.execute(any(), any(), any(), any(), any(), any())).thenReturn(
                AgentToolResult.builder()
                        .success(true)
                        .message("Partner created")
                        .payload(Map.of("id", "123"))
                        .build()
        );

        AgentToolResult result = tool.execute(
                AgentToolRequest.builder()
                        .arguments(Map.of(
                                "operation", "create",
                                "entityType", "partner",
                                "data", Map.of("code", "FOUR-001", "raisonSociale", "Test SARL")
                        ))
                        .build(),
                AgentExecutionContext.builder().tenantId(TenantContext.getTenantIdOrNull().toString()).build()
        );

        assertTrue(result.isSuccess());
        assertEquals("Partner created", result.getMessage());
    }

    @Test
    void returnsUnsupportedWhenNoHandlerMatches() {
        when(partnerHandler.supports(any(), any())).thenReturn(false);

        AgentToolResult result = tool.execute(
                AgentToolRequest.builder()
                        .arguments(Map.of("operation", "create", "entityType", "invoice"))
                        .build(),
                AgentExecutionContext.builder().tenantId(TenantContext.getTenantIdOrNull().toString()).build()
        );

        assertTrue(!result.isSuccess());
        assertTrue(result.getMessage().contains("Unsupported action target"));
    }

    @SuppressWarnings("unchecked")
    private static <T> ObjectProvider<T> providerOf(Class<T> type) {
        ObjectProvider<T> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return provider;
    }
}
