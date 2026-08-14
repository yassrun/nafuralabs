package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class AppelOffreClientUpdateDto {

    private String reference;
    private String objet;
    private String donneurOrdre;
    private String type;
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
