package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PilotageMargeRowDto {
    private String chantierId;
    private String chantierCode;
    private String chantierNom;
    private String status;
    private BigDecimal montantMarcheHt;
    private BigDecimal cumulFactureHt;
    private BigDecimal pctFacture;
    private BigDecimal avancementPercent;
    private BigDecimal margeProjeteeHt;
    private BigDecimal margePct;
}
