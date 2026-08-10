package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class ComposantOuvrageInputDto {

    private String type;

    /** ITEM | OUVRAGE | LIBRE */
    private String referenceType;

    private UUID itemId;

    /** Référence typée ouvrage (composite) — pas le parent. */
    private UUID refOuvrageId;

    private String libelle;

    /**
     * Alias legacy de {@link #libelle}.
     *
     * @deprecated utiliser libelle
     */
    @Deprecated
    private String designation;

    /**
     * Legacy VARCHAR — mappé en LIBRE + libelle.
     *
     * @deprecated utiliser referenceType / itemId / refOuvrageId
     */
    @Deprecated
    private String articleId;

    @NotBlank
    private String unite;

    @NotNull
    private BigDecimal rendement;

    @NotNull
    private BigDecimal prixUnitaire;

    private BigDecimal total;
}
