package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

/**
 * Saisie d'avancement sur activité (AC-9).
 * Avec rattachement : {@code quantiteRealisee} (+ {@code rattachementId} si plusieurs nœuds).
 * Sans nœud : {@code avancementPercent}.
 */
@Data
public class ActiviteAvancementCreateDto {

    @NotNull
    private LocalDate date;

    private String rattachementId;

    private BigDecimal quantiteRealisee;

    private BigDecimal avancementPercent;

    private String notes;

    @NotBlank
    private String saisieParId;

    private String saisieParName;

    private String status;
}
