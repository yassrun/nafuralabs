package ma.nafura.chantiers.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ChantierLotTreeRequestDto {

    @NotNull
    @Valid
    private List<ChantierLotTreeNodeCreateDto> lots = new ArrayList<>();
}
