package ma.nafura.socle.onboarding.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.socle.onboarding.domain.UserOnboardingState;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserOnboardingStateRepository extends JpaRepository<UserOnboardingState, UUID> {

    Optional<UserOnboardingState> findByUserId(UUID userId);
}
