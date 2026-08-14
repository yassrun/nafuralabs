package ma.nafura.erp.onboarding.repository;

import java.util.UUID;
import ma.nafura.erp.onboarding.domain.TenantOnboardingMeta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantOnboardingMetaRepository extends JpaRepository<TenantOnboardingMeta, UUID> {
}
