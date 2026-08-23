package ma.nafura.etudes.api.request;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class ConsultationEtudeOpenDto {

    private List<String> cleStables = new ArrayList<>();

    private List<UUID> partenaireIds = new ArrayList<>();
}
