package ma.nafura.marches.api.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class ReceptionProvisoireDto {

    private String id;
    private LocalDate dateReception;
    private String pvReference;
}
