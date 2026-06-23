package ma.nafura.platform.configuration.sysconfig.repository;

import ma.nafura.platform.configuration.sysconfig.domain.model.Calendar;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for Calendar entity.
 * Generated once — add custom queries here.
 */
@Repository
public interface CalendarRepository extends TenantScopedRepository<Calendar, UUID> {
}


