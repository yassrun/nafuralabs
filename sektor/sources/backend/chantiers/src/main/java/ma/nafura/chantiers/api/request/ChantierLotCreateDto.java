package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class ChantierLotCreateDto {

    private String id;

    private String code;

    @NotBlank
    private String designation;

    private String parentLotId;

    /**
     * Nature demandée. Seul {@code INTERNE} est accepté : la copie depuis le devis validé est le
     * seul producteur de lignes vendues (AC-3). Absent = interne.
     */
    private String nature;

    private String unite;

    private BigDecimal quantite;

    private BigDecimal prixUnitaireHt;

    private BigDecimal montantHt;

    private BigDecimal avancementPercent;

    private Integer ordre;
}
