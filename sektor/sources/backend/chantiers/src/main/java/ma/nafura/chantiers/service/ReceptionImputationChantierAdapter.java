package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import ma.nafura.achats.service.port.ReceptionImputationChantierPort;
import ma.nafura.chantiers.api.request.CoutReelCreateDto;
import org.springframework.stereotype.Component;

/**
 * SEKTOR-222 — une réception BL imputé le réel sur le nœud (MATIERE), sans magasin.
 */
@Component
public class ReceptionImputationChantierAdapter implements ReceptionImputationChantierPort {

    private final ImputationCoutReelService imputationCoutReelService;

    public ReceptionImputationChantierAdapter(ImputationCoutReelService imputationCoutReelService) {
        this.imputationCoutReelService = imputationCoutReelService;
    }

    @Override
    public void imputerReel(
            String chantierId,
            String noeudId,
            BigDecimal montantHt,
            LocalDate dateCout,
            String libelle,
            String source) {
        CoutReelCreateDto dto = new CoutReelCreateDto();
        dto.setPosteId(noeudId);
        dto.setRubrique("MATIERE");
        dto.setMontantHt(montantHt);
        dto.setDateCout(dateCout);
        dto.setLibelle(libelle);
        dto.setSource(source);
        imputationCoutReelService.imputer(chantierId, dto);
    }
}
