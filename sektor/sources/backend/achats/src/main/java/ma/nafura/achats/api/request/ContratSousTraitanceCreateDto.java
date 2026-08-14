package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class ContratSousTraitanceCreateDto {

    /** Link an existing contract instead of creating a new one. */
    private UUID contratId;

    @NotBlank
    private String sousTraitantId;

    private String sousTraitantNom;

    private String ice;

    @NotBlank
    private String objet;

    @NotNull
    private LocalDate dateDebut;

    @NotNull
    private LocalDate dateFin;

    private LocalDate dateSignature;

    private BigDecimal montantHt;

    private BigDecimal retenueGarantieTaux;

    private String status;

    private Boolean declarationArt187;

    private BigDecimal avancementPercent;
}
