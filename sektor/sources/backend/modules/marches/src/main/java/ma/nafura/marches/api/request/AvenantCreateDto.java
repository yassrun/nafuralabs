package ma.nafura.marches.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class AvenantCreateDto {

    private String id;

    private String numero;

    @NotBlank
    private String contratMarcheId;

    private String type;

    @NotBlank
    private String objet;

    private String motif;

    private BigDecimal montantHt;

    private Integer prolongationJours;

    private LocalDate dateSignature;

    private String status;
}
