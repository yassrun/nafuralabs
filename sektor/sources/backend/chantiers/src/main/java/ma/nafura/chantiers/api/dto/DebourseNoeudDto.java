package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.chantier.NatureLigne;

/**
 * Le déboursé d'un nœud de l'arbre, tel que l'écran le lit (AC-1, AC-3, AC-5, AC-7).
 *
 * <p>Les rubriques sont <b>toujours les quatre</b>, même à zéro : un tableau dont les lignes
 * apparaissent et disparaissent selon les montants n'est pas lisible. La part non ventilée, elle,
 * n'apparaît que si elle existe — c'est une anomalie du chiffrage, pas une rubrique de plus.
 *
 * <p>Vocabulaire (AC-15) : déboursé prévu, déboursé révisé, écart. Rien d'autre.
 */
@Data
@Builder
public class DebourseNoeudDto {

    private String noeudId;
    private String lotId;
    private String code;
    private String designation;
    private NatureLigne nature;

    /** D'où vient le déboursé : copié de l'étude, ou saisi sur un nœud interne. */
    private OrigineDebourse origine;

    /** Le coût vient d'une déduction : signalé à l'écran, ni corrigé ni caché (AC-3). */
    private boolean nonFiable;

    /** Date de la copie — après elle, l'étude ne rétro-alimente plus rien (AC-5). */
    private OffsetDateTime copieLe;

    /** Le {@code PrixDpu} d'origine et sa version au moment de la copie (AC-5). */
    private UUID prixDpuId;

    private Long prixDpuVersion;

    /** Le nœud DPGF d'origine, pour un nœud vendu (AC-5). */
    private UUID dpgfNoeudId;

    private List<DebourseRubriqueDto> rubriques;

    /** Somme des rubriques — jamais saisi à côté d'elles (AC-1). */
    private BigDecimal prevuHt;

    private BigDecimal reviseHt;

    /** Révisé − prévu : ce que la correction a changé, visible (AC-7). */
    private BigDecimal ecartRevisionHt;

    @Data
    @Builder
    public static class DebourseRubriqueDto {
        private String rubrique;
        /** Libellé en clair — matière, main d'œuvre, matériel, sous-traitance (AC-15). */
        private String label;
        private BigDecimal prevuHt;
        private BigDecimal reviseHt;
        private BigDecimal ecartRevisionHt;
    }
}
