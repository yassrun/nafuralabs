package ma.nafura.ventes.api.request;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class AvoirClientUpdateDto {

    private String factureOriginaleId;

    private String factureOriginaleNumero;

    private String clientId;

    private String clientName;

    private LocalDate dateEmission;

    private String motif;

    private BigDecimal tvaTaux;

    private String status;

    private String notes;

    @Valid
    private List<AvoirClientLigneInputDto> lignes;
}
