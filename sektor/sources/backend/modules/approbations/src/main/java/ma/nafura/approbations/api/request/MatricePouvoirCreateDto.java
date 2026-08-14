package ma.nafura.approbations.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatricePouvoirCreateDto {

    @NotBlank
    private String entityType;

    private BigDecimal seuilMin;

    private BigDecimal seuilMax;

    @NotBlank
    private String approbateurRole;

    @NotBlank
    private String label;

    @NotNull
    private Integer ordre;
}
