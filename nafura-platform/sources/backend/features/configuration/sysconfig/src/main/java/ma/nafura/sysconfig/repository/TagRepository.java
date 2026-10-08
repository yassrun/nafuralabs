package ma.nafura.platform.configuration.sysconfig.repository;

import java.util.UUID;
import ma.nafura.platform.configuration.sysconfig.domain.model.Tag;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.stereotype.Repository;

@Repository("sysconfigTagRepository")
public interface TagRepository extends RecordRepository<Tag> {

    boolean existsByTenantIdAndCodeIgnoreCase(UUID tenantId, String code);

    boolean existsByTenantIdAndCodeIgnoreCaseAndIdNot(UUID tenantId, String code, UUID id);
}
