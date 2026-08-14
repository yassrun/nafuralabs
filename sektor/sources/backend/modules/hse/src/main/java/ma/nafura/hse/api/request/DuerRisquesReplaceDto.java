package ma.nafura.hse.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class DuerRisquesReplaceDto {

    @NotNull
    @Valid
    private List<DuerRisqueCreateDto> risques = new ArrayList<>();
}
