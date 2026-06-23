package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class PpspsCreateDto {

    private String id;

    @NotBlank
    private String chantierId;

    @NotBlank
    private String chantierCode;

    @NotBlank
    private String chantierNom;

    @NotBlank
    private String coordonnateurSpsNom;

    private String coordonnateurSpsTel;

    @NotNull
    private LocalDate date;

    @NotBlank
    private String mesuresCollectives;

    private Integer effectifsMaxJour;

    private Integer hommesJourEstimes;

    private String observations;

    private String status;
}
