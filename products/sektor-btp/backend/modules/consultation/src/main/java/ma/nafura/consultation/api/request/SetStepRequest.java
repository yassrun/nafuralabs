package ma.nafura.consultation.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SetStepRequest {

    @NotNull
    @Min(1)
    @Max(3)
    private Integer step;
}
