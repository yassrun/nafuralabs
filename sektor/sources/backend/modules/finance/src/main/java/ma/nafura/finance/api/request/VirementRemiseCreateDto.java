package ma.nafura.finance.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class VirementRemiseCreateDto {
    @NotNull
    private LocalDate executionDate;

    @NotBlank
    private String bankCode;

    @NotEmpty
    private List<LineInput> lines;

    @Data
    public static class LineInput {
        private String beneficiaire;
        private String rib;
        private java.math.BigDecimal montant;
        private String motif;
        private String referencePiece;
    }
}
