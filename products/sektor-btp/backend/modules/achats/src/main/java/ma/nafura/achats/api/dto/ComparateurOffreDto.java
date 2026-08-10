package ma.nafura.achats.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

/** Ligne du comparateur fournisseurs (L11). */
@Data
@Builder
public class ComparateurOffreDto {

    private UUID ligneId;
    private UUID fournisseurId;
    private UUID articleId;
    private String designation;
    private String refFournisseur;

    /** Prix commercial HT (net après remise). */
    private BigDecimal prixCommercialHt;

    /** Prix brut catalogue (avant remise) — vérité facture. */
    private BigDecimal prixUnitaireHt;

    private BigDecimal remisePercent;

    /** Conditionnement : qté + libellé UOM. */
    private BigDecimal conditionnementQuantite;
    private UUID conditionnementUomId;
    private String conditionnementUomCode;
    private String conditionnementLibelle;

    /** Prix comparable recalculé (L7). */
    private BigDecimal prixNormalise;
    private UUID uomNormaliseId;
    private String uomNormaliseCode;

    private Integer delaiJours;
    private BigDecimal quantiteMin;

    private LocalDate validFrom;
    private LocalDate validTo;
    private boolean perime;
    private String source;
}
