package ma.nafura.consultation.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LinkItemRequest {

    /** Target to link: the POSTE node (FOURNI) or a composant (DECOMPOSE). */
    @NotBlank
    private String itemId;

    private String itemCode;
    private String itemName;
}
