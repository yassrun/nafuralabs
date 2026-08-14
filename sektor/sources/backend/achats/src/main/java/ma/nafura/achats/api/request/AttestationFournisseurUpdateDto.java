package ma.nafura.achats.api.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class AttestationFournisseurUpdateDto {

    private String partnerId;

    private String type;

    private LocalDate dateEmission;

    private LocalDate dateExpiration;

    private String scanUrl;
}
