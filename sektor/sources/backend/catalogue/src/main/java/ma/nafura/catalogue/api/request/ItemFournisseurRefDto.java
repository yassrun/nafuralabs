package ma.nafura.catalogue.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ItemFournisseurRefDto {

    @NotBlank
    @Size(max = 100)
    private String refFournisseur;
}
