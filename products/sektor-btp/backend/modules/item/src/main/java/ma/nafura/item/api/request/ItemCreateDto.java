package ma.nafura.item.api.request;

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

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 2000)
    private String description;

    private UUID itemTypeId;

    private UUID itemCategoryId;

    private UUID unitOfMeasureId;

    @Size(max = 100)
    private String sku;

    private Boolean isActive;

    @Size(max = 30)
    private String articleType;

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
}
