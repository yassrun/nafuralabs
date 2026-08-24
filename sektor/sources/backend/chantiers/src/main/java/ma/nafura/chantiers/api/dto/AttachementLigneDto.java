package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

/**
 * AC-12 — code, désignation et unité sont **lus sur le nœud** à chaque lecture, jamais recopiés.
 */
@Data
@Builder
public class AttachementLigneDto {

    private String id;
    private String noeudId;
    private String code;
    private String designation;
    private String unite;
    /** AC-11 — la quantité de la période, somme des déclarations du nœud. */
    private BigDecimal quantitePeriode;
    private BigDecimal prixUnitaireVendu;
    private BigDecimal montantHt;
    private String zoneId;
    private String zoneLibelle;
}
