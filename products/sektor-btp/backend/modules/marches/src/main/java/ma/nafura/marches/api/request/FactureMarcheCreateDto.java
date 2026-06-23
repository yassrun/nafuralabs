package ma.nafura.marches.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class FactureMarcheCreateDto {

    private String id;

    private String numero;

    @NotBlank
    private String contratMarcheId;

    private BigDecimal montantBrutHt;
    private BigDecimal avanceDeduiteHt;
    private BigDecimal retenueGarantieHt;
    private BigDecimal netHt;
    private BigDecimal tvaTaux;
    private BigDecimal tvaMontant;
    private BigDecimal netTtc;
    private BigDecimal retenueSourceTaux;
    private BigDecimal retenueSourceMontant;
    private BigDecimal timbreFiscal;
    private BigDecimal netAPayer;
    private LocalDate dateEmission;
    private LocalDate dateEcheance;
    private String status;
}
