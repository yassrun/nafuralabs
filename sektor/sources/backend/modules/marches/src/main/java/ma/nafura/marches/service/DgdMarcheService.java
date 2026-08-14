package ma.nafura.marches.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.domain.model.DgdMarche;
import ma.nafura.marches.domain.model.FactureMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.DgdMarcheRepository;
import ma.nafura.marches.repository.FactureMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DgdMarcheService {

    private final DgdMarcheRepository dgdRepository;
    private final FactureMarcheRepository factureRepository;
    private final ContratMarcheRepository contratRepository;
    private final DgdMarcheSeedService seedService;
    private final DgdCalculatorService calculator;

    public DgdMarcheService(
            DgdMarcheRepository dgdRepository,
            FactureMarcheRepository factureRepository,
            ContratMarcheRepository contratRepository,
            DgdMarcheSeedService seedService,
            DgdCalculatorService calculator) {
        this.dgdRepository = dgdRepository;
        this.factureRepository = factureRepository;
        this.contratRepository = contratRepository;
        this.seedService = seedService;
        this.calculator = calculator;
    }

    @Transactional(readOnly = true)
    public List<DgdMarche> list(String contratId, String status) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<DgdMarche> rows;
        if (StringUtils.hasText(contratId)) {
            rows = dgdRepository.findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(
                    tenantId, contratId.trim());
        } else {
            rows = dgdRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }
        if (StringUtils.hasText(status)) {
            String st = status.trim();
            rows = rows.stream().filter(d -> st.equals(d.getStatus())).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public DgdMarche getById(String id) {
        seedService.seedIfEmpty();
        return resolveDgd(id).orElseThrow(() -> new IllegalArgumentException("DGD not found"));
    }

    @Transactional
    public DgdMarche generateFromContrat(String contratId) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        ContratMarche contrat = resolveContrat(contratId)
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        Optional<DgdMarche> existing =
                dgdRepository.findFirstByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(
                        tenantId, contrat.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        List<FactureMarche> factures =
                factureRepository.findByTenantIdAndContratMarcheIdOrderByDateEmissionDescCreatedAtDesc(
                        tenantId, contrat.getId());
        BigDecimal cumulSituations = BigDecimal.ZERO;
        BigDecimal cumulRg = BigDecimal.ZERO;
        for (FactureMarche facture : factures) {
            if (FactureMarche.STATUS_ANNULEE.equals(facture.getStatus())
                    || FactureMarche.STATUS_BROUILLON.equals(facture.getStatus())) {
                continue;
            }
            cumulSituations = cumulSituations.add(nz(facture.getNetTtc()));
            cumulRg = cumulRg.add(nz(facture.getRetenueGarantieHt()));
        }

        DgdMarche entity = DgdMarche.builder()
                .id(nextDgdId(tenantId))
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .contratMarcheId(contrat.getId())
                .marcheNumero(contrat.getNumero())
                .cumulSituationsTtc(cumulSituations)
                .cumulRetenueGarantie(cumulRg)
                .cumulRevisionK(BigDecimal.ZERO)
                .cumulPenalites(BigDecimal.ZERO)
                .reprisesRg(BigDecimal.ZERO)
                .status(DgdMarche.STATUS_BROUILLON)
                .build();
        refreshNet(entity);
        return dgdRepository.save(entity);
    }

    @Transactional
    public DgdMarche soumettreMoa(String id) {
        DgdMarche entity = getById(id);
        if (!DgdMarche.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("DGD must be BROUILLON to submit to MOA");
        }
        entity.setStatus(DgdMarche.STATUS_SOUMIS_MOA);
        entity.setUpdatedAt(OffsetDateTime.now());
        return dgdRepository.save(entity);
    }

    @Transactional
    public DgdMarche notifier(String id) {
        DgdMarche entity = getById(id);
        if (!DgdMarche.STATUS_SOUMIS_MOA.equals(entity.getStatus())) {
            throw new IllegalStateException("DGD must be SOUMIS_MOA to notify");
        }
        entity.setStatus(DgdMarche.STATUS_NOTIFIE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return dgdRepository.save(entity);
    }

    @Transactional
    public DgdMarche marquerPaye(String id) {
        DgdMarche entity = getById(id);
        if (!DgdMarche.STATUS_NOTIFIE.equals(entity.getStatus())) {
            throw new IllegalStateException("DGD must be NOTIFIE to mark as paid");
        }
        entity.setStatus(DgdMarche.STATUS_PAYE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return dgdRepository.save(entity);
    }

    private void refreshNet(DgdMarche entity) {
        entity.setMontantNetAPayer(calculator.computeMontantNetAPayer(
                entity.getCumulSituationsTtc(),
                entity.getCumulRetenueGarantie(),
                entity.getCumulRevisionK(),
                entity.getCumulPenalites(),
                entity.getReprisesRg()));
    }

    private Optional<DgdMarche> resolveDgd(String id) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        return dgdRepository.findByIdAndTenantId(id.trim(), tenantId);
    }

    private Optional<ContratMarche> resolveContrat(String idOrNumero) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(idOrNumero)) {
            return Optional.empty();
        }
        String key = idOrNumero.trim();
        Optional<ContratMarche> byId = contratRepository.findByIdAndTenantId(key, tenantId);
        if (byId.isPresent()) {
            return byId;
        }
        return contratRepository.findByTenantIdAndNumero(tenantId, key);
    }

    private String nextNumero(UUID tenantId) {
        long count = dgdRepository.countByTenantId(tenantId) + 1;
        return "DGD-" + java.time.Year.now().getValue() + "-" + String.format("%03d", count);
    }

    private String nextDgdId(UUID tenantId) {
        long count = dgdRepository.countByTenantId(tenantId) + 1;
        return "dgd-" + String.format("%03d", count);
    }

    private BigDecimal nz(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
