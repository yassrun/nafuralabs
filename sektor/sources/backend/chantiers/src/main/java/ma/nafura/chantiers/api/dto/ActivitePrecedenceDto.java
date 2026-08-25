package ma.nafura.chantiers.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ActivitePrecedenceDto {

    private String id;
    private String chantierId;
    private String predActiviteId;
    private String succActiviteId;
    private String typeLien;
}
