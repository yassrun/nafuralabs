package ma.nafura.marches.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class OrdreServiceMarcheCreateDto {

    private String id;

    private String numero;

    @NotBlank
    private String contratMarcheId;

    private String chantierId;

    private String chantierCode;

    @NotBlank
    private String type;

    private LocalDate dateEmission;

    private String emetteur;

    private String objet;

    private String description;

    private Integer impactDelai;

    private BigDecimal impactCout;

    private String status;
}
