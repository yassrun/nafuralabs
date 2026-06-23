package ma.nafura.etudes.api.request;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class OuvrageUpdateDto {

    private String code;

    private String designation;

    private String category;

    private String unite;

    @Valid
    private UniteMainInputDto uniteMain;

    @Valid
    private List<ComposantOuvrageInputDto> composants;

    @Valid
    private List<ComposantDpuInputDto> dpuComposants;

    private BigDecimal fraisGenerauxPercent;

    private BigDecimal beneficePercent;

    private Boolean isActive;

    private String notes;
}
