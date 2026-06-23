package ma.nafura.etudes.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class OuvrageCreateDto {

    @NotBlank
    private String code;

    @NotBlank
    private String designation;

    @NotBlank
    private String category;

    @NotBlank
    private String unite;

    @NotNull
    @Valid
    private UniteMainInputDto uniteMain;

    @Valid
    private List<ComposantOuvrageInputDto> composants = new ArrayList<>();

    private BigDecimal fraisGenerauxPercent;

    private BigDecimal beneficePercent;

    private Boolean isActive;

    private String notes;
}
