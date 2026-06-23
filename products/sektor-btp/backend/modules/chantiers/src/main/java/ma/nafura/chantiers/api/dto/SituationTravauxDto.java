package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SituationTravauxDto {

    private String id;
    private String chantierId;
    private String chantierCode;
    private String chantierName;
    private String numero;
    private int numeroOrdre;
    private LocalDate datePeriodeDebut;
    private LocalDate datePeriodeFin;
    private LocalDate dateEmission;
    private BigDecimal cumulPrecedentHt;
    private BigDecimal cumulCourantHt;
    private BigDecimal travauxPeriodeHt;
    private BigDecimal retenueGarantiePercent;
    private BigDecimal retenueGarantieMontant;
    private BigDecimal retenueAvancePercent;
    private BigDecimal retenueAvanceMontant;
    private BigDecimal netAPayerHt;
    private BigDecimal tvaTaux;
    private BigDecimal netAPayerTtc;
    private String status;
    private String factureId;
    private String approbateurMOAName;
    private LocalDate approbationDate;
    private String motifRejet;
    private String notes;
    private int nbLignes;
    private List<SituationLigneDto> lignes;
}
