package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConsultationParametresDto {

    @NotBlank
    private String mode;

    @Min(1)
    private int minimum = 1;
}
