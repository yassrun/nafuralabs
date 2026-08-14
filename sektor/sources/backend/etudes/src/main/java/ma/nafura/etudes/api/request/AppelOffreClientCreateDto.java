package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class AppelOffreClientCreateDto {

    @NotBlank
    private String reference;

    @NotBlank
    private String objet;

    @NotBlank
    private String donneurOrdre;

    @NotBlank
    private String type;

    @NotNull
    private LocalDate dateLimiteDepot;

    private LocalDate dateOuverturePlis;
    private BigDecimal cautionProvisoire;
    private BigDecimal cautionDefinitive;
    private BigDecimal cautionRetenueGarantie;
    private BigDecimal estimationMoaHt;
    private String ville;
    private Integer delaiExecutionJours;
    private String status;
    private String devisId;
    private String devisNumero;
    private String metreId;
    private String metreNumero;
    private Integer resultatRangNotre;
    private Integer resultatNbPlis;
    private String resultatAttributaire;
    private BigDecimal resultatMontantHt;
    private String notes;
}
