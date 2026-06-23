package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class ChantierPhaseCreateDto {

    private String id;

    @NotBlank
    private String code;

    @NotBlank
    private String designation;

    private String lotId;

    @NotNull
    private LocalDate dateDebut;

    @NotNull
    private LocalDate dateFin;

    private List<String> dependances;

    private String responsableId;

    private String responsableName;

    private String equipeName;

    private BigDecimal quantite;

    private String unite;

    private BigDecimal avancementPercent;

    private String status;

    private Integer ordre;
}
