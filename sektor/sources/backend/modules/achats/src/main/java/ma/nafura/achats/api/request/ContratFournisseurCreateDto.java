package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ContratFournisseurCreateDto {

    private String type;

    @NotBlank
    private String fournisseurId;

    private String chantierId;

    @NotNull
    private LocalDate dateDebut;

    @NotNull
    private LocalDate dateFin;

    private String status;

    private BigDecimal montantHt;

    private Boolean art187Declare;

    private Boolean art187ValideMoa;

    private BigDecimal retenueGarantieTaux;

    private Boolean paiementDirectMoa;

    private String notes;
}
