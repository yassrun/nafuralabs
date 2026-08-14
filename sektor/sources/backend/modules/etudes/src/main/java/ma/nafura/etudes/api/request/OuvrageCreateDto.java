package ma.nafura.etudes.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class OuvrageCreateDto {

    @NotBlank
    private String code;

    @NotBlank
    private String designation;

    /**
     * Legacy — si {@link #codeFamille} absent, utilisé comme code_famille.
     *
     * @deprecated préférer codeLot / codeFamille
     */
    @Deprecated
    private String category;

    /** UsageLot — défaut GROS_OEUVRE. */
    private String codeLot;

    /** Grille provisoire PR2 — défaut DIVERS ou category. */
    private String codeFamille;

    /** SAISIE | ETUDE | CATALOGUE — défaut SAISIE. */
    private String origine;

    private UUID sourceEtudeId;

    private String catalogCleStable;

    @NotBlank
    private String unite;

    @NotNull
    @Valid
    private UniteMainInputDto uniteMain;

    @Valid
    private List<ComposantOuvrageInputDto> composants = new ArrayList<>();

    private BigDecimal fraisGenerauxPercent;

    private BigDecimal beneficePercent;

    private Boolean isActive;

    private String notes;
}
