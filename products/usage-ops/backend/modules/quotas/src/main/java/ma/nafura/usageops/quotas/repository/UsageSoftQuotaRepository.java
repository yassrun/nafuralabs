package ma.nafura.usageops.quotas.repository;

import ma.nafura.usageops.quotas.domain.UsageSoftQuota;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UsageSoftQuotaRepository extends JpaRepository<UsageSoftQuota, UUID> {
    List<UsageSoftQuota> findByEnabledTrue();
}
