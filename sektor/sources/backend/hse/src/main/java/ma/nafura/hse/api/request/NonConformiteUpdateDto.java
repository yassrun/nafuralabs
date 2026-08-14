package ma.nafura.hse.api.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class NonConformiteUpdateDto {

    private LocalDate dateNc;

    private String chantierId;

    private String chantierCode;

    private String zoneChantier;

    private String typeNc;

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
