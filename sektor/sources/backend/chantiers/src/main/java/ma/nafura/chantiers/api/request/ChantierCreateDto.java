package ma.nafura.chantiers.api.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class ChantierCreateDto {

    private String id;

    private String code;

    @NotBlank
    @JsonAlias({"name", "label"})
    private String label;

    private String description;

    @JsonAlias("type")
    private String chantierType;

    @NotBlank
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

    // ── Snapshot commercial (AC-9) — posé par l'adapter de conversion, jamais par l'UI. ──

    private UUID dossierEtudeId;

    private UUID devisId;

    private String devisNumero;

    private Integer devisVersion;

    private LocalDate dateAcceptation;

    private String sourceVente;

    private BigDecimal montantVenteInitialHt;

    private BigDecimal debourseInitialHt;

    private BigDecimal tauxRas;

    @JsonAlias("avancePercue")
    private BigDecimal tauxAvance;

    private String status;

    private String societeId;

    private Boolean active;
}
