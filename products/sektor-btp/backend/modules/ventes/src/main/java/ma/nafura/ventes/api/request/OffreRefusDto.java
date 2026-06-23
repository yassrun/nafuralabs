package ma.nafura.ventes.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OffreRefusDto {

    @NotBlank
    private String motifRefus;
}
