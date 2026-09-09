package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RhNomenclatureCreateDto {

    private String id;

    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 200)
    private String libelle;

    private Boolean actif;
}
