package ma.nafura.achats.api.request;

import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class CatalogueFournisseurLigneUpdateDto {

    private UUID fournisseurId;

    private UUID articleId;

    @Size(max = 100)
    private String refFournisseur;

    @Size(max = 255)
    private String designation;

    private BigDecimal prixUnitaireHt;

    private UUID uomId;

    private BigDecimal conditionnementQuantite;

    private UUID conditionnementUomId;

    private Boolean actif;

    private UUID currencyId;

    private LocalDate validFrom;

    private LocalDate validTo;

    private BigDecimal remisePercent;

    private BigDecimal quantiteMin;

    private Integer delaiJours;

    @Size(max = 20)
    private String source;

    private UUID sourceRefId;

    @Size(max = 20)
    private String incoterm;
}
