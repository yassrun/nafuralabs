package ma.nafura.achats.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.api.request.PartnerCreateDto;
import ma.nafura.achats.domain.model.Partner;
import ma.nafura.achats.domain.model.PartnerRoleType;
import ma.nafura.achats.service.PartnerService;
import ma.nafura.platform.ai.agent.service.AgentExecutionContext;
import ma.nafura.platform.ai.agent.service.tool.AgentToolRequest;
import ma.nafura.platform.ai.agent.service.tool.AgentToolResult;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PartnerAgentActionHandlerTest {

    @Mock
    private PartnerService partnerService;

    private PartnerAgentActionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new PartnerAgentActionHandler(partnerService);
        UserContext.setSuperAdmin(true);
    }

    @AfterEach
    void tearDown() {
        UserContext.clear();
    }

    @Test
    void supportsPartnerCreate() {
        assertTrue(handler.supports("partner", "create"));
        assertTrue(handler.supports("fournisseur", "create"));
        assertTrue(handler.supports("partner", "update"));
        assertTrue(handler.supports("partner", "delete"));
        assertFalse(handler.supports("chantier", "create"));
    }

    @Test
    void createsPartnerWithDefaultFournisseurRole() {
        UUID partnerId = UUID.randomUUID();
        Partner partner = Partner.builder()
                .id(partnerId)
                .code("FOUR-001")
                .raisonSociale("Test SARL")
                .build();
        when(partnerService.create(any())).thenReturn(partner);

        AgentToolResult result = handler.execute(
                AgentToolRequest.builder().build(),
                AgentExecutionContext.builder().build(),
                "create",
                "fournisseur",
                Map.of("code", "FOUR-001", "raisonSociale", "Test SARL"),
                null
        );

        assertTrue(result.isSuccess());
        assertEquals(partnerId.toString(), result.getPayload().get("id"));

        ArgumentCaptor<PartnerCreateDto> captor = ArgumentCaptor.forClass(PartnerCreateDto.class);
        verify(partnerService).create(captor.capture());
        assertEquals(List.of(PartnerRoleType.FOURNISSEUR), captor.getValue().getRoles());
    }

    @Test
    void requiresCodeAndRaisonSociale() {
        AgentToolResult result = handler.execute(
                AgentToolRequest.builder().build(),
                AgentExecutionContext.builder().build(),
                "create",
                "partner",
                Map.of("code", "FOUR-001"),
                null
        );

        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("raisonSociale"));
    }
}
