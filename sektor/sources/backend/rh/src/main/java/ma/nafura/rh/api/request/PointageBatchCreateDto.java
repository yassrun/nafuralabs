package ma.nafura.rh.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class PointageBatchCreateDto {

    @NotNull
    private UUID clientId;

    @NotBlank
    private String chefEmployeId;

    @NotBlank
    private String chantierId;

    @NotNull
    private LocalDate datePointage;

    private BigDecimal gpsLat;
    private BigDecimal gpsLng;
    private String signatureUrl;
    private String photoUrl;
    private String status;

    @NotEmpty
    @Valid
    private List<PointageInputDto> pointages;
}
