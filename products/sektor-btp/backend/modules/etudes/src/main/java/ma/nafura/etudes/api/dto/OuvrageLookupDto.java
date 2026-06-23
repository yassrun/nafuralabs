package ma.nafura.etudes.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OuvrageLookupDto {

    private String id;
    private String code;
    private String label;
    private String category;
    private BigDecimal prixUnitaireHt;
    private LocalDate derniereMaj;
}
