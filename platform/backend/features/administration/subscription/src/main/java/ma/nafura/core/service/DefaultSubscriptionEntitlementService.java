package ma.nafura.platform.subscription.service;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.subscription.domain.model.EntitlementValueType;
import ma.nafura.platform.subscription.domain.model.LicenseStatus;
import ma.nafura.platform.subscription.domain.model.OnPremLicense;
import ma.nafura.platform.subscription.domain.model.SubscriptionAssignment;
import ma.nafura.platform.subscription.domain.model.SubscriptionAssignmentOwnerType;
import ma.nafura.platform.subscription.domain.model.SubscriptionDeliveryModel;
import ma.nafura.platform.subscription.domain.model.SubscriptionEntitlement;
import ma.nafura.platform.subscription.domain.model.SubscriptionPlan;
import ma.nafura.platform.subscription.domain.model.SubscriptionStatus;
import ma.nafura.platform.subscription.repository.OnPremLicenseRepository;
import ma.nafura.platform.subscription.repository.SubscriptionAssignmentRepository;
import ma.nafura.platform.subscription.repository.SubscriptionEntitlementRepository;
import ma.nafura.platform.subscription.repository.SubscriptionPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DefaultSubscriptionEntitlementService implements SubscriptionEntitlementService {

    private final SubscriptionAssignmentRepository assignmentRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionEntitlementRepository entitlementRepository;
    private final OnPremLicenseRepository onPremLicenseRepository;

    @Override
    public boolean isEntitled(String applicationId, SubscriptionAssignmentOwnerType ownerType, UUID ownerId, String entitlementKey) {
        Optional<SubscriptionEntitlement> entitlement = resolveEntitlement(applicationId, ownerType, ownerId, entitlementKey);
        if (entitlement.isEmpty()) {
            return false;
        }
        SubscriptionEntitlement item = entitlement.get();
        if (item.getValueType() == EntitlementValueType.BOOLEAN) {
            return Boolean.parseBoolean(item.getValueJson());
        }
        return item.isEnabled();
    }

    @Override
    public Optional<String> resolveEntitlementValue(
        String applicationId,
        SubscriptionAssignmentOwnerType ownerType,
        UUID ownerId,
        String entitlementKey
    ) {
        return resolveEntitlement(applicationId, ownerType, ownerId, entitlementKey)
            .map(SubscriptionEntitlement::getValueJson);
    }

    private Optional<SubscriptionEntitlement> resolveEntitlement(
        String applicationId,
        SubscriptionAssignmentOwnerType ownerType,
        UUID ownerId,
        String entitlementKey
    ) {
        Optional<SubscriptionAssignment> assignmentOpt = assignmentRepository
            .findFirstByApplicationIdAndOwnerTypeAndOwnerIdAndStatusOrderByUpdatedAtDesc(
                applicationId,
                ownerType,
                ownerId,
                SubscriptionStatus.ACTIVE
            );
        if (assignmentOpt.isEmpty()) {
            return Optional.empty();
        }

        SubscriptionAssignment assignment = assignmentOpt.get();
        if (!isWithinActiveWindow(assignment)) {
            return Optional.empty();
        }

        Optional<SubscriptionPlan> planOpt = planRepository
            .findByApplicationIdAndPlanCodeAndActiveTrue(applicationId, assignment.getPlanCode());
        if (planOpt.isEmpty()) {
            return Optional.empty();
        }

        SubscriptionPlan plan = planOpt.get();
        if (plan.getDeliveryModel() == SubscriptionDeliveryModel.ON_PREMISE && !hasValidOnPremLicense(applicationId, assignment.getId())) {
            return Optional.empty();
        }

        return entitlementRepository.findFirstByApplicationIdAndPlanCodeAndEntitlementKeyAndEnabledTrue(
            applicationId,
            assignment.getPlanCode(),
            entitlementKey
        );
    }

    private boolean hasValidOnPremLicense(String applicationId, UUID assignmentId) {
        Optional<OnPremLicense> licenseOpt = onPremLicenseRepository
            .findFirstByApplicationIdAndAssignmentIdAndStatusOrderByUpdatedAtDesc(
                applicationId,
                assignmentId,
                LicenseStatus.ACTIVE
            );
        if (licenseOpt.isEmpty()) {
            return false;
        }
        OnPremLicense license = licenseOpt.get();
        OffsetDateTime now = OffsetDateTime.now();
        if (license.getValidFrom() != null && now.isBefore(license.getValidFrom())) {
            return false;
        }
        if (license.getValidTo() != null && now.isAfter(license.getValidTo())) {
            return false;
        }
        return true;
    }

    private boolean isWithinActiveWindow(SubscriptionAssignment assignment) {
        OffsetDateTime now = OffsetDateTime.now();
        if (assignment.getStartsAt() != null && now.isBefore(assignment.getStartsAt())) {
            return false;
        }
        if (assignment.getEndsAt() != null && now.isAfter(assignment.getEndsAt())) {
            return false;
        }
        return true;
    }
}

