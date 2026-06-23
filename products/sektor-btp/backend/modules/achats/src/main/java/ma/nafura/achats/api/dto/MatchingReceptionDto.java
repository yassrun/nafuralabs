package ma.nafura.achats.api.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchingReceptionDto {

    private String id;
    private String bcId;
    private String bcNumero;
    private String receptionId;
    private String receptionNumero;
    private String factureFournisseurId;
    private String factureNumero;
    @Builder.Default
    private List<MatchingLigneDto> lignes = new ArrayList<>();
    private int ecartsQuantite;
    private int ecartsPrix;
    private String status;
    private boolean matched3Way;
}
