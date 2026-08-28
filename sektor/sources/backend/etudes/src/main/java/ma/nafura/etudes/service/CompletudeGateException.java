package ma.nafura.etudes.service;

import java.util.List;
import ma.nafura.etudes.api.dto.completude.ControleEtude;

/** Refus gate : au moins un contrôle BLOCKING (SEKTOR-211 AC-2). */
public class CompletudeGateException extends RuntimeException {

    private final transient List<ControleEtude> controles;

    public CompletudeGateException(List<ControleEtude> controles) {
        super("ETU-GATE");
        this.controles = List.copyOf(controles);
    }

    public List<ControleEtude> getControles() {
        return controles;
    }
}
