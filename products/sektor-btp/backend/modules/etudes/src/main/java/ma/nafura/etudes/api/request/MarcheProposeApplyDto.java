package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;
import ma.nafura.etudes.api.dto.MarcheProposeDto;

/** Corps d'application d'une proposition CPS (métadonnées + pièces). */
@Data
public class MarcheProposeApplyDto {

    private Metadonnees metadonnees;
    private List<MarcheProposeDto.PieceProposee> piecesAttendues;

    @Data
    public static class Metadonnees {
        private String objet;
        private String type;
        private LocalDate dateLimiteDepot;
        private String donneurOrdre;
        private String ville;
        private String reference;
        private Integer delaiExecutionJours;
        private BigDecimal estimationMoaHt;
    }
}
