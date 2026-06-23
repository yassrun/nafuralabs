package ma.nafura.ventes.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class FactureClientCreateDto {

    private String type;

    @NotBlank
    private String clientId;

    private String clientName;

    private String bccId;

    private String chantierId;

    private String chantierCode;

    @NotNull
    private LocalDate dateEmission;

    @NotNull
    private LocalDate dateEcheance;

    private String modePaiement;

    private BigDecimal tvaTaux;

    private BigDecimal retenueGarantieTaux;

    private BigDecimal resorptionAvanceMontant;

    private Boolean marchePublic;

    private String status;

    private String notes;

    @Valid
    private List<FactureClientLigneInputDto> lignes = new ArrayList<>();
}
