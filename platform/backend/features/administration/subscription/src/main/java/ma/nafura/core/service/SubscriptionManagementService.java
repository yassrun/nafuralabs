package ma.nafura.platform.subscription.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import ma.nafura.platform.subscription.api.request.UpgradePlanRequest;
import ma.nafura.platform.subscription.api.response.SubscriptionOverviewResponse;
import ma.nafura.platform.subscription.api.response.SubscriptionPlanResponse;
import ma.nafura.platform.subscription.api.response.SubscriptionUsageMetricResponse;
import ma.nafura.platform.subscription.domain.model.SubscriptionAssignment;
import ma.nafura.platform.subscription.domain.model.SubscriptionAssignmentOwnerType;
import ma.nafura.platform.subscription.domain.model.SubscriptionEntitlement;
import ma.nafura.platform.subscription.domain.model.SubscriptionPlan;
import ma.nafura.platform.subscription.domain.model.SubscriptionStatus;
import ma.nafura.platform.tenancy.domain.model.TenantDomain;
import ma.nafura.platform.subscription.repository.SubscriptionAssignmentRepository;
import ma.nafura.platform.subscription.repository.SubscriptionEntitlementRepository;
import ma.nafura.platform.subscription.repository.SubscriptionPlanRepository;
import ma.nafura.platform.tenancy.repository.TenantDomainRepository;
import ma.nafura.platform.tenancy.repository.TenantMembershipRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionManagementService {

    private static final String ENTITLEMENT_MEMBERS_MAX = "platform.members.max";
    private static final String ENTITLEMENT_DOMAINS_MAX = "platform.domains.max";

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionAssignmentRepository subscriptionAssignmentRepository;
    private final SubscriptionEntitlementRepository subscriptionEntitlementRepository;
    private final TenantMembershipRepository tenantMembershipRepository;
    private final TenantDomainRepository tenantDomainRepository;
    private final ObjectMapper objectMapper;

    @Value("${nafura.application.id:app}")
    private String applicationId;

    public SubscriptionOverviewResponse getOverview(UUID tenantId) {
        SubscriptionAssignment current = subscriptionAssignmentRepository
            .findFirstByApplicationIdAndOwnerTypeAndOwnerIdAndStatusOrderByUpdatedAtDesc(
                applicationId, SubscriptionAssignmentOwnerType.TENANT, tenantId, SubscriptionStatus.ACTIVE
            )
            .orElse(null);

        SubscriptionPlan currentPlan = current != null
            ? subscriptionPlanRepository.findByApplicationIdAndPlanCodeAndActiveTrue(applicationId, current.getPlanCode()).orElse(null)
            : null;

        List<SubscriptionPlan> availablePlans = subscriptionPlanRepository.findByApplicationIdAndActiveTrueOrderByPlanCode(applicationId);
        String currentPlanCode = current != null ? current.getPlanCode() : null;

        List<SubscriptionPlanResponse> planResponses = availablePlans.stream()
            .map(p -> toPlanResponse(p, currentPlanCode != null && currentPlanCode.equals(p.getPlanCode())))
            .toList();

        List<SubscriptionUsageMetricResponse> metrics = buildUsageMetrics(tenantId, currentPlanCode);

        return new SubscriptionOverviewResponse(
            currentPlan != null ? toPlanResponse(currentPlan, true) : null,
            planResponses,
            metrics
        );
    }

    @Transactional
    public void upgradePlan(UUID tenantId, UpgradePlanRequest request) {
        String planId = request.planId(); // treat as plan code (e.g. "professional")
        SubscriptionPlan targetPlan = subscriptionPlanRepository.findByApplicationIdAndPlanCodeAndActiveTrue(applicationId, planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        List<SubscriptionAssignment> current = subscriptionAssignmentRepository.findByApplicationIdAndOwnerTypeAndOwnerId(
            applicationId, SubscriptionAssignmentOwnerType.TENANT, tenantId
        );
        OffsetDateTime now = OffsetDateTime.now();
        for (SubscriptionAssignment a : current) {
            if (a.getStatus() == SubscriptionStatus.ACTIVE) {
                a.setStatus(SubscriptionStatus.CANCELED);
                a.setEndsAt(now);
                subscriptionAssignmentRepository.save(a);
            }
        }

        SubscriptionAssignment newAssignment = SubscriptionAssignment.builder()
            .applicationId(applicationId)
            .ownerType(SubscriptionAssignmentOwnerType.TENANT)
            .ownerId(tenantId)
            .planCode(targetPlan.getPlanCode())
            .status(SubscriptionStatus.ACTIVE)
            .startsAt(now)
            .build();
        subscriptionAssignmentRepository.save(newAssignment);
    }

    private List<SubscriptionUsageMetricResponse> buildUsageMetrics(UUID tenantId, String planCode) {
        List<SubscriptionUsageMetricResponse> metrics = new ArrayList<>();
        long memberCount = tenantMembershipRepository.countByTenantId(tenantId);
        long domainCount = tenantDomainRepository.findByTenantId(tenantId).stream()
            .filter(td -> "ACTIVE".equalsIgnoreCase(td.getStatus()))
            .count();
        Long memberLimit = planCode != null ? getEntitlementLimit(planCode, ENTITLEMENT_MEMBERS_MAX) : null;
        Long domainLimit = planCode != null ? getEntitlementLimit(planCode, ENTITLEMENT_DOMAINS_MAX) : null;
        metrics.add(new SubscriptionUsageMetricResponse("members", "Members", memberCount, memberLimit));
        metrics.add(new SubscriptionUsageMetricResponse("domains", "Active Domains", domainCount, domainLimit));
        return metrics;
    }

    private Long getEntitlementLimit(String planCode, String entitlementKey) {
        return subscriptionEntitlementRepository
            .findFirstByApplicationIdAndPlanCodeAndEntitlementKeyAndEnabledTrue(applicationId, planCode, entitlementKey)
            .map(SubscriptionEntitlement::getValueJson)
            .map(s -> {
                try {
                    int n = Integer.parseInt(s.trim());
                    return n < 0 ? null : (long) n;
                } catch (Exception e) {
                    return null;
                }
            })
            .orElse(null);
    }

    private SubscriptionPlanResponse toPlanResponse(SubscriptionPlan p, boolean isCurrent) {
        Double price = null;
        String currency = null;
        if (p.getMetadataJson() != null) {
            try {
                var map = objectMapper.readValue(p.getMetadataJson(), new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                if (map.get("pricePerMonth") instanceof Number) price = ((Number) map.get("pricePerMonth")).doubleValue();
                if (map.get("currency") instanceof String) currency = (String) map.get("currency");
            } catch (Exception ignored) {}
        }
        return new SubscriptionPlanResponse(
            p.getId().toString(),
            p.getName(),
            p.getDescription(),
            price,
            currency,
            isCurrent
        );
    }
}



