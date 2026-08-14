package ma.nafura.platform.configuration.sysconfig.repository;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.configuration.sysconfig.domain.model.NumberingSequence;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for NumberingSequence entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface NumberingSequenceRepository extends TenantScopedRepository<NumberingSequence, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ns FROM NumberingSequence ns WHERE ns.code = :code AND ns.tenantId = :tenantId")
    Optional<NumberingSequence> findByCodeAndTenantIdForUpdate(
        @Param("code") String code,
        @Param("tenantId") UUID tenantId
    );
}


