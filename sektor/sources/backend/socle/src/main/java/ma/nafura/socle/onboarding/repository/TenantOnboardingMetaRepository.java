package ma.nafura.socle.onboarding.repository;

import java.util.UUID;
import ma.nafura.socle.onboarding.domain.TenantOnboardingMeta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantOnboardingMetaRepository extends JpaRepository<TenantOnboardingMeta, UUID> {
}
