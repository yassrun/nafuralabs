package ma.nafura.marches.service;

import java.math.BigDecimal;
import ma.nafura.marches.api.dto.AvenantImpactSimulationDto;
import ma.nafura.marches.domain.model.Avenant;
import ma.nafura.marches.domain.model.ContratMarche;
import org.springframework.stereotype.Service;

@Service
public class AvenantPropagationService {

    public AvenantImpactSimulationDto simulate(Avenant avenant, ContratMarche contrat) {
        BigDecimal montantActuel = defaultZero(contrat.getMontantHt());
        BigDecimal delta = defaultZero(avenant.getMontantHt());
        int dureeActuelle = contrat.getDureeMois() != null ? contrat.getDureeMois() : 0;
        int deltaMois = deltaDureeMois(avenant.getProlongationJours());
        return AvenantImpactSimulationDto.builder()
                .avenantId(avenant.getId())
                .contratMarcheId(contrat.getId())
                .montantHtActuel(montantActuel)
                .deltaMontantHt(delta)
                .montantHtApres(montantActuel.add(delta))
                .dureeMoisActuelle(dureeActuelle)
                .deltaDureeMois(deltaMois)
                .dureeMoisApres(dureeActuelle + deltaMois)
                .prolongationJours(avenant.getProlongationJours() != null ? avenant.getProlongationJours() : 0)
                .dejaPropage(avenant.getImpactPropageLe() != null)
                .build();
    }

    public AvenantImpactSimulationDto apply(Avenant avenant, ContratMarche contrat) {
        AvenantImpactSimulationDto simulation = simulate(avenant, contrat);
        contrat.setMontantHt(simulation.getMontantHtApres());
        contrat.setDureeMois(simulation.getDureeMoisApres());
        return simulation;
    }

    int deltaDureeMois(Integer prolongationJours) {
        if (prolongationJours == null || prolongationJours <= 0) {
            return 0;
        }
        return prolongationJours / 30;
    }

    private BigDecimal defaultZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
