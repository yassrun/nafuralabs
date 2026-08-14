package ma.nafura.etudes.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.nafura.etudes.domain.appeloffre.AppelOffreClient;
import ma.nafura.etudes.domain.devis.Devis;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConvertToChantierResultDto {

    private String chantierId;
    private AppelOffreClient aoc;
    private Devis devis;
}
