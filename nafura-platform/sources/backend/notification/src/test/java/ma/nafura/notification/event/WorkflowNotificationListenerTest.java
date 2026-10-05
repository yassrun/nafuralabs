package ma.nafura.platform.collaboration.notification.event;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ma.nafura.platform.authorization.domain.model.TenantUserRole;
import ma.nafura.platform.authorization.repository.TenantUserRoleRepository;
import ma.nafura.platform.collaboration.notification.service.NotificationRouter;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalRequest;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalStep;
import ma.nafura.platform.collaboration.workflow.event.ApprovalStateChangedEvent;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalRequestRepository;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalStepRepository;
import ma.nafura.platform.framework.record.LifecycleEngine;
import ma.nafura.platform.identity.domain.model.AppUser;
import ma.nafura.platform.identity.repository.AppUserRepository;

@ExtendWith(MockitoExtension.class)
class WorkflowNotificationListenerTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID REQUEST = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID ENTITY = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID LEAD = UUID.fromString("44444444-4444-4444-4444-444444444444");
    private static final UUID AUTHOR = UUID.fromString("55555555-5555-5555-5555-555555555555");

    @Mock NotificationRouter router;
    @Mock ApprovalRequestRepository approvalRequestRepository;
    @Mock ApprovalStepRepository approvalStepRepository;
    @Mock AppUserRepository appUserRepository;
    @Mock TenantUserRoleRepository memberships;
    @Mock LifecycleEngine lifecycles;

    @Test
    void pendingStepByRoleNotifiesRoleMembers() {
        ApprovalRequest request = ApprovalRequest.builder()
                .id(REQUEST)
                .tenantId(TENANT)
                .entityType("demo.purchase-request")
                .entityId(ENTITY)
                .title("Demande d’achat : Serveurs")
                .status("PENDING")
                .requestedBy("admin@host.local")
                .build();
        when(approvalRequestRepository.findByIdAndTenantId(REQUEST, TENANT)).thenReturn(Optional.of(request));
        when(approvalStepRepository.findByApprovalRequestIdOrderByStepNumberAsc(REQUEST)).thenReturn(List.of(
                ApprovalStep.builder().status("PENDING").approverRole("DEMO_LEAD").build()));
        when(memberships.findByTenantIdAndRoleCode(TENANT, "DEMO_LEAD")).thenReturn(List.of(
                TenantUserRole.builder().tenantId(TENANT).userId(LEAD).roleCode("DEMO_LEAD").build(),
                TenantUserRole.builder().tenantId(TENANT).userId(AUTHOR).roleCode("DEMO_LEAD").build()));
        when(appUserRepository.findByEmailIgnoreCase("admin@host.local")).thenReturn(
                Optional.of(AppUser.builder().id(AUTHOR).email("admin@host.local").build()));

        listener().onApprovalStateChanged(new ApprovalStateChangedEvent(
                this, TENANT, REQUEST, "demo.purchase-request", ENTITY, "PENDING", "admin@host.local"));

        verify(router).send(argThat(message ->
                message.event().equals("platform.approval.requested")
                        && message.recipientId().equals(LEAD)
                        && "/approvals".equals(message.actionUrl())));
        verify(router, never()).send(argThat(message -> AUTHOR.equals(message.recipientId())));
    }

    @Test
    void pendingStepByUserIdStillNotifiesThatUser() {
        ApprovalRequest request = ApprovalRequest.builder()
                .id(REQUEST)
                .tenantId(TENANT)
                .entityType("demo.purchase-request")
                .entityId(ENTITY)
                .title("Demande")
                .status("PENDING")
                .requestedBy("admin@host.local")
                .build();
        when(approvalRequestRepository.findByIdAndTenantId(REQUEST, TENANT)).thenReturn(Optional.of(request));
        when(approvalStepRepository.findByApprovalRequestIdOrderByStepNumberAsc(REQUEST)).thenReturn(List.of(
                ApprovalStep.builder().status("PENDING").approverId(LEAD).approverRole("DEMO_LEAD").build()));
        when(appUserRepository.findByEmailIgnoreCase("admin@host.local")).thenReturn(Optional.empty());

        listener().onApprovalStateChanged(new ApprovalStateChangedEvent(
                this, TENANT, REQUEST, "demo.purchase-request", ENTITY, "PENDING", "admin@host.local"));

        verify(router).send(argThat(message -> message.recipientId().equals(LEAD)));
        verify(memberships, never()).findByTenantIdAndRoleCode(any(), any());
    }

    private WorkflowNotificationListener listener() {
        return new WorkflowNotificationListener(
                router, approvalRequestRepository, approvalStepRepository, appUserRepository, memberships, lifecycles);
    }
}
