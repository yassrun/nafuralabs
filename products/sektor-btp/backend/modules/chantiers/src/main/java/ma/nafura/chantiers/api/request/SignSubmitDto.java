package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SignSubmitDto {

    @NotBlank
    private String signatureBase64;

    private String ip;
    private String userAgent;
}
