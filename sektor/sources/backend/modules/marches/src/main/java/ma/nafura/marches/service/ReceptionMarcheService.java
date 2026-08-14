package ma.nafura.marches.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.api.request.ReceptionDefinitiveDto;
import ma.nafura.marches.api.request.ReceptionProvisoireDto;
import ma.nafura.marches.api.request.ReserveReceptionCreateDto;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.domain.model.ReceptionMarche;
import ma.nafura.marches.domain.model.ReserveReception;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.ReceptionMarcheRepository;
import ma.nafura.marches.repository.ReserveReceptionRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ReceptionMarcheService {

    private final ReceptionMarcheRepository receptionRepository;
    private final ReserveReceptionRepository reserveRepository;
    private final ContratMarcheRepository contratRepository;
    private final ReceptionMarcheSeedService seedService;
    private final ObjectProvider<DgdMarcheService> dgdMarcheServiceProvider;

    public ReceptionMarcheService(
            ReceptionMarcheRepository receptionRepository,
            ReserveReceptionRepository reserveRepository,
            ContratMarcheRepository contratRepository,
            ReceptionMarcheSeedService seedService,
            ObjectProvider<DgdMarcheService> dgdMarcheServiceProvider) {
        this.receptionRepository = receptionRepository;
        this.reserveRepository = reserveRepository;
        this.contratRepository = contratRepository;
        this.seedService = seedService;
        this.dgdMarcheServiceProvider = dgdMarcheServiceProvider;
    }

    @Transactional
    public ReceptionMarche receptionProvisoire(String contratId, ReceptionProvisoireDto body) {
        seedService.seedIfEmpty();
        ContratMarche contrat = resolveContrat(contratId)
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        String status = contrat.getStatus();
        if (!ContratMarche.STATUS_EN_COURS.equals(status)
                && !ContratMarche.STATUS_NOTIFIE.equals(status)) {
            throw new IllegalStateException(
                    "Provisional reception requires EN_COURS or NOTIFIE status, got " + status);
        }
        UUID tenantId = tenantId();
        LocalDate date = body != null && body.getDateReception() != null
                ? body.getDateReception()
                : LocalDate.now();
        String pv = body != null ? trimOrNull(body.getPvReference()) : null;
        String id = body != null && StringUtils.hasText(body.getId())
                ? body.getId().trim()
                : nextReceptionId(tenantId);
        if (receptionRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Reception id already exists: " + id);
        }
        ReceptionMarche reception = ReceptionMarche.builder()
                .id(id)
                .tenantId(tenantId)
                .contratMarcheId(contrat.getId())
                .type(ReceptionMarche.TYPE_PROVISOIRE)
                .dateReception(date)
                .pvReference(pv)
                .status(ReceptionMarche.STATUS_VALIDE)
                .build();
        ReceptionMarche saved = receptionRepository.save(reception);
        contrat.setStatus(ContratMarche.STATUS_RECEPTION_PROVISOIRE);
        contrat.setUpdatedAt(OffsetDateTime.now());
        contratRepository.save(contrat);
        return saved;
    }

    @Transactional
    public ReceptionMarche receptionDefinitive(String contratId, ReceptionDefinitiveDto body) {
        seedService.seedIfEmpty();
        ContratMarche contrat = resolveContrat(contratId)
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        if (!ContratMarche.STATUS_RECEPTION_PROVISOIRE.equals(contrat.getStatus())) {
            throw new IllegalStateException("Final reception requires RECEPTION_PROVISOIRE status");
        }
        UUID tenantId = tenantId();
        LocalDate date = body != null && body.getDateReception() != null
                ? body.getDateReception()
                : LocalDate.now();
        String pv = body != null ? trimOrNull(body.getPvReference()) : null;
        String id = body != null && StringUtils.hasText(body.getId())
                ? body.getId().trim()
                : nextReceptionId(tenantId);
        if (receptionRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Reception id already exists: " + id);
        }
        ReceptionMarche reception = ReceptionMarche.builder()
                .id(id)
                .tenantId(tenantId)
                .contratMarcheId(contrat.getId())
                .type(ReceptionMarche.TYPE_DEFINITIVE)
                .dateReception(date)
                .pvReference(pv)
                .status(ReceptionMarche.STATUS_VALIDE)
                .build();
        ReceptionMarche saved = receptionRepository.save(reception);
        contrat.setStatus(ContratMarche.STATUS_RECEPTION_DEFINITIVE);
        contrat.setUpdatedAt(OffsetDateTime.now());
        contratRepository.save(contrat);
        triggerDgdGeneration(contrat.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<ReserveReception> listReserves(String receptionId) {
        seedService.seedIfEmpty();
        ReceptionMarche reception = getReception(receptionId);
        return reserveRepository.findByTenantIdAndReceptionIdOrderByCreatedAtAsc(
                tenantId(), reception.getId());
    }

    @Transactional
    public ReserveReception createReserve(String receptionId, ReserveReceptionCreateDto request) {
        seedService.seedIfEmpty();
        ReceptionMarche reception = getReception(receptionId);
        if (!ReceptionMarche.TYPE_PROVISOIRE.equals(reception.getType())) {
            throw new IllegalStateException("Reserves can only be added to provisional receptions");
        }
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId())
                ? request.getId().trim()
                : nextReserveId(tenantId);
        if (reserveRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Reserve id already exists: " + id);
        }
        ReserveReception entity = ReserveReception.builder()
                .id(id)
                .tenantId(tenantId)
                .receptionId(reception.getId())
                .libelle(request.getLibelle().trim())
                .dateLimiteLevee(request.getDateLimiteLevee())
                .status(ReserveReception.STATUS_OUVERTE)
                .build();
        return reserveRepository.save(entity);
    }

    @Transactional
    public ReserveReception leverReserve(String reserveId) {
        seedService.seedIfEmpty();
        ReserveReception entity = resolveReserve(reserveId)
                .orElseThrow(() -> new IllegalArgumentException("Reserve not found"));
        if (ReserveReception.STATUS_LEVEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Reserve is already lifted");
        }
        entity.setStatus(ReserveReception.STATUS_LEVEE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return reserveRepository.save(entity);
    }

    private ReceptionMarche getReception(String id) {
        return resolveReception(id).orElseThrow(() -> new IllegalArgumentException("Reception not found"));
    }

    private Optional<ReceptionMarche> resolveReception(String id) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        return receptionRepository.findByIdAndTenantId(id.trim(), tenantId);
    }

    private Optional<ReserveReception> resolveReserve(String id) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        return reserveRepository.findByIdAndTenantId(id.trim(), tenantId);
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

    private void triggerDgdGeneration(String contratId) {
        DgdMarcheService dgdService = dgdMarcheServiceProvider.getIfAvailable();
        if (dgdService == null) {
            return;
        }
        try {
            dgdService.generateFromContrat(contratId);
        } catch (RuntimeException ex) {
            // DGD generation is best-effort after definitive reception
        }
    }

    private String nextReceptionId(UUID tenantId) {
        long count = receptionRepository.countByTenantId(tenantId) + 1;
        return "rec-" + String.format("%03d", count);
    }

    private String nextReserveId(UUID tenantId) {
        long count = reserveRepository.countByTenantId(tenantId) + 1;
        return "rsv-" + String.format("%03d", count);
    }

    private String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
