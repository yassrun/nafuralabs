package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FactureFournisseurLitigeDto {

    @NotBlank
    private String motif;
}
