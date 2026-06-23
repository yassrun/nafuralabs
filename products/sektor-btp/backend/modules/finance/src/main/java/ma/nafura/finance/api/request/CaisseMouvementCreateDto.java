package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

@Data
public class CaisseMouvementCreateDto {
    @NotNull
    private UUID caisseId;

    @NotNull
    private LocalDate date;

    @NotBlank
    private String type;

    @NotNull
    private BigDecimal montant;

    private String categorie;

    @NotBlank
    private String description;

    private String photoTicketUrl;
    private BigDecimal geolocLat;
    private BigDecimal geolocLng;
    private String status;
}
