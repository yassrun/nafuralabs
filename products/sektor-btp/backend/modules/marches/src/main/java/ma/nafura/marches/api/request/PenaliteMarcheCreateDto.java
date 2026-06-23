package ma.nafura.marches.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class PenaliteMarcheCreateDto {

    private String id;

    private String numero;

    @NotBlank
    private String contratMarcheId;

    @NotBlank
    private String type;

    private String motif;

    private BigDecimal montantHt;

    private Integer joursRetard;

    private LocalDate dateConstat;

    private String status;
}
