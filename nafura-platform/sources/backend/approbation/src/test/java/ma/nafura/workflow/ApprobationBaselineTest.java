package ma.nafura.platform.collaboration.workflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.collaboration.workflow.api.WorkflowStepDto;
import ma.nafura.platform.collaboration.workflow.api.WorkflowTemplateCreateRequest;
import ma.nafura.platform.collaboration.workflow.api.WorkflowTemplateDto;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalRequest;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalStep;
import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowStep;
import ma.nafura.platform.collaboration.workflow.domain.model.WorkflowTemplate;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalRequestRepository;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalStepRepository;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowInstanceRepository;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowStepRepository;
import ma.nafura.platform.collaboration.workflow.repository.WorkflowTemplateRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ApprobationBaselineTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final String ENTITY_TYPE = "record";
    private static final UUID ENTITY_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final String ROLE_USER = "approver";
    private static final String ROLE_OTHER = "reviewer";

    @Mock
    private ApprovalRequestRepository requestRepository;

    @Mock
    private ApprovalStepRepository approvalStepRepository;

    @Mock
    private ApplicationEventPublisher events;

    @Mock
    private WorkflowTemplateRepository templateRepository;

    @Mock
    private WorkflowStepRepository workflowStepRepository;

    @Mock
    private WorkflowInstanceRepository instanceRepository;

    private final Map<UUID, ApprovalRequest> requests = new LinkedHashMap<>();
    private final Map<UUID, ApprovalStep> approvalSteps = new LinkedHashMap<>();
    private final Map<UUID, WorkflowTemplate> templates = new LinkedHashMap<>();
    private final Map<UUID, WorkflowStep> workflowSteps = new LinkedHashMap<>();

    private ApprovalServiceImpl approvals;
    private WorkflowTemplateService chains;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserEmail("a@example.com");
        UserContext.setUserRole(ROLE_USER);
        stubApprovalRepos();
        stubChainRepos();
        approvals = new ApprovalServiceImpl(requestRepository, approvalStepRepository, events);
        chains = new WorkflowTemplateService(templateRepository, workflowStepRepository, instanceRepository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        requests.clear();
        approvalSteps.clear();
        templates.clear();
        workflowSteps.clear();
    }

    @Test
    void demander() {
        ApprovalRequest created = approvals.requestApproval(
                ENTITY_TYPE, ENTITY_ID, "Demande opaque", List.of());
        Page<ApprovalRequest> listed = approvals.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));

        assertThat(listed.getContent()).extracting(ApprovalRequest::getId).contains(created.getId());
        assertThat(created.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void accepter() {
        ApprovalRequest pending = pendingOneStep(ROLE_USER);

        approvals.approve(pending.getId(), "ok");

        ApprovalRequest after = requests.get(pending.getId());
        assertThat(after.getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void refuser() {
        ApprovalRequest pending = pendingOneStep(ROLE_USER);

        approvals.reject(pending.getId(), null);

        ApprovalRequest after = requests.get(pending.getId());
        assertThat(after.getStatus()).isEqualTo("REJECTED");
    }

    @Test
    void deuxTenants() {
        ApprovalRequest ofA = pendingOneStep(ROLE_USER);

        TenantContext.setTenantId(TENANT_B);
        Page<ApprovalRequest> listedB = approvals.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));

        assertThat(listedB.getContent()).isEmpty();
        assertThatThrownBy(() -> approvals.approve(ofA.getId(), null))
                .isInstanceOf(CrudNotFoundException.class);
    }

    @Test
    void etapes() {
        ApprovalRequest pending = pendingTwoSteps(ROLE_USER, ROLE_OTHER);

        approvals.approve(pending.getId(), "step-1");

        ApprovalRequest after = requests.get(pending.getId());
        List<ApprovalStep> steps = approvalSteps.values().stream()
                .filter(s -> pending.getId().equals(s.getApprovalRequestId()))
                .sorted(Comparator.comparing(ApprovalStep::getStepNumber))
                .toList();
        assertThat(steps.get(0).getStatus()).isEqualTo("APPROVED");
        assertThat(steps.get(1).getStatus()).isEqualTo("PENDING");
        assertThat(after.getStatus()).isEqualTo("PENDING");
    }

    @Test
    void chaine() {
        WorkflowTemplateDto created = chains.create(chainRequest());

        TenantContext.setTenantId(TENANT_B);
        Page<WorkflowTemplateDto> listedB = chains.list(PageRequest.of(0, 20));

        assertThat(created.getEntityType()).isEqualTo(ENTITY_TYPE);
        assertThat(listedB.getContent()).isEmpty();
        assertThatThrownBy(() -> chains.get(created.getId()))
                .isInstanceOf(CrudNotFoundException.class);
    }

    private ApprovalRequest pendingOneStep(String role) {
        return approvals.requestApproval(
                ENTITY_TYPE,
                ENTITY_ID,
                "En attente",
                List.of(ApprovalStepDefinition.builder().stepNumber(1).approverRole(role).build()));
    }

    private ApprovalRequest pendingTwoSteps(String firstRole, String secondRole) {
        return approvals.requestApproval(
                ENTITY_TYPE,
                ENTITY_ID,
                "Deux étapes",
                List.of(
                        ApprovalStepDefinition.builder().stepNumber(1).approverRole(firstRole).build(),
                        ApprovalStepDefinition.builder().stepNumber(2).approverRole(secondRole).build()));
    }

    private WorkflowTemplateCreateRequest chainRequest() {
        return WorkflowTemplateCreateRequest.builder()
                .code("std")
                .name("Chaîne A")
                .entityType(ENTITY_TYPE)
                .steps(List.of(WorkflowStepDto.builder()
                        .stepNumber(1)
                        .name("Décider")
                        .approverRole(ROLE_USER)
                        .build()))
                .build();
    }

    private void stubApprovalRepos() {
        when(requestRepository.save(any(ApprovalRequest.class))).thenAnswer(inv -> {
            ApprovalRequest r = inv.getArgument(0);
            if (r.getId() == null) {
                r.setId(UUID.randomUUID());
            }
            if (r.getRequestedAt() == null) {
                r.setRequestedAt(OffsetDateTime.now());
            }
            requests.put(r.getId(), r);
            return r;
        });
        when(requestRepository.findByIdAndTenantId(any(), any())).thenAnswer(inv -> {
            ApprovalRequest r = requests.get(inv.getArgument(0));
            UUID tenant = inv.getArgument(1);
            if (r == null || !tenant.equals(r.getTenantId())) {
                return Optional.empty();
            }
            return Optional.of(r);
        });
        when(requestRepository.findByTenantIdAndEntityTypeAndEntityIdOrderByRequestedAtDesc(
                any(), any(), any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            String type = inv.getArgument(1);
            UUID id = inv.getArgument(2);
            var pageable = inv.getArgument(3, org.springframework.data.domain.Pageable.class);
            var items = requests.values().stream()
                    .filter(r -> tenant.equals(r.getTenantId())
                            && type.equals(r.getEntityType())
                            && id.equals(r.getEntityId()))
                    .sorted(Comparator.comparing(ApprovalRequest::getRequestedAt).reversed())
                    .toList();
            return new PageImpl<>(items, pageable, items.size());
        });
        when(requestRepository.findByTenantIdAndEntityTypeAndEntityId(any(), any(), any()))
                .thenAnswer(inv -> {
                    UUID tenant = inv.getArgument(0);
                    String type = inv.getArgument(1);
                    UUID id = inv.getArgument(2);
                    return requests.values().stream()
                            .filter(r -> tenant.equals(r.getTenantId())
                                    && type.equals(r.getEntityType())
                                    && id.equals(r.getEntityId()))
                            .toList();
                });
        when(requestRepository.findByTenantIdAndIdInOrderByRequestedAtAsc(any(), any()))
                .thenAnswer(inv -> {
                    UUID tenant = inv.getArgument(0);
                    Collection<UUID> ids = inv.getArgument(1);
                    return requests.values().stream()
                            .filter(r -> tenant.equals(r.getTenantId()) && ids.contains(r.getId()))
                            .sorted(Comparator.comparing(ApprovalRequest::getRequestedAt))
                            .toList();
                });
        when(approvalStepRepository.save(any(ApprovalStep.class))).thenAnswer(inv -> {
            ApprovalStep s = inv.getArgument(0);
            if (s.getId() == null) {
                s.setId(UUID.randomUUID());
            }
            approvalSteps.put(s.getId(), s);
            return s;
        });
        when(approvalStepRepository.findByApprovalRequestIdOrderByStepNumberAsc(any()))
                .thenAnswer(inv -> {
                    UUID requestId = inv.getArgument(0);
                    return approvalSteps.values().stream()
                            .filter(s -> requestId.equals(s.getApprovalRequestId()))
                            .sorted(Comparator.comparing(ApprovalStep::getStepNumber))
                            .toList();
                });
        when(approvalStepRepository.findByTenantIdAndStatusAndApproverRole(any(), any(), any()))
                .thenAnswer(inv -> {
                    UUID tenant = inv.getArgument(0);
                    String status = inv.getArgument(1);
                    String role = inv.getArgument(2);
                    return approvalSteps.values().stream()
                            .filter(s -> tenant.equals(s.getTenantId())
                                    && status.equals(s.getStatus())
                                    && role.equals(s.getApproverRole()))
                            .toList();
                });
    }

    private void stubChainRepos() {
        when(templateRepository.save(any(WorkflowTemplate.class))).thenAnswer(inv -> {
            WorkflowTemplate t = inv.getArgument(0);
            if (t.getId() == null) {
                t.setId(UUID.randomUUID());
            }
            templates.put(t.getId(), t);
            return t;
        });
        when(templateRepository.findByTenantIdAndEntityTypeAndCode(any(), any(), any()))
                .thenAnswer(inv -> {
                    UUID tenant = inv.getArgument(0);
                    String type = inv.getArgument(1);
                    String code = inv.getArgument(2);
                    return templates.values().stream()
                            .filter(t -> tenant.equals(t.getTenantId())
                                    && type.equals(t.getEntityType())
                                    && code.equals(t.getCode()))
                            .findFirst();
                });
        when(templateRepository.findByIdAndTenantId(any(), any())).thenAnswer(inv -> {
            WorkflowTemplate t = templates.get(inv.getArgument(0));
            UUID tenant = inv.getArgument(1);
            if (t == null || !tenant.equals(t.getTenantId())) {
                return Optional.empty();
            }
            return Optional.of(t);
        });
        when(templateRepository.findByTenantId(any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            var pageable = inv.getArgument(1, org.springframework.data.domain.Pageable.class);
            var items = templates.values().stream()
                    .filter(t -> tenant.equals(t.getTenantId()))
                    .toList();
            return new PageImpl<>(items, pageable, items.size());
        });
        when(workflowStepRepository.save(any(WorkflowStep.class))).thenAnswer(inv -> {
            WorkflowStep s = inv.getArgument(0);
            if (s.getId() == null) {
                s.setId(UUID.randomUUID());
            }
            workflowSteps.put(s.getId(), s);
            return s;
        });
        when(workflowStepRepository.findByWorkflowTemplateIdOrderByStepNumberAsc(any()))
                .thenAnswer(inv -> {
                    UUID templateId = inv.getArgument(0);
                    return workflowSteps.values().stream()
                            .filter(s -> templateId.equals(s.getWorkflowTemplateId()))
                            .sorted(Comparator.comparing(WorkflowStep::getStepNumber))
                            .toList();
                });
    }
}
