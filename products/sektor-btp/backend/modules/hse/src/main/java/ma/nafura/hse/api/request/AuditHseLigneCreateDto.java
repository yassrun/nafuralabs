package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuditHseLigneCreateDto {

    private String id;

    private Integer ordre;

    @NotBlank
    private String code;

    @NotBlank
    private String libelle;

    private String categorie;

    private String reponse;

    private String commentaire;
}
