package ma.nafura.platform.configuration.sysconfig.repository;

import java.util.UUID;
import ma.nafura.platform.configuration.sysconfig.domain.model.ReferenceValue;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReferenceValueRepository extends RecordRepository<ReferenceValue> {

    boolean existsByTenantIdAndCodeListIdAndCodeIgnoreCase(UUID tenantId, UUID codeListId, String code);

    boolean existsByTenantIdAndCodeListIdAndCodeIgnoreCaseAndIdNot(
        UUID tenantId, UUID codeListId, String code, UUID id);
}
