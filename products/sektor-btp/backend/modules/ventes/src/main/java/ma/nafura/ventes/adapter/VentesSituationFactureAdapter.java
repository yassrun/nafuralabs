package ma.nafura.ventes.adapter;

import ma.nafura.chantiers.api.dto.SituationFactureSummaryDto;
import ma.nafura.chantiers.api.dto.SituationTravauxDto;
import ma.nafura.chantiers.port.SituationToFacturePort;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.ventes.service.FactureClientService;
import org.springframework.stereotype.Service;

@Service
public class VentesSituationFactureAdapter implements SituationToFacturePort {

    private final FactureClientService factureClientService;

    public VentesSituationFactureAdapter(FactureClientService factureClientService) {
        this.factureClientService = factureClientService;
    }

    @Override
    public SituationFactureSummaryDto createFactureFromSituation(SituationTravauxDto situation) {
        FactureClient facture = factureClientService.createFromSituation(situation);
        return toSummary(facture, situation);
    }

    private static SituationFactureSummaryDto toSummary(FactureClient facture, SituationTravauxDto situation) {
        return SituationFactureSummaryDto.builder()
                .id(facture.getId().toString())
                .numero(facture.getNumero())
                .clientId(facture.getClientId())
                .clientName(facture.getClientName())
                .chantierId(facture.getChantierId())
                .chantierCode(facture.getChantierCode())
                .situationId(situation.getId())
                .situationNumero(situation.getNumero())
                .dateEmission(facture.getDateEmission())
                .dateEcheance(facture.getDateEcheance())
                .totalHt(facture.getTotalHt())
                .retenueGarantieTaux(facture.getRetenueGarantieTaux())
                .retenueGarantieMontant(facture.getRetenueGarantieMontant())
                .netAPayerHt(facture.getNetAPayerHt())
                .tvaTaux(facture.getTvaTaux())
                .totalTva(facture.getTotalTva())
                .netAPayerTtc(facture.getNetAPayerTtc())
                .status(facture.getStatus())
                .build();
    }
}
