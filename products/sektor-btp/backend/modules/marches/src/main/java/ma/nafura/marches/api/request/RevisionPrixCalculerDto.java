package ma.nafura.marches.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RevisionPrixCalculerDto {

    @NotBlank
    private String contratMarcheId;

    @NotBlank
    @Pattern(regexp = "\\d{4}-\\d{2}")
    private String periode;
}
