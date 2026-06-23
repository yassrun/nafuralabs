package ma.nafura.platform.scope.repository;

import ma.nafura.platform.scope.domain.model.AppScope;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppScopeRepository extends JpaRepository<AppScope, UUID> {

    Optional<AppScope> findByApplicationIdAndScopeKey(String applicationId, String scopeKey);
}

