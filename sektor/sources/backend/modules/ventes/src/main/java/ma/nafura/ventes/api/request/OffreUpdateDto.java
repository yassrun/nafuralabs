package ma.nafura.ventes.api.request;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class OffreUpdateDto {

    private String clientId;

    private String clientName;

    private String chantierId;

    private String chantierCode;

    private LocalDate dateEmission;

    private LocalDate dateValidite;

    private String objet;

    private BigDecimal tvaTaux;

    private String status;

    private String motifRefus;

    private String notes;

    @Valid
    private List<OffreLigneInputDto> lignes;
}
