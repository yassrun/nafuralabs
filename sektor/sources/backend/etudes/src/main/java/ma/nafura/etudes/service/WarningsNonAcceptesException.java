package ma.nafura.etudes.service;

import java.util.List;
import ma.nafura.etudes.api.dto.completude.ControleEtude;

/** Warnings commerciaux non acceptés avant gain ou conversion (SEKTOR-211 AC-2). */
public class WarningsNonAcceptesException extends RuntimeException {

    private final transient List<ControleEtude> controles;

    public WarningsNonAcceptesException(List<ControleEtude> controles) {
        super("etudes.dossier.warnings_non_acceptes");
        this.controles = List.copyOf(controles);
    }

    public List<ControleEtude> getControles() {
        return controles;
    }
}
