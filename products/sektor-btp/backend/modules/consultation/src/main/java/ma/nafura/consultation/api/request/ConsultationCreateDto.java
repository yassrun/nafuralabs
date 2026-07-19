package ma.nafura.consultation.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConsultationCreateDto {

    private String numero;

    @NotBlank
    private String objet;

    private String chantierId;
    private String chantierCode;
    private String chantierName;
    private String cpsDocumentId;
    private String bordereauDocumentId;
    private String notes;
}
