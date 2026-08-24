package ma.nafura.chantiers.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ZoneChantierDto {

    private String id;
    private String chantierId;
    private String designation;
    private String parentZoneId;
    private int ordre;
}
