package ma.nafura.platform.configuration.sysconfig.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Update DTO for Calendar entity.
 * Auto-generated from calendar.entity.json — do not edit.
 */
@Data
public class CalendarUpdateDto {

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String name;

    @Size(max = 50)
    private String timeZoneId;

    @Size(max = 2000)
    private String description;

    private Boolean isActive;
}

