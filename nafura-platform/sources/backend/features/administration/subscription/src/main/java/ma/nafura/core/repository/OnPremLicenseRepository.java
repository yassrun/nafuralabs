package ma.nafura.platform.subscription.repository;

import ma.nafura.platform.subscription.domain.model.LicenseStatus;
import ma.nafura.platform.subscription.domain.model.OnPremLicense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OnPremLicenseRepository extends JpaRepository<OnPremLicense, UUID> {

    Optional<OnPremLicense> findFirstByApplicationIdAndAssignmentIdAndStatusOrderByUpdatedAtDesc(
        String applicationId,
        UUID assignmentId,
        LicenseStatus status
    );
}

