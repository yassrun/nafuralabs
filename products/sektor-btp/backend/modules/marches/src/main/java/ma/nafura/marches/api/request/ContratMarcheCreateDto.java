package ma.nafura.marches.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ContratMarcheCreateDto {

    private String id;

    private String numero;

    private String reference;

    @NotBlank
    private String intitule;

    @NotBlank
    private String chantierId;

    private String chantierCode;

    private String chantierNom;

    @NotBlank
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
