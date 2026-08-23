package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ConsultationPaquetDto {

    @NotEmpty
    private List<String> cleStables = new ArrayList<>();
}
