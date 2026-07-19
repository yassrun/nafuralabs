package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class EtapeRequest {

    @Min(1)
    @Max(5)
    private int etape;
}
