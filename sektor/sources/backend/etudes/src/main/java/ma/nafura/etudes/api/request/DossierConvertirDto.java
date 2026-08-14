package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

/** Payload conversion atomique marché + chantier (L13). Champs optionnels = défauts depuis dossier. */
@Data
public class DossierConvertirDto {

    private String chantierLabel;
    private String chantierCode;
    private String chantierVille;
    private LocalDate dateDemarrage;
    private Integer dureeMois;

    private String marcheIntitule;
    private String marcheReference;
    private BigDecimal montantHt;
    private BigDecimal tauxTva;
}
