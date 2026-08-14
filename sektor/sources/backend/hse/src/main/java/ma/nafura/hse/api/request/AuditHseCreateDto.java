package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class AuditHseCreateDto {

    private String id;

    private String chantierId;

    private String chantierCode;

    private String templateCode;

    @NotBlank
    private String titre;

    @NotBlank
    private String auditeurNom;

    @NotNull
    private LocalDate dateAudit;

    private String status;

    private String notes;
}
