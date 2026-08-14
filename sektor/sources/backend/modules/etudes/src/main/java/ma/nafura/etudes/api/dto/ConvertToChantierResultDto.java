package ma.nafura.etudes.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.etudes.domain.model.AppelOffreClient;
import ma.nafura.etudes.domain.model.Devis;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConvertToChantierResultDto {

    private String chantierId;
    private AppelOffreClient aoc;
    private Devis devis;
}
