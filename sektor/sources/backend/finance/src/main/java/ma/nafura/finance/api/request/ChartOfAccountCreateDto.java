package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChartOfAccountCreateDto {

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 255)
    private String name;

    @NotNull
    private Integer accountClass;

    @NotBlank
    @Size(max = 30)
    private String accountType;

    @Size(max = 50)
    private String parentAccountCode;

    private Boolean isCollectif;
    private Boolean isLettrable;
    private Boolean isAuxiliaire;
    private Boolean axeAnalytiqueObligatoire;
    private Boolean isActive;
}
