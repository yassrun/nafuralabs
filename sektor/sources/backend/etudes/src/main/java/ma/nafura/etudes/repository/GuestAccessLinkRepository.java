package ma.nafura.etudes.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.GuestAccessLink;
import org.springframework.data.jpa.repository.JpaRepository;

/** Lookup par hash — pas de scope tenant : le token est le secret. */
public interface GuestAccessLinkRepository extends JpaRepository<GuestAccessLink, UUID> {

    Optional<GuestAccessLink> findByTokenHash(String tokenHash);
}
