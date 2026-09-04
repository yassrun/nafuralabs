package ma.nafura.achats.api.request;

import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class ConsultationDestinatairesSaveDto {

    private List<ConsultationDestinataireCreateDto> items = new ArrayList<>();
}
