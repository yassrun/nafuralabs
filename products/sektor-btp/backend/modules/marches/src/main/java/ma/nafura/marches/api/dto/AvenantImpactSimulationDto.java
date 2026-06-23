package ma.nafura.marches.api.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AvenantImpactSimulationDto {

    private String avenantId;
    private String contratMarcheId;
    private BigDecimal montantHtActuel;
    private BigDecimal deltaMontantHt;
    private BigDecimal montantHtApres;
    private Integer dureeMoisActuelle;
    private Integer deltaDureeMois;
    private Integer dureeMoisApres;
    private Integer prolongationJours;
    private boolean dejaPropage;
}
