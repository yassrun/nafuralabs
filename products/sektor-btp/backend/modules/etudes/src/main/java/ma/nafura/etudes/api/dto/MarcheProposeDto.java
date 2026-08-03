package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

/** Proposition reviewable après index CPS — jamais persistée automatiquement. */
@Data
@Builder
public class MarcheProposeDto {

    private Metadonnees metadonnees;
    private List<PieceProposee> piecesAttendues;
    private Double confiance;

    @Data
    @Builder
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

    @Data
    @Builder
    public static class PieceProposee {
        private String type;
        private String libelle;
        private boolean obligatoire;
    }
}
