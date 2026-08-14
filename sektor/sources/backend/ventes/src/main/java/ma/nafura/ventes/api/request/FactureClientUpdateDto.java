package ma.nafura.ventes.api.request;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class FactureClientUpdateDto {

    private String type;

    private String clientId;

    private String clientName;

    private String bccId;

    private String chantierId;

    private String chantierCode;

    private LocalDate dateEmission;

    private LocalDate dateEcheance;

    private String modePaiement;

    private BigDecimal tvaTaux;

    private BigDecimal retenueGarantieTaux;

    private BigDecimal resorptionAvanceMontant;

    private Boolean marchePublic;

    private String status;

    private String notes;

    @Valid
    private List<FactureClientLigneInputDto> lignes;
}
