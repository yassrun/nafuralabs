package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DossierAgentCorrigerDto {

    @NotBlank
    @Size(max = 500)
    private String note;
}
