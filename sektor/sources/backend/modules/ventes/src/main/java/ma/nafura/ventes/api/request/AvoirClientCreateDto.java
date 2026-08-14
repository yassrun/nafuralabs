package ma.nafura.ventes.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class AvoirClientCreateDto {

    @NotBlank
    private String factureOriginaleId;

    private String factureOriginaleNumero;

    @NotBlank
    private String clientId;

    private String clientName;

    @NotNull
    private LocalDate dateEmission;

    @NotBlank
    private String motif;

    private BigDecimal tvaTaux;

    private String status;

    private String notes;

    @Valid
    private List<AvoirClientLigneInputDto> lignes = new ArrayList<>();
}
