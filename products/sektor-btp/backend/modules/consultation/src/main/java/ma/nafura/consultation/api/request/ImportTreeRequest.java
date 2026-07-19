package ma.nafura.consultation.api.request;

import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ImportTreeRequest {

    private List<ImportNoeudDto> arbre = new ArrayList<>();
}
