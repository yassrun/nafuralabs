package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PpspsSectionCreateDto {

    private String id;

    @NotBlank
    private String code;

    @NotBlank
    private String titre;

    private String contenu;

    private Integer ordre;
}
