package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DevisLoseRequest {

    /** Motif de perte (également accepté via champ {@code note} de la status machine). */
    @NotBlank
    private String motif;

    /** Alias status-machine ({@code requireNote}). */
    private String note;

    public String resolvedMotif() {
        if (motif != null && !motif.isBlank()) {
            return motif.trim();
        }
        if (note != null && !note.isBlank()) {
            return note.trim();
        }
        return null;
    }
}
