package ma.nafura.etudes.api.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class ComposantDpuInputDto {

    private UUID id;

    @NotBlank
    private String type;

    /** ITEM | OUVRAGE | LIBRE — défaut LIBRE si absent + legacy articleOuPosteId. */
    private String referenceType;

    private UUID itemId;

    private UUID ouvrageId;

    private String libelle;

    /**
     * Legacy — mappé en LIBRE + libelle si {@link #referenceType} absent.
     *
     * @deprecated utiliser referenceType / itemId / ouvrageId / libelle
     */
    @Deprecated
    private String articleOuPosteId;

    /**
     * Quantité de ce composant nécessaire pour UNE unité d'ouvrage.
     * Alias JSON {@code quantite} conservé en lecture/écriture pour compat front.
     */
    @NotNull
    @JsonProperty("rendement")
    private BigDecimal rendement;

    @NotBlank
    private String unite;

    @NotNull
    private BigDecimal prixUnitaire;

    private BigDecimal total;

    private String sourcePrix;

    private UUID offreFournisseurId;

    private Boolean suggereParIa;

    @JsonProperty("quantite")
    public BigDecimal getQuantite() {
        return rendement;
    }

    @JsonSetter("quantite")
    public void setQuantite(BigDecimal quantite) {
        this.rendement = quantite;
    }
}
