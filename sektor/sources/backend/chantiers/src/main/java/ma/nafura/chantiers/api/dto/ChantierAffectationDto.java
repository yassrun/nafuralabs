package ma.nafura.chantiers.api.dto;

import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChantierAffectationDto {

    private String id;
    private String chantierId;
    private String employeId;
    private String employeNom;
    private String employeMatricule;
    private UUID userId;
    private String roleCode;
    private String roleLabel;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Boolean isActive;
    private Boolean canMutate;
}
