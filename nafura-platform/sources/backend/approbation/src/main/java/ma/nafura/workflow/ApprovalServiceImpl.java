package ma.nafura.platform.collaboration.workflow;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.collaboration.workflow.api.ApprovalDashboardItem;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalRequest;
import ma.nafura.platform.collaboration.workflow.domain.model.ApprovalStep;
import ma.nafura.platform.collaboration.workflow.event.ApprovalStateChangedEvent;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalRequestRepository;
import ma.nafura.platform.collaboration.workflow.repository.ApprovalStepRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApprovalServiceImpl implements ApprovalService {

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_REJECTED = "REJECTED";

    private final ApprovalRequestRepository requestRepository;
    private final ApprovalStepRepository stepRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Override
    @Transactional
    public ApprovalRequest requestApproval(String entityType, UUID entityId, String title, List<ApprovalStepDefinition> workflow) {
        UUID tenantId = TenantContext.getTenantId();
        String requestedBy = UserContext.getUserEmail();
        if (requestedBy == null) {
            requestedBy = "system";
        }
        OffsetDateTime now = OffsetDateTime.now();
        ApprovalRequest request = ApprovalRequest.builder()
                .tenantId(tenantId)
                .entityType(entityType)
                .entityId(entityId)
                .title(title != null ? title : "Approval request")
                .status(STATUS_PENDING)
                .currentStep(workflow.isEmpty() ? null : "step_1")
                .requestedBy(requestedBy)
                .requestedAt(now)
                .build();
        request = requestRepository.save(request);
        for (ApprovalStepDefinition def : workflow) {
            ApprovalStep step = ApprovalStep.builder()
                    .tenantId(tenantId)
                    .approvalRequestId(request.getId())
                    .stepNumber(def.getStepNumber())
                    .approverRole(def.getApproverRole() != null ? def.getApproverRole() : "approver")
                    .approverId(def.getApproverId())
                    .status(STATUS_PENDING)
                    .build();
            stepRepository.save(step);
        }

        applicationEventPublisher.publishEvent(
                new ApprovalStateChangedEvent(
                        this,
                        tenantId,
                        request.getId(),
                        request.getEntityType(),
                        request.getEntityId(),
                        request.getStatus(),
                        requestedBy
                )
        );
        return request;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ApprovalRequest> listByEntity(String entityType, UUID entityId, Pageable pageable) {
        UUID tenantId = TenantContext.getTenantId();
        return requestRepository.findByTenantIdAndEntityTypeAndEntityIdOrderByRequestedAtDesc(
                tenantId, entityType, entityId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalRequest> findPendingByEntity(String entityType, UUID entityId) {
        UUID tenantId = TenantContext.getTenantId();
        return requestRepository.findByTenantIdAndEntityTypeAndEntityId(tenantId, entityType, entityId)
                .stream()
                .filter(r -> STATUS_PENDING.equals(r.getStatus()))
                .toList();
    }

    @Override
    @Transactional
    public void approve(UUID approvalRequestId, String comment) {
        UUID tenantId = TenantContext.getTenantId();
        ApprovalRequest request = requestRepository.findByIdAndTenantId(approvalRequestId, tenantId)
                .orElseThrow(() -> new CrudNotFoundException("Approval request not found: " + approvalRequestId));
        if (!STATUS_PENDING.equals(request.getStatus())) {
            throw new IllegalStateException("Approval request is not pending");
        }
        List<ApprovalStep> steps = stepRepository.findByApprovalRequestIdOrderByStepNumberAsc(approvalRequestId);
        ApprovalStep current = steps.stream().filter(s -> STATUS_PENDING.equals(s.getStatus())).findFirst().orElse(null);
        requireApprover(current);
        if (current != null) {
            current.setStatus(STATUS_APPROVED);
            current.setDecidedAt(OffsetDateTime.now());
            current.setComment(comment);
            stepRepository.save(current);
        }
        boolean allApproved = steps.stream().allMatch(s -> STATUS_APPROVED.equals(s.getStatus()));
        if (allApproved) {
            request.setStatus(STATUS_APPROVED);
            request.setApprovedBy(UserContext.getUserEmail());
            request.setApprovedAt(OffsetDateTime.now());
            request.setDecisionComment(comment);
        }
        requestRepository.save(request);

        applicationEventPublisher.publishEvent(
                new ApprovalStateChangedEvent(
                        this,
                        tenantId,
                        request.getId(),
                        request.getEntityType(),
                        request.getEntityId(),
                        request.getStatus(),
                        UserContext.getUserEmail()
                )
        );
    }

    @Override
    @Transactional
    public void reject(UUID approvalRequestId, String comment) {
        UUID tenantId = TenantContext.getTenantId();
        ApprovalRequest request = requestRepository.findByIdAndTenantId(approvalRequestId, tenantId)
                .orElseThrow(() -> new CrudNotFoundException("Approval request not found: " + approvalRequestId));
        if (!STATUS_PENDING.equals(request.getStatus())) {
            throw new IllegalStateException("Approval request is not pending");
        }
        ApprovalStep current = stepRepository.findByApprovalRequestIdOrderByStepNumberAsc(approvalRequestId).stream()
                .filter(s -> STATUS_PENDING.equals(s.getStatus())).findFirst().orElse(null);
        requireApprover(current);
        if (current != null) {
            current.setStatus(STATUS_REJECTED);
            current.setDecidedAt(OffsetDateTime.now());
            current.setComment(comment);
            stepRepository.save(current);
        }
        request.setStatus(STATUS_REJECTED);
        request.setApprovedBy(UserContext.getUserEmail());
        request.setApprovedAt(OffsetDateTime.now());
        request.setDecisionComment(comment);
        requestRepository.save(request);

        applicationEventPublisher.publishEvent(
                new ApprovalStateChangedEvent(
                        this,
                        tenantId,
                        request.getId(),
                        request.getEntityType(),
                        request.getEntityId(),
                        request.getStatus(),
                        UserContext.getUserEmail()
                )
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalDashboardItem> getPendingForCurrentUser() {
        UUID tenantId = TenantContext.getTenantId();
        List<ApprovalStep> steps = pendingStepsForCurrentUser(tenantId);
        List<UUID> requestIds = steps.stream()
                .map(ApprovalStep::getApprovalRequestId)
                .distinct()
                .toList();
        if (requestIds.isEmpty()) {
            return List.of();
        }
        Map<UUID, String> requestIdToStepName = steps.stream()
                .collect(Collectors.toMap(ApprovalStep::getApprovalRequestId, ApprovalStep::getApproverRole, (a, b) -> a));
        List<ApprovalRequest> requests = requestRepository.findByTenantIdAndIdInOrderByRequestedAtAsc(tenantId, requestIds);
        return requests.stream()
                .filter(r -> STATUS_PENDING.equals(r.getStatus()))
                .map(r -> toDashboardItem(r, requestIdToStepName.get(r.getId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getPendingCountForCurrentUser() {
        UUID tenantId = TenantContext.getTenantId();
        List<UUID> requestIds = pendingStepsForCurrentUser(tenantId).stream()
                .map(ApprovalStep::getApprovalRequestId)
                .distinct()
                .toList();
        if (requestIds.isEmpty()) {
            return 0;
        }
        return requestRepository.findByTenantIdAndIdInOrderByRequestedAtAsc(tenantId, requestIds).stream()
                .filter(r -> STATUS_PENDING.equals(r.getStatus()))
                .count();
    }

    /** Steps waiting on any role the user holds. */
    private List<ApprovalStep> pendingStepsForCurrentUser(UUID tenantId) {
        java.util.Set<String> roles = new java.util.HashSet<>(UserContext.getUserRoles());
        String primary = UserContext.getUserRole();
        if (primary != null && !primary.isBlank()) {
            roles.add(primary.trim().toUpperCase());
        }
        if (roles.isEmpty()) {
            return List.of();
        }
        return stepRepository.findByTenantIdAndStatusAndApproverRoleIn(tenantId, STATUS_PENDING, roles);
    }

    /** Only a holder of the step's role decides it. */
    private static void requireApprover(ApprovalStep step) {
        if (step != null && !UserContext.hasRole(step.getApproverRole()) && !UserContext.isSuperAdmin()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not an approver of this step");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalDashboardItem> getHistoryForCurrentUser() {
        UUID tenantId = TenantContext.getTenantId();
        String userEmail = UserContext.getUserEmail();
        if (userEmail == null || userEmail.isBlank()) {
            return List.of();
        }
        List<ApprovalRequest> requests = requestRepository.findByTenantIdAndApprovedByOrderByApprovedAtDesc(tenantId, userEmail);
        return requests.stream()
                .map(r -> toDashboardItem(r, r.getCurrentStep()))
                .toList();
    }

    private static ApprovalDashboardItem toDashboardItem(ApprovalRequest r, String currentStepLabel) {
        return ApprovalDashboardItem.builder()
                .id(r.getId())
                .entityType(r.getEntityType())
                .entityId(r.getEntityId())
                .title(r.getTitle())
                .status(r.getStatus())
                .currentStep(currentStepLabel != null ? currentStepLabel : r.getCurrentStep())
                .requestedBy(r.getRequestedBy())
                .requestedAt(r.getRequestedAt())
                .approvedBy(r.getApprovedBy())
                .approvedAt(r.getApprovedAt())
                .decisionComment(r.getDecisionComment())
                .build();
    }
}

