package ma.nafura.socle.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.socle.api.dto.ApprovalRequestDto;
import ma.nafura.socle.api.request.ApprovalActionDto;
import ma.nafura.socle.api.request.ApprovalRequestSubmitDto;
import ma.nafura.socle.domain.ApprovalRequest;
import ma.nafura.socle.domain.ApprovalWorkflow;
import ma.nafura.socle.repository.ApprovalEventRepository;
import ma.nafura.socle.repository.ErpApprovalRequestRepository;
import ma.nafura.socle.repository.ApprovalWorkflowRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ma.nafura.socle.seeders.ApprovalRequestSeedService;
import ma.nafura.socle.seeders.ApprovalWorkflowSeedService;

import ma.nafura.sektor.socle.port.bc.ApproverResolutionPort;
@ExtendWith(MockitoExtension.class)
class ApprovalEngineServiceTest {

    @Mock
    private ApprovalWorkflowRepository workflowRepository;

    @Mock
    private ErpApprovalRequestRepository requestRepository;

    @Mock
    private ApprovalEventRepository eventRepository;

    @Mock
    private ApprovalEventService eventService;

    @Mock
    private ApprovalWorkflowSeedService workflowSeedService;

    @Mock
    private ApprovalRequestSeedService requestSeedService;

    @Mock
    private MatricePouvoirService matricePouvoirService;

    @Mock
    private DelegationApprobationService delegationApprobationService;

    @Mock
    private ma.nafura.sektor.socle.port.bc.ApproverResolutionPort approverResolutionPort;

    @Mock
    private ma.nafura.platform.framework.event.ErpNotificationPublisher erpNotificationPublisher;

    private ApprovalEngineService service;
    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        lenient().when(matricePouvoirService.resolve(any(), any())).thenReturn(Optional.empty());
        lenient().when(approverResolutionPort.resolve(any(), any(), any())).thenReturn(Optional.empty());
        lenient().when(approverResolutionPort.normalizeRole(nullable(String.class))).then(returnsFirstArg());
        lenient().when(approverResolutionPort.labelRole(nullable(String.class))).then(returnsFirstArg());
        service = new ApprovalEngineService(
                workflowRepository,
                requestRepository,
                eventRepository,
                eventService,
                workflowSeedService,
                requestSeedService,
                matricePouvoirService,
                delegationApprobationService,
                approverResolutionPort,
                new com.fasterxml.jackson.databind.ObjectMapper(),
                erpNotificationPublisher);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void selectWorkflow_prefersHighAmountBcWorkflow() {
        ApprovalWorkflow high = bcWorkflow("wf-bc-500k", "[{\"champ\":\"montant\",\"operateur\":\">=\",\"valeur\":500000}]");
        ApprovalWorkflow standard = bcWorkflow("wf-bc-std", "[]");

        when(workflowRepository.findByTenantIdAndEntityTypeAndIsActiveTrueOrderByLabelAsc(tenantId, "BC"))
                .thenReturn(List.of(standard, high));

        Map<String, Object> ctx = new HashMap<>();
        ctx.put("montant", BigDecimal.valueOf(1_050_000));

        ApprovalWorkflow selected = service.selectWorkflow("BC", ctx);
        assertThat(selected.getId()).isEqualTo("wf-bc-500k");
    }

    @Test
    void selectWorkflow_usesStandardWhenBelowThreshold() {
        ApprovalWorkflow high = bcWorkflow("wf-bc-500k", "[{\"champ\":\"montant\",\"operateur\":\">=\",\"valeur\":500000}]");
        ApprovalWorkflow standard = bcWorkflow("wf-bc-std", "[]");

        when(workflowRepository.findByTenantIdAndEntityTypeAndIsActiveTrueOrderByLabelAsc(tenantId, "BC"))
                .thenReturn(List.of(standard, high));

        Map<String, Object> ctx = new HashMap<>();
        ctx.put("montant", BigDecimal.valueOf(32_000));

        ApprovalWorkflow selected = service.selectWorkflow("BC", ctx);
        assertThat(selected.getId()).isEqualTo("wf-bc-std");
    }

