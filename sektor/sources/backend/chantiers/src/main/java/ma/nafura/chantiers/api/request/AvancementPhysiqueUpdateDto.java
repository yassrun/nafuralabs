package ma.nafura.chantiers.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class AvancementPhysiqueUpdateDto {

    private LocalDate date;

    private BigDecimal quantiteRealisee;

    /** Interdit en entrée (AC-1) — le pourcentage se calcule à la lecture. */
    private BigDecimal pourcentage;

    private String notes;

    private String status;
}
