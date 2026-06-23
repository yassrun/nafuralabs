package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SituationFactureSummaryDto {

    private String id;
    private String numero;
    private String clientId;
    private String clientName;
    private String chantierId;
    private String chantierCode;
    private String situationId;
    private String situationNumero;
    private LocalDate dateEmission;
    private LocalDate dateEcheance;
    private BigDecimal totalHt;
    private BigDecimal retenueGarantieTaux;
    private BigDecimal retenueGarantieMontant;
    private BigDecimal netAPayerHt;
    private BigDecimal tvaTaux;
    private BigDecimal totalTva;
    private BigDecimal netAPayerTtc;
    private String status;
}
