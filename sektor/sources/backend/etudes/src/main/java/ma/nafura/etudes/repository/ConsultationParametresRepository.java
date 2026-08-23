package ma.nafura.etudes.repository;

import java.util.UUID;
import ma.nafura.etudes.domain.consultation.ConsultationParametres;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultationParametresRepository
        extends JpaRepository<ConsultationParametres, UUID> {}
