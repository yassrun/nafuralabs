package ma.nafura.marches.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ContratMarcheUpdateDto {

    private String reference;

    private String intitule;

    private String chantierId;

    private String chantierCode;

    private String chantierNom;

    private String clientId;

    private String clientNom;

    private String typeMarche;

    private String typeCcagT;

    private String natureMarche;

    private LocalDate dateNotification;

    private LocalDate dateDemarrage;

    private Integer dureeMois;

    private BigDecimal montantHt;

    private BigDecimal tauxTva;

    private BigDecimal tauxRg;

    private BigDecimal tauxRas;

    private BigDecimal tauxAvance;

    private String status;
}
