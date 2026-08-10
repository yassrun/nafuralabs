package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class CatalogueFournisseurLigneCreateDto {

    @NotNull
    private UUID fournisseurId;

    @NotNull
    private UUID articleId;

    @Size(max = 100)
    private String refFournisseur;

    @NotBlank
    @Size(max = 255)
    private String designation;

    @NotNull
    private BigDecimal prixUnitaireHt;

    /** Unité commerciale (optionnel). */
    private UUID uomId;

    /** Quantité dans le conditionnement (ex. 15). */
    private BigDecimal conditionnementQuantite;

    /** Unité du conditionnement (ex. L). */
    private UUID conditionnementUomId;

    private Boolean actif;

    private UUID currencyId;

    private LocalDate validFrom;

    private BigDecimal remisePercent;

    private BigDecimal quantiteMin;

    private Integer delaiJours;

    @Size(max = 20)
    private String source;

    private UUID sourceRefId;

    @Size(max = 20)
    private String incoterm;
}
