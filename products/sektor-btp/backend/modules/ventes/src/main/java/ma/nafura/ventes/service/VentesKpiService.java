package ma.nafura.ventes.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.ventes.api.dto.VentesKpiDto;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.ventes.repository.FactureClientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VentesKpiService {

    private final FactureClientRepository factureRepository;
    private final FactureClientSeedService factureSeedService;

    public VentesKpiService(
            FactureClientRepository factureRepository, FactureClientSeedService factureSeedService) {
        this.factureRepository = factureRepository;
        this.factureSeedService = factureSeedService;
    }

    @Transactional(readOnly = true)
    public VentesKpiDto compute(LocalDate from, LocalDate to) {
        factureSeedService.seedIfEmpty();
        LocalDate periodStart = from != null ? from : LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate periodEnd = to != null ? to : LocalDate.now();
        if (periodStart.isAfter(periodEnd)) {
            throw new IllegalArgumentException("from must be on or before to");
        }

        UUID tenantId = TenantContext.getTenantId();
        List<FactureClient> factures = factureRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        LocalDate today = LocalDate.now();

        BigDecimal caCumule = BigDecimal.ZERO;
        BigDecimal caEncaisse = BigDecimal.ZERO;
        BigDecimal creancesOuvertes = BigDecimal.ZERO;
        int facturesEnRetard = 0;

        for (FactureClient facture : factures) {
            if (FactureClient.STATUS_BROUILLON.equals(facture.getStatus())
                    || FactureClient.STATUS_ANNULEE.equals(facture.getStatus())) {
                continue;
            }
            if (facture.getDateEmission() == null
                    || facture.getDateEmission().isBefore(periodStart)
                    || facture.getDateEmission().isAfter(periodEnd)) {
                continue;
            }
            BigDecimal netHt = facture.getNetAPayerHt() != null ? facture.getNetAPayerHt() : BigDecimal.ZERO;
            caCumule = caCumule.add(netHt);
            BigDecimal encaisse = facture.getCumulEncaisseTtc() != null
                    ? facture.getCumulEncaisseTtc()
                    : BigDecimal.ZERO;
            caEncaisse = caEncaisse.add(encaisse);
            if (!FactureClient.STATUS_PAYEE.equals(facture.getStatus())) {
                BigDecimal reste = facture.getResteTtc() != null ? facture.getResteTtc() : BigDecimal.ZERO;
                creancesOuvertes = creancesOuvertes.add(reste);
                if (facture.getDateEcheance() != null
                        && facture.getDateEcheance().isBefore(today)
                        && reste.signum() > 0) {
                    facturesEnRetard++;
                }
            }
        }

        return VentesKpiDto.builder()
                .caCumule(scale2(caCumule))
                .caEncaisse(scale2(caEncaisse))
                .creancesOuvertes(scale2(creancesOuvertes))
                .facturesEnRetard(facturesEnRetard)
                .nbDevisGagnes(0)
                .build();
    }

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
