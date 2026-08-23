package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class DpgfNoeudUpdateDto {

    private String code;
    private String libelle;
    private String articleId;
    private BigDecimal quantite;
    private String unite;
    private BigDecimal prixUnitaire;
    /** Coût unitaire (remplace prixFourniBase). */
    private BigDecimal coutUnitaire;
    private BigDecimal fraisGenerauxPercent;
    private BigDecimal margePercent;
    private BigDecimal total;
    private String descriptif;
    private Integer ordre;
    /** DECOMPOSE | FORFAIT | ESTIME */
    private String origineCout;
    /** COUT | VENTE — si ESTIME */
    private String estimationSaisieEn;
    private UUID forfaitPartnerId;
    private UUID forfaitOffreId;
}
