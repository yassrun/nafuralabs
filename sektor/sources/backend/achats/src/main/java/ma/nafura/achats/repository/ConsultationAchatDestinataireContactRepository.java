package ma.nafura.achats.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.consultation.ConsultationAchatDestinataireContact;
import ma.nafura.platform.framework.repository.TenantScopedRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationAchatDestinataireContactRepository
        extends TenantScopedRepository<ConsultationAchatDestinataireContact, UUID> {

    List<ConsultationAchatDestinataireContact> findByDestinataireIdOrderByPositionAsc(UUID destinataireId);

    List<ConsultationAchatDestinataireContact> findByDestinataireIdInOrderByPositionAsc(
            Collection<UUID> destinataireIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ConsultationAchatDestinataireContact c where c.destinataireId = :destinataireId")
    void deleteByDestinataireId(@Param("destinataireId") UUID destinataireId);
}
