package ma.nafura.finance.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CaisseMouvementDto {
    private UUID id;
    private UUID caisseId;
    private LocalDate date;
    private String type;
    private BigDecimal montant;
    private String categorie;
    private String description;
    private String photoTicketUrl;
    private GeolocDto geoloc;
    private String validePar;
    private String status;

    @Data
    @Builder
    public static class GeolocDto {
        private BigDecimal lat;
        private BigDecimal lng;
    }
}
