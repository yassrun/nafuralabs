package ma.nafura.consultation.api.request;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class ImportComposantDto {

    private String type;
    private String designation;
    private String unite;
    private BigDecimal rendement;
    private Integer ordre;
}
