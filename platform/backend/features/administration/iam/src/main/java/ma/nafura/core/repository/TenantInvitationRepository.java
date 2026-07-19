package ma.nafura.platform.administration.iam.repository;

import ma.nafura.platform.administration.iam.domain.model.TenantInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantInvitationRepository extends JpaRepository<TenantInvitation, UUID> {

    Optional<TenantInvitation> findByTokenJti(UUID tokenJti);

    List<TenantInvitation> findByTenantIdAndUserIdAndStatus(UUID tenantId, UUID userId, String status);

    Optional<TenantInvitation> findFirstByTenantIdAndUserIdAndStatusOrderByCreatedAtDesc(
        UUID tenantId,
        UUID userId,
        String status
    );
}
