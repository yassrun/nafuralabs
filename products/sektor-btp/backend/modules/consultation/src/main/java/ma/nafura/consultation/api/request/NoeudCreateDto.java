package ma.nafura.consultation.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class NoeudCreateDto {

    @NotBlank
    private String type;

    private UUID parentId;
    private String code;

    @NotBlank
    private String libelle;

    private String unite;
    private BigDecimal quantite;
    private String descriptif;
    private Integer ordre;
    private String mode;
}
