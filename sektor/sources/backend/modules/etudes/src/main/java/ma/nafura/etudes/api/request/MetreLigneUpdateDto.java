package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class MetreLigneUpdateDto {

    private String ouvrageId;

    private String ouvrageCode;

    private String designationLibre;

    private String unite;

    private String lotCode;

    private String sousLotCode;

    private String lotLibelle;

    private String sousLotLibelle;

    private BigDecimal longueur;

    private BigDecimal largeur;

    private BigDecimal hauteur;

    private BigDecimal nombre;

    private String formule;

    private BigDecimal quantiteCalculee;

    private String notes;
}
