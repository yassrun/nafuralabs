package ma.nafura.bc.demo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<Note, UUID> {

    List<Note> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    Optional<Note> findByIdAndTenantId(UUID id, UUID tenantId);
}
