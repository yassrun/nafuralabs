package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ZoneChantierCreateDto {

    @NotBlank
    private String designation;

    private String parentZoneId;

    private Integer ordre;
}
