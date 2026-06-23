package ma.nafura.rh.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointageBatchDto {

    private String id;
    private String clientId;
    private String chefEmployeId;
    private String chantierId;
    private String datePointage;
    private BigDecimal gpsLat;
    private BigDecimal gpsLng;
    private String signatureUrl;
    private String photoUrl;
    private String status;
    private OffsetDateTime createdAt;
    private List<PointageDto> pointages;
}
