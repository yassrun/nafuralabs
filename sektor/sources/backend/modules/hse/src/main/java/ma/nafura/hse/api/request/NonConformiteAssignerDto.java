package ma.nafura.hse.api.request;

import lombok.Data;

@Data
public class NonConformiteAssignerDto {

    private String responsableId;

    private String responsableNom;

    private java.time.LocalDate dateEcheance;
}
