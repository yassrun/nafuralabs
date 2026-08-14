package ma.nafura.marches.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import ma.nafura.marches.api.dto.MarchesKpiDto;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.domain.model.FactureMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.FactureMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarchesKpiService {

    private static final List<String> CONTRAT_ACTIFS =
            List.of(ContratMarche.STATUS_NOTIFIE, ContratMarche.STATUS_EN_COURS);

    private final ContratMarcheRepository contratRepository;
    private final ContratMarcheSeedService contratSeedService;
    private final FactureMarcheRepository factureRepository;
    private final FactureMarcheSeedService factureSeedService;
    private final CautionMarcheService cautionMarcheService;

    public MarchesKpiService(
            ContratMarcheRepository contratRepository,
            ContratMarcheSeedService contratSeedService,
            FactureMarcheRepository factureRepository,
            FactureMarcheSeedService factureSeedService,
            CautionMarcheService cautionMarcheService) {
        this.contratRepository = contratRepository;
        this.contratSeedService = contratSeedService;
        this.factureRepository = factureRepository;
        this.factureSeedService = factureSeedService;
        this.cautionMarcheService = cautionMarcheService;
    }

    @Transactional(readOnly = true)
    public MarchesKpiDto compute() {
        contratSeedService.seedIfEmpty();
        factureSeedService.seedIfEmpty();
        UUID tenantId = TenantContext.getTenantId();

        List<ContratMarche> contrats = contratRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        int nbContratsActifs = (int) contrats.stream()
                .filter(c -> CONTRAT_ACTIFS.contains(c.getStatus()))
                .count();

        List<FactureMarche> factures = factureRepository.findByTenantIdOrderByDateEmissionDescCreatedAtDesc(tenantId);
        BigDecimal cumulSituations = factures.stream()
                .filter(f -> !FactureMarche.STATUS_BROUILLON.equals(f.getStatus())
                        && !FactureMarche.STATUS_ANNULEE.equals(f.getStatus()))
                .map(f -> f.getNetHt() != null ? f.getNetHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cumulRG = factures.stream()
                .map(f -> f.getRetenueGarantieHt() != null ? f.getRetenueGarantieHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int cautionsExpirant30j = cautionMarcheService.expirant(30).size();

        return MarchesKpiDto.builder()
                .nbContratsActifs(nbContratsActifs)
                .cumulSituations(scale2(cumulSituations))
                .cumulRG(scale2(cumulRG))
                .cautionsExpirant30j(cautionsExpirant30j)
                .build();
    }

    private static BigDecimal scale2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
