package ma.nafura.etudes.service.port;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NoOpEtudeApprovalPortConfig {

    @Bean
    @ConditionalOnMissingBean(EtudeApprovalPort.class)
    public EtudeApprovalPort noOpEtudeApprovalPort() {
        return new EtudeApprovalPort() {
            @Override
            public boolean isAvailable() {
                return false;
            }

            @Override
            public ApprovalSnapshot soumettre(
                    UUID dossierId,
                    String numero,
                    String resume,
                    BigDecimal montantHt,
                    String initiateurUserId,
                    String initiateurNom) {
                return new ApprovalSnapshot(null, "EN_ATTENTE", 0, 2, null, null);
            }

            @Override
            public ApprovalSnapshot approuverEtape(
                    String requestId, String userId, String userNom, String commentaire) {
                return new ApprovalSnapshot(requestId, "APPROUVE", 1, 2, null, null);
            }

            @Override
            public ApprovalSnapshot refuser(
                    String requestId, String userId, String userNom, String motif) {
                return new ApprovalSnapshot(requestId, "REJETE", 0, 2, null, null);
            }

            @Override
            public Optional<ApprovalSnapshot> trouverOuverte(UUID dossierId) {
                return Optional.empty();
            }
        };
    }
}
