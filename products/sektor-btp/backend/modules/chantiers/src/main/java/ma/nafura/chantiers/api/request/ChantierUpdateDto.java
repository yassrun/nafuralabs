package ma.nafura.chantiers.api.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ChantierUpdateDto {

    private String code;

    @JsonAlias({"name", "label"})
    private String label;

    private String description;

    @JsonAlias("type")
    private String chantierType;

    private String clientId;

    private String clientName;

    @JsonAlias("marcheReference")
    private String marcheNumero;

    private String typeCcagT;

    private String moaId;

    private String moeId;

    private String betId;

    private String adresse;

    private String ville;

    private BigDecimal latitude;

    private BigDecimal longitude;

    @JsonAlias("dateDebut")
    private LocalDate dateDemarrage;

    private Integer dureeMois;

    private LocalDate dateFinPrevue;

    private LocalDate dateFinReelle;

    @JsonAlias("budgetHt")
    private BigDecimal montantHt;

    @JsonAlias("tvaTaux")
    private BigDecimal tauxTva;

    @JsonAlias("cautionGarantie")
    private BigDecimal tauxRg;

    private BigDecimal tauxRas;

    @JsonAlias("avancePercue")
    private BigDecimal tauxAvance;

    private BigDecimal avancementPercent;

    private String status;

    private String chefChantierUserId;

    private String chefChantierName;

    private String conducteurTravauxUserId;

    private String conducteurTravauxName;

    private String ingenieurUserId;

    private String ingenieurName;

    private String societeId;

    private Boolean active;
}