    @Test
    void approve_advancesStepUntilFinalApproval() {
        ApprovalWorkflow workflow = bcWorkflow("wf-bc-500k", "[{\"champ\":\"montant\",\"operateur\":\">=\",\"valeur\":500000}]");
        ApprovalRequest request = ApprovalRequest.builder()
                .id("apr-001")
                .tenantId(tenantId)
                .workflowId(workflow.getId())
                .entityType("BC")
                .entityId("bc007")
                .entityRef("BC-2026-00007")
                .entitySummary("Test")
                .initiateurUserId("emp-001")
                .initiateurNom("Karim")
                .status(ApprovalRequest.STATUS_EN_COURS)
                .etapeCouranteIndex(0)
                .dateSoumission(java.time.LocalDate.now())
                .urgence("NORMALE")
                .build();

        when(requestRepository.findByIdAndTenantId("apr-001", tenantId)).thenReturn(Optional.of(request));
        when(workflowRepository.findByIdAndTenantId(workflow.getId(), tenantId)).thenReturn(Optional.of(workflow));
        when(eventRepository.findByTenantIdAndRequestIdOrderByCreatedAtAsc(tenantId, "apr-001"))
                .thenReturn(List.of());
        when(requestRepository.save(any(ApprovalRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ApprovalActionDto action = new ApprovalActionDto();
        action.setUserId("emp-002");
        action.setUserNom("Amal Bennani");

        ApprovalRequestDto afterFirst = service.approve("apr-001", action);
        assertThat(afterFirst.getEtapeCouranteIndex()).isEqualTo(1);
        assertThat(afterFirst.getStatus()).isEqualTo("EN_ATTENTE");

        ArgumentCaptor<ApprovalRequest> captor = ArgumentCaptor.forClass(ApprovalRequest.class);
        org.mockito.Mockito.verify(requestRepository).save(captor.capture());
        assertThat(captor.getValue().getEtapeCouranteIndex()).isEqualTo(1);
    }

    @Test
    void approveRemaining_drainsUntilApprouve() {
        ApprovalWorkflow workflow = bcWorkflow("wf-bc-500k", "[]");
        ApprovalRequest request = openRequest(workflow, 0);

        when(requestRepository.findByIdAndTenantId("apr-001", tenantId)).thenReturn(Optional.of(request));
        when(workflowRepository.findByIdAndTenantId(workflow.getId(), tenantId)).thenReturn(Optional.of(workflow));
        when(eventRepository.findByTenantIdAndRequestIdOrderByCreatedAtAsc(tenantId, "apr-001"))
                .thenReturn(List.of());
        when(requestRepository.save(any(ApprovalRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ApprovalActionDto action = new ApprovalActionDto();
        action.setUserId("owner");
        action.setUserNom("QA Owner");

        ApprovalRequestDto closed = service.approveRemaining("apr-001", action);
        assertThat(closed.getStatus()).isEqualTo(ApprovalRequest.STATUS_APPROUVE);
        assertThat(request.getEtapeCouranteIndex()).isEqualTo(2);
        assertThat(request.getDateCloture()).isNotNull();
    }

    @Test
    void approveRemaining_noopIfAlreadyClosed() {
        ApprovalWorkflow workflow = bcWorkflow("wf-bc-500k", "[]");
        ApprovalRequest request = openRequest(workflow, 2);
        request.setStatus(ApprovalRequest.STATUS_APPROUVE);

        when(requestRepository.findByIdAndTenantId("apr-001", tenantId)).thenReturn(Optional.of(request));
        when(workflowRepository.findByIdAndTenantId(workflow.getId(), tenantId)).thenReturn(Optional.of(workflow));
        when(eventRepository.findByTenantIdAndRequestIdOrderByCreatedAtAsc(tenantId, "apr-001"))
                .thenReturn(List.of());

        ApprovalRequestDto closed = service.approveRemaining("apr-001", new ApprovalActionDto());
        assertThat(closed.getStatus()).isEqualTo(ApprovalRequest.STATUS_APPROUVE);
        org.mockito.Mockito.verify(requestRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void cancel_closesOpenRequest() {
        ApprovalWorkflow workflow = bcWorkflow("wf-bc-500k", "[]");
        ApprovalRequest request = openRequest(workflow, 0);

        when(requestRepository.findByIdAndTenantId("apr-001", tenantId)).thenReturn(Optional.of(request));
        when(workflowRepository.findByIdAndTenantId(workflow.getId(), tenantId)).thenReturn(Optional.of(workflow));
        when(eventRepository.findByTenantIdAndRequestIdOrderByCreatedAtAsc(tenantId, "apr-001"))
                .thenReturn(List.of());
        when(requestRepository.save(any(ApprovalRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ApprovalActionDto action = new ApprovalActionDto();
        action.setUserId("owner");
        action.setCommentaire("Étude annulée");

        ApprovalRequestDto cancelled = service.cancel("apr-001", action);
        assertThat(cancelled.getStatus()).isEqualTo(ApprovalRequest.STATUS_ANNULE);
        assertThat(request.getDateCloture()).isNotNull();
    }

    private ApprovalRequest openRequest(ApprovalWorkflow workflow, int etape) {
        return ApprovalRequest.builder()
                .id("apr-001")
                .tenantId(tenantId)
                .workflowId(workflow.getId())
                .entityType("BC")
                .entityId("bc007")
                .entityRef("BC-2026-00007")
                .entitySummary("Test")
                .initiateurUserId("emp-001")
                .initiateurNom("Karim")
                .status(ApprovalRequest.STATUS_EN_COURS)
                .etapeCouranteIndex(etape)
                .dateSoumission(java.time.LocalDate.now())
                .urgence("NORMALE")
                .build();
    }

    private ApprovalWorkflow bcWorkflow(String id, String conditionsJson) {
        return ApprovalWorkflow.builder()
                .id(id)
                .tenantId(tenantId)
                .code(id)
                .label(id)
                .entityType("BC")
                .conditionsJson(conditionsJson)
                .etapesJson(
                        "[{\"ordre\":0,\"type\":\"SERIE\",\"approbateurs\":[{\"type\":\"ROLE\",\"ref\":\"CONDUCTEUR_TRAVAUX\"}]},"
                                + "{\"ordre\":1,\"type\":\"SERIE\",\"approbateurs\":[{\"type\":\"ROLE\",\"ref\":\"DAF\"}]},"
                                + "{\"ordre\":2,\"type\":\"SERIE\",\"approbateurs\":[{\"type\":\"ROLE\",\"ref\":\"DG\"}]}]")
                .slaJours(4)
                .isActive(true)
                .build();
    }
}
