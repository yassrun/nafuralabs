package ma.nafura.rh.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RhNomenclatureUpdateDto {

    @Size(max = 50)
    private String code;

    @Size(max = 200)
    private String libelle;

    private Boolean actif;
}
