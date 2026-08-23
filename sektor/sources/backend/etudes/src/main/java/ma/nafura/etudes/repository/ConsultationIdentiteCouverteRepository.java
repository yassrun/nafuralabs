package ma.nafura.etudes.repository;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.consultation.ConsultationIdentiteCouverte;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultationIdentiteCouverteRepository
        extends JpaRepository<ConsultationIdentiteCouverte, ConsultationIdentiteCouverte.Pk> {

    List<ConsultationIdentiteCouverte> findByConsultationId(UUID consultationId);

    boolean existsByConsultationIdAndCleStable(UUID consultationId, String cleStable);
}
