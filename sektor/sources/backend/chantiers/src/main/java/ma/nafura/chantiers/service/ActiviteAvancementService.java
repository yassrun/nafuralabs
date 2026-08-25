package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.AvancementPhysiqueDto;
import ma.nafura.chantiers.api.request.ActiviteAvancementCreateDto;
import ma.nafura.chantiers.domain.activite.ActiviteChantier;
import ma.nafura.chantiers.domain.activite.ActiviteRattachement;
import ma.nafura.chantiers.domain.avancement.AvancementPhysique;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.chantiers.repository.ActiviteRattachementRepository;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Saisie d'avancement sur activité + remontée nœud — AC-9, AC-10.
 */
@Service
public class ActiviteAvancementService {

    private static final BigDecimal CENT = new BigDecimal("100");

    private final ActiviteChantierService activiteService;
    private final ActiviteChantierRepository activiteRepository;
    private final ActiviteRattachementRepository rattachementRepository;
    private final AvancementPhysiqueRepository avancementPhysiqueRepository;
    private final AvancementPhysiqueService avancementPhysiqueService;

    public ActiviteAvancementService(
            ActiviteChantierService activiteService,
            ActiviteChantierRepository activiteRepository,
            ActiviteRattachementRepository rattachementRepository,
            AvancementPhysiqueRepository avancementPhysiqueRepository,
            AvancementPhysiqueService avancementPhysiqueService) {
        this.activiteService = activiteService;
        this.activiteRepository = activiteRepository;
        this.rattachementRepository = rattachementRepository;
        this.avancementPhysiqueRepository = avancementPhysiqueRepository;
        this.avancementPhysiqueService = avancementPhysiqueService;
    }

    @Transactional
    public Object declarer(String chantierId, String activiteId, ActiviteAvancementCreateDto request) {
        ActiviteChantier activite = activiteService.requireActivite(chantierId, activiteId);
        UUID tenantId = TenantContext.getTenantId();
        List<ActiviteRattachement> rattachements =
                rattachementRepository.findByTenantIdAndActiviteId(tenantId, activiteId);

        if (rattachements.isEmpty()) {
            if (request.getAvancementPercent() == null) {
                throw new IllegalArgumentException("chantiers.activite.avancement_percent_requis");
            }
            BigDecimal pct = request.getAvancementPercent();
            if (pct.compareTo(BigDecimal.ZERO) < 0 || pct.compareTo(CENT) > 0) {
                throw new IllegalArgumentException("chantiers.activite.avancement_percent_hors_plage");
            }
            activite.setAvancementPercent(pct);
            refreshStatus(activite, pct);
            activiteRepository.save(activite);
            return activiteService.get(chantierId, activiteId);
        }

        if (request.getQuantiteRealisee() == null
                || request.getQuantiteRealisee().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("chantiers.avancement.quantite_positive_requise");
        }
        ActiviteRattachement ratt = resolveRattachement(rattachements, request.getRattachementId());
        if (request.getQuantiteRealisee().compareTo(ratt.getQuantitePrevue()) > 0) {
            throw new IllegalArgumentException(
                    "chantiers.activite.depassement_quotite: rattachement="
                            + ratt.getId()
                            + " prevu="
                            + ratt.getQuantitePrevue());
        }

        AvancementPhysiqueDto dto = avancementPhysiqueService.enregistrerDepuisActivite(
                chantierId,
                ratt.getLotId(),
                ratt.getPosteId(),
                activiteId,
                request.getDate(),
                request.getQuantiteRealisee(),
                request.getNotes(),
                request.getStatus(),
                request.getSaisieParId(),
                request.getSaisieParName());

        BigDecimal prevu = rattachements.stream()
                .map(ActiviteRattachement::getQuantitePrevue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal fait = quantiteFaiteSurActivite(activiteId);
        BigDecimal pct = AvancementLectureService.pourcentage(prevu, fait);
        if (pct != null) {
            activite.setAvancementPercent(pct);
            refreshStatus(activite, pct);
            activiteRepository.save(activite);
        }
        return dto;
    }

    private BigDecimal quantiteFaiteSurActivite(String activiteId) {
        return avancementPhysiqueRepository
                .findByTenantIdAndActiviteId(TenantContext.getTenantId(), activiteId)
                .stream()
                .map(AvancementPhysique::getQuantiteRealisee)
                .filter(q -> q != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static void refreshStatus(ActiviteChantier activite, BigDecimal pct) {
        if (pct.compareTo(CENT) >= 0) {
            activite.setStatus(ActiviteChantier.STATUS_TERMINE);
        } else if (pct.compareTo(BigDecimal.ZERO) > 0
                && ActiviteChantier.STATUS_PLANIFIE.equals(activite.getStatus())) {
            activite.setStatus(ActiviteChantier.STATUS_EN_COURS);
        }
    }

    private static ActiviteRattachement resolveRattachement(
            List<ActiviteRattachement> rattachements, String rattachementId) {
        if (rattachements.size() == 1 && !StringUtils.hasText(rattachementId)) {
            return rattachements.get(0);
        }
        if (!StringUtils.hasText(rattachementId)) {
            throw new IllegalArgumentException("chantiers.activite.rattachement_requis");
        }
        return rattachements.stream()
                .filter(r -> rattachementId.equals(r.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Rattachement introuvable: " + rattachementId));
    }
}
