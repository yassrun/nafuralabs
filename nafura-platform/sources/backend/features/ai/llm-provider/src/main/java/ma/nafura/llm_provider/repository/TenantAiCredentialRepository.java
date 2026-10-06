package ma.nafura.platform.ai.llm.repository;

import ma.nafura.platform.ai.llm.domain.model.TenantAiCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantAiCredentialRepository extends JpaRepository<TenantAiCredential, UUID> {

    Optional<TenantAiCredential> findByTenantIdAndProvider(UUID tenantId, String provider);

    void deleteByTenantIdAndProvider(UUID tenantId, String provider);
}
