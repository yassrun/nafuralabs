package ma.nafura.finance.api.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LettrageAutoMatchDto {

    private List<String> ligneKeys;
}
