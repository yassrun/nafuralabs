package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class FormationHseCreateDto {

    private String id;

    @NotBlank
    private String titre;

    @NotNull
    private LocalDate dateDebut;

    private LocalDate dateFin;

    @NotNull
    private Integer dureeHeures;

    private String formateur;

    private String lieu;

    private Integer nbParticipants;

    private String habilitationCode;

    private String attestationReference;

    private LocalDate attestationValidite;

    private String status;

    private String notes;

    private List<String> participants = new ArrayList<>();
}
