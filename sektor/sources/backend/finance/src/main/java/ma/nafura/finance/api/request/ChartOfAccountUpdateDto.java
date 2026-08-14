package ma.nafura.finance.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChartOfAccountUpdateDto {

    @Size(max = 255)
    private String name;

    private Integer accountClass;

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
