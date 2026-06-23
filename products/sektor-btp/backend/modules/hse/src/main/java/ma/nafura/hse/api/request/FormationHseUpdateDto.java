package ma.nafura.hse.api.request;

import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class FormationHseUpdateDto {

    private String titre;

    private LocalDate dateDebut;

    private LocalDate dateFin;

    private Integer dureeHeures;

    private String formateur;

    private String lieu;

    private Integer nbParticipants;

    private String habilitationCode;

    private String attestationReference;

    private LocalDate attestationValidite;

    private String status;

    private String notes;

    private List<String> participants;
}
