package ma.nafura.marches.api.request;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class CautionMarcheCreateDto {

    private String id;

    private String numero;

    @NotBlank
    private String contratMarcheId;

    @NotBlank
    private String type;

    private String banquePartnerId;

    private String banqueNom;

    private BigDecimal montant;

    private LocalDate dateEmission;

    private LocalDate dateExpiration;

    private String status;

    private String scanUrl;
}
