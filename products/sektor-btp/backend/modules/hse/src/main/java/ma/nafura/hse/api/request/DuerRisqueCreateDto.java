package ma.nafura.hse.api.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DuerRisqueCreateDto {

    private String id;

    @NotBlank
    private String libelle;

    @Min(1)
    @Max(5)
    private int probabilite;

    @Min(1)
    @Max(5)
    private int gravite;

    private String codeActivite;

    private String mesures;

    private Integer ordre;
}
