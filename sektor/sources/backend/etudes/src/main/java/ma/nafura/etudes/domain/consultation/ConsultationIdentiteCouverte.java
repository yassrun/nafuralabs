package ma.nafura.etudes.domain.consultation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Une identification d'identité dans l'étude — même {@code cle_stable} sur 3 postes = une ligne.
 */
@Entity
@Table(name = "consultation_identites_couvertes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ConsultationIdentiteCouverte.Pk.class)
public class ConsultationIdentiteCouverte {

    @Id
    @Column(name = "consultation_id", nullable = false)
    private UUID consultationId;

    @Id
    @Column(name = "cle_stable", nullable = false, length = 120)
    private String cleStable;

    @Column(name = "devis_consultation_id")
    private UUID devisConsultationId;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Pk implements Serializable {
        private UUID consultationId;
        private String cleStable;
    }
}
