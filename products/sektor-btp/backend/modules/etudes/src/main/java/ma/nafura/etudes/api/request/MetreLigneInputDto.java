package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class MetreLigneInputDto {

    private String ouvrageId;

    private String ouvrageCode;

    private String designationLibre;

    @NotBlank
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

    @NotNull
    private BigDecimal quantiteCalculee;

    private String notes;
}
