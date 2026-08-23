package ma.nafura.catalogue.api.request;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for Item entity.
 * Auto-generated from item.entity.json — do not edit.
 */
@Data
public class ItemCreateDto {

    @Size(max = 50)
    private String code;

    /** Identité Sektor. Si vide, dérivée du libellé (slug). Unique par tenant. */
    @Size(max = 120)
    private String cleStable;

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 2000)
    private String description;

    private UUID itemCategoryId;

    private UUID unitOfMeasureId;

    @Size(max = 100)
    private String sku;

    private Boolean isActive;

    @Size(max = 30)
    private String nature;

    /** Si true, article créé allégé (L9) — à compléter. */
    private Boolean aCompleter;

    @Size(max = 50)
    private String posteBudgetId;

    private UUID defaultLocationId;

    private Boolean isPerissable;

    @Size(max = 1)
    private String abcClass;

    private BigDecimal pmp;

    private BigDecimal prixUnitaire;

    private BigDecimal stockMin;

    private BigDecimal stockMax;

    private Integer delaiReapproJours;

    /** Lots d'usage multi (GROS_OEUVRE, VRD, …) — table item_usage_lots. */
    private java.util.List<String> usageLotCodes;
}
