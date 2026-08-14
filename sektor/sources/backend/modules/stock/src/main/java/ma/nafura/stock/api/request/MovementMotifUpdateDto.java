package ma.nafura.stock.api.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MovementMotifUpdateDto {

    @Size(max = 50)
    private String code;

    @Size(max = 255)
    private String name;

    @Size(max = 30)
    private String txType;

    private Boolean isActive;
}
