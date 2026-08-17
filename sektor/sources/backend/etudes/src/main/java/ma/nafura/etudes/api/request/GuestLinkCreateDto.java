package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GuestLinkCreateDto {

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    /** CLIENT_VIEW | FOURNISSEUR_UPLOAD */
    @NotBlank
    @Size(max = 40)
    private String purpose;

    @Min(1)
    @Max(90)
    private Integer daysValid;
}
