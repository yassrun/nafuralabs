package ma.nafura.chantiers.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ChantierLotTreeNodeCreateDto {

    @NotBlank
    private String designation;

    @Valid
    private List<ChantierLotTreeNodeCreateDto> children = new ArrayList<>();

    @Valid
    private List<ChantierLotTreePosteCreateDto> postes = new ArrayList<>();
}
