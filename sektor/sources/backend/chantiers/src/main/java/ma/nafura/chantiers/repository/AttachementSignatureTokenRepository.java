package ma.nafura.chantiers.repository;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.attachement.AttachementSignatureToken;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Lookup par hash — pas de scope tenant : le jeton est le secret (AC-19). Le tenant n'est connu
 * qu'une fois le jeton résolu ; {@code TenantContext} est posé après, jamais avant.
 */
public interface AttachementSignatureTokenRepository extends JpaRepository<AttachementSignatureToken, UUID> {

    Optional<AttachementSignatureToken> findByTokenHash(String tokenHash);
}
