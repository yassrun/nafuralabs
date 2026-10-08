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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
            String permission = def.getApproverPermission();
            if (permission == null || permission.isBlank()) {
                throw new IllegalArgumentException("Approval step needs an approver permission");
            }
            ApprovalStep step = ApprovalStep.builder()
                    .tenantId(tenantId)
                    .approvalRequestId(request.getId())
                    .stepNumber(def.getStepNumber())
                    .approverPermission(permission.trim())
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
        requireApprover(current, request);
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
        requireApprover(current, request);
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
                .collect(Collectors.toMap(ApprovalStep::getApprovalRequestId, ApprovalStep::getApproverPermission, (a, b) -> a));
        String me = UserContext.getUserEmail();
        List<ApprovalRequest> requests = requestRepository.findByTenantIdAndIdInOrderByRequestedAtAsc(tenantId, requestIds);
        return requests.stream()
                .filter(r -> STATUS_PENDING.equals(r.getStatus()))
                .filter(r -> me == null || !me.equalsIgnoreCase(r.getRequestedBy()))
                .map(r -> toDashboardItem(r, requestIdToStepName.get(r.getId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getPendingCountForCurrentUser() {
        return getPendingForCurrentUser().size();
    }

    /** Steps waiting on a permission the user holds (or a designated approver id). */
    private List<ApprovalStep> pendingStepsForCurrentUser(UUID tenantId) {
        UUID userId = UserContext.getUserIdOrNull();
        return stepRepository.findByTenantIdAndStatus(tenantId, STATUS_PENDING).stream()
                .filter(step -> canSeeStep(step, userId))
                .toList();
    }

    private static boolean canSeeStep(ApprovalStep step, UUID userId) {
        if (step.getApproverId() != null && userId != null && step.getApproverId().equals(userId)) {
            return true;
        }
        String permission = step.getApproverPermission();
        return permission != null && !permission.isBlank() && UserContext.hasPermission(permission);
    }

    /** Permission checked at decision time; the requester never decides their own request. */
    private static void requireApprover(ApprovalStep step, ApprovalRequest request) {
        if (step == null) {
            return;
        }
        String me = UserContext.getUserEmail();
        if (me != null && request.getRequestedBy() != null && me.equalsIgnoreCase(request.getRequestedBy())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot approve your own request");
        }
        UUID userId = UserContext.getUserIdOrNull();
        if (step.getApproverId() != null && userId != null && step.getApproverId().equals(userId)) {
            return;
        }
        String permission = step.getApproverPermission();
        if (permission == null || permission.isBlank() || !UserContext.hasPermission(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not an approver of this step");
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
