package ma.nafura.platform.configuration.sysconfig.repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.configuration.sysconfig.domain.model.NumberingSequence;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NumberingSequenceRepository extends RecordRepository<NumberingSequence> {

    List<NumberingSequence> findByTenantId(UUID tenantId);

    long countByTenantId(UUID tenantId);

    boolean existsByTenantIdAndCodeIgnoreCase(UUID tenantId, String code);

    boolean existsByTenantIdAndCodeIgnoreCaseAndIdNot(UUID tenantId, String code, UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ns FROM NumberingSequence ns WHERE ns.code = :code AND ns.tenantId = :tenantId")
    Optional<NumberingSequence> findByCodeAndTenantIdForUpdate(
        @Param("code") String code,
        @Param("tenantId") UUID tenantId
    );
}
