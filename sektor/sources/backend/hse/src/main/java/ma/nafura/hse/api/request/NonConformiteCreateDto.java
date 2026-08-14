package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class NonConformiteCreateDto {

    private String id;

    @NotNull
    private LocalDate dateNc;

    private String chantierId;

    private String chantierCode;

    private String zoneChantier;

    @NotBlank
    private String typeNc;

    @NotBlank
    private String description;

    private String causesRacines;

    private String actionCorrective;

    private String actionPreventive;

    private String verificationEfficacite;

    private LocalDate dateVerificationEfficacite;

    private String responsableId;

    private String responsableNom;

    private LocalDate dateEcheance;

    private String sourceInspectionId;

    private String sourceInspectionNumero;

    private String cnssOuInspectionReference;

    private String registreLegalNumero;

    private String status;

    private String notes;
}
