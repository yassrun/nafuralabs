package ma.nafura.achats.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AppelOffreAttribuerDto {

    @NotBlank
    private String fournisseurId;

    private String fournisseurName;

    private String justification;
}
