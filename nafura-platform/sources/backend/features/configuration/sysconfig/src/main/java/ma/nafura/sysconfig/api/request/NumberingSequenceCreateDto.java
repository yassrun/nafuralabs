package ma.nafura.platform.configuration.sysconfig.api.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Create DTO for NumberingSequence entity.
 * Auto-generated from numbering-sequence.entity.json — do not edit.
 */
@Data
public class NumberingSequenceCreateDto {

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 50)
    private String prefix;

    @Min(0)
    private Long currentNumber;

    @Min(1)
    private Integer incrementBy;

    @Min(0)
    private Integer padLength;
}

