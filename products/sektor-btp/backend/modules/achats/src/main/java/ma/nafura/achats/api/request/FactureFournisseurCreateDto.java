package ma.nafura.achats.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class FactureFournisseurCreateDto {

    private String numeroFournisseur;

    @NotBlank
    private String fournisseurId;

    private String fournisseurName;

    private UUID bcId;
    private String bcNumero;
    private String chantierId;
    private String chantierName;
    private String rubrique;

    @NotNull
    private LocalDate dateFacture;

    private LocalDate dateReception;

    @NotNull
    private LocalDate dateEcheance;

    private String status;
    private String notes;

    @NotEmpty
    @Valid
    private List<FactureFournisseurLigneInputDto> lignes;
}
