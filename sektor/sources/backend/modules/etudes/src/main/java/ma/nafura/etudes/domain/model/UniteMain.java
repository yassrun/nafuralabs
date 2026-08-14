package ma.nafura.etudes.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniteMain {

    @Column(name = "mo_heures", nullable = false, precision = 18, scale = 4)
    private BigDecimal heures;

    @Column(name = "mo_taux_horaire", nullable = false, precision = 18, scale = 4)
    private BigDecimal tauxHoraire;

    @Column(name = "mo_total", nullable = false, precision = 18, scale = 4)
    private BigDecimal total;
}
