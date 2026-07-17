package ma.nafura.chantiers.api.dto;

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
public class ChantierLotTreeResponseDto {

    @Builder.Default
    private List<ChantierLotTreeNodeDto> lots = new ArrayList<>();
}