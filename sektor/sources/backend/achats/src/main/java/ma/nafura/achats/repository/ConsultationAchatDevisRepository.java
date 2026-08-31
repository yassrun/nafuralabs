package ma.nafura.achats.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.consultation.ConsultationAchatDevis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationAchatDevisRepository extends JpaRepository<ConsultationAchatDevis, UUID> {

    List<ConsultationAchatDevis> findByConsultationIdOrderByCreatedAtAsc(UUID consultationId);

    Optional<ConsultationAchatDevis> findByDestinataireId(UUID destinataireId);

    long countByConsultationId(UUID consultationId);

    List<ConsultationAchatDevis> findByConsultationIdIn(Collection<UUID> consultationIds);

    @Query("SELECT COUNT(d) FROM ConsultationAchatDevis d WHERE d.consultationId IN :ids")
    long countByConsultationIdIn(@Param("ids") Collection<UUID> ids);

    @Query(
            "SELECT d.consultationId, COUNT(d) FROM ConsultationAchatDevis d "
                    + "WHERE d.consultationId IN :ids GROUP BY d.consultationId")
    List<Object[]> countGroupedByConsultationIds(@Param("ids") Collection<UUID> ids);
}
