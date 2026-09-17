package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import lombok.Data;

/**
 * Création d'une ligne du BDP chiffré du chantier.
 *
 * <p>Une ligne vendue porte une quantité et un prix unitaire ; sans prix elle reste interne. Le lot
 * d'accueil doit appartenir au chantier — un lot étranger est refusé, jamais rattaché en silence.
 */
@Data
public class LigneBdpCreateDto {

    @NotBlank
    private String lotId;

    private String code;

    @NotBlank
    private String designation;

    /** {@code VENDU} fait entrer la ligne au bordereau ; absent ou {@code INTERNE} = ligne interne. */
    private String nature;

    private String unite;

    private BigDecimal quantite;

    private BigDecimal prixUnitaireHt;

    private BigDecimal montantHt;

    private Integer ordre;
}
