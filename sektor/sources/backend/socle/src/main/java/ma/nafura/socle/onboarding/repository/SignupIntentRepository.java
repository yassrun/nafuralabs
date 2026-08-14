package ma.nafura.socle.onboarding.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.socle.onboarding.domain.SignupIntent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SignupIntentRepository extends JpaRepository<SignupIntent, UUID> {

    Optional<SignupIntent> findByEmailIgnoreCase(String email);
}
