package ma.nafura.chantiers.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SignAttachementInfoDto {

    private String attachementId;
    private String numero;
    private String chantierCode;
    private String date;
    private String status;
    private String role;
}
