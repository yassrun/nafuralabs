package ma.nafura.chantiers.api.request;

import java.math.BigDecimal;
import lombok.Data;

/**
 * Correction d'une ligne du BDP chiffré du chantier.
 *
 * <p>{@code nature} fait entrer la ligne au bordereau ({@code VENDU}, quantité et prix exigés) ou
 * l'en sort ({@code INTERNE}, prix de vente effacé). Absent = nature inchangée. Une ligne copiée du
 * devis garde son origine : sa nature ne se convertit pas.
 */
@Data
public class LigneBdpUpdateDto {

    private String designation;

    private String unite;

    private BigDecimal quantite;

    private BigDecimal prixUnitaireHt;

    private BigDecimal montantHt;

    private String nature;
}
