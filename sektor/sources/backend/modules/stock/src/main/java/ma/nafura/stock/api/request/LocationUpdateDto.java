package ma.nafura.stock.api.request;

import java.util.UUID;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for Location entity.
 * Auto-generated from location.entity.json — do not edit.
 */
@Data
public class LocationUpdateDto {

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String name;

    @Size(max = 30)
    @Pattern(regexp = "^(WAREHOUSE|BIN|SHELF|ZONE)$")
    private String type;

    private UUID parentLocationId;

    private Boolean isPhysical;

    private Boolean affectsStock;
}
