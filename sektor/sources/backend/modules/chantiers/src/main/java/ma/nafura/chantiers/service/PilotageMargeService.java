package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.PilotageMargeRowDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.service.ContratMarcheSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PilotageMargeService {

    private static final BigDecimal COUT_CIBLE_RATIO = new BigDecimal("0.18");
    private static final BigDecimal FRAIS_GEN_RATIO = new BigDecimal("0.02");

    private final ChantierRepository chantierRepository;
    private final ChantierSeedService chantierSeedService;
    private final ContratMarcheRepository contratMarcheRepository;
    private final ContratMarcheSeedService contratMarcheSeedService;

    public PilotageMargeService(
            ChantierRepository chantierRepository,
            ChantierSeedService chantierSeedService,
            ContratMarcheRepository contratMarcheRepository,
            ContratMarcheSeedService contratMarcheSeedService) {
        this.chantierRepository = chantierRepository;
        this.chantierSeedService = chantierSeedService;
        this.contratMarcheRepository = contratMarcheRepository;
        this.contratMarcheSeedService = contratMarcheSeedService;
    }

    @Transactional(readOnly = true)
    public List<PilotageMargeRowDto> listMarges(String societeId) {
        chantierSeedService.seedIfEmpty();
        contratMarcheSeedService.seedIfEmpty();

        UUID tenantId = TenantContext.getTenantId();
        List<Chantier> chantiers = chantierRepository.findByTenantIdOrderByCodeAsc(tenantId);
        List<ContratMarche> contrats =
                contratMarcheRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);

        if (StringUtils.hasText(societeId)) {
            String sid = societeId.trim();
            chantiers = chantiers.stream()
                    .filter(c -> sid.equals(resolveSocieteId(c)))
                    .toList();
        }

        List<PilotageMargeRowDto> rows = new ArrayList<>();
        for (Chantier c : chantiers) {
            ContratMarche marche = contrats.stream()
                    .filter(m -> c.getId().equals(m.getChantierId()))
                    .findFirst()
                    .orElse(null);

            BigDecimal montantMarcheHt = marche != null && marche.getMontantHt() != null
                    ? marche.getMontantHt()
                    : (c.getMontantHt() != null ? c.getMontantHt() : BigDecimal.ZERO);
            BigDecimal avancement = c.getAvancementPercent() != null ? c.getAvancementPercent() : BigDecimal.ZERO;
            BigDecimal cumulFactureHt = montantMarcheHt.signum() > 0
                    ? montantMarcheHt.multiply(avancement).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            BigDecimal pctFacture = montantMarcheHt.signum() > 0
                    ? cumulFactureHt
                            .multiply(BigDecimal.valueOf(100))
                            .divide(montantMarcheHt, 0, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            BigDecimal coutEstime = montantMarcheHt.multiply(BigDecimal.ONE.subtract(COUT_CIBLE_RATIO));
            BigDecimal margeProjeteeHt = scale0(montantMarcheHt
                    .subtract(coutEstime)
                    .subtract(coutEstime.multiply(FRAIS_GEN_RATIO)));
            BigDecimal margePct = montantMarcheHt.signum() > 0
                    ? margeProjeteeHt
                            .multiply(BigDecimal.valueOf(1000))
                            .divide(montantMarcheHt, 0, RoundingMode.HALF_UP)
                            .divide(BigDecimal.TEN, 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            rows.add(PilotageMargeRowDto.builder()
                    .chantierId(c.getId())
                    .chantierCode(c.getCode())
                    .chantierNom(c.getLabel())
                    .status(c.getStatus())
                    .montantMarcheHt(scale0(montantMarcheHt))
                    .cumulFactureHt(scale0(cumulFactureHt))
                    .pctFacture(pctFacture)
                    .avancementPercent(avancement)
                    .margeProjeteeHt(margeProjeteeHt)
                    .margePct(margePct)
                    .build());
        }
        return rows;
    }

    private static String resolveSocieteId(Chantier c) {
        if (StringUtils.hasText(c.getSocieteId())) {
            return c.getSocieteId();
        }
        return switch (c.getId()) {
            case "ch-001", "ch-003", "ch-005" -> "SocA";
            case "ch-002", "ch-004" -> "SocB";
            default -> "SocA";
        };
    }

    private static BigDecimal scale0(BigDecimal v) {
        return v.setScale(0, RoundingMode.HALF_UP);
    }
}
