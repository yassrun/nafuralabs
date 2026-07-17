package ma.nafura.chantiers.api.dto;

import java.math.BigDecimal;
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
public class ChantierLotTreeNodeDto {

    private String id;
    private String chantierId;
    private String code;
    private String designation;
    private String parentLotId;
    private BigDecimal avancementPercent;
    private int ordre;
    private int depth;

    @Builder.Default
    private List<ChantierLotTreeNodeDto> children = new ArrayList<>();

    @Builder.Default
    private List<ChantierLotTreePosteDto> postes = new ArrayList<>();
}
