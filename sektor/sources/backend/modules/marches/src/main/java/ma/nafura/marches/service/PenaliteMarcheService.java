package ma.nafura.marches.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.api.request.PenaliteMarcheCreateDto;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.domain.model.PenaliteMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.PenaliteMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PenaliteMarcheService {

    private static final Logger log = LoggerFactory.getLogger(PenaliteMarcheService.class);

    private final PenaliteMarcheRepository penaliteRepository;
    private final ContratMarcheRepository contratRepository;
    private final PenaliteMarcheSeedService seedService;

    public PenaliteMarcheService(
            PenaliteMarcheRepository penaliteRepository,
            ContratMarcheRepository contratRepository,
            PenaliteMarcheSeedService seedService) {
        this.penaliteRepository = penaliteRepository;
        this.contratRepository = contratRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<PenaliteMarche> list(String contratId) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        if (StringUtils.hasText(contratId)) {
            return penaliteRepository.findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(
                    tenantId, contratId.trim());
        }
        return penaliteRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional
    public PenaliteMarche create(PenaliteMarcheCreateDto request) {
        UUID tenantId = tenantId();
        ContratMarche contrat = resolveContrat(request.getContratMarcheId())
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextPenaliteId(tenantId);
        if (penaliteRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Penalite id already exists: " + id);
        }
        String numero = StringUtils.hasText(request.getNumero())
                ? request.getNumero().trim()
                : nextNumero(tenantId);
        PenaliteMarche entity = PenaliteMarche.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(numero)
                .contratMarcheId(contrat.getId())
                .marcheNumero(contrat.getNumero())
                .type(resolveType(request.getType(), PenaliteMarche.TYPE_RETARD))
                .motif(trimOrNull(request.getMotif()))
                .montantHt(request.getMontantHt() != null ? request.getMontantHt() : java.math.BigDecimal.ZERO)
                .joursRetard(request.getJoursRetard())
                .dateConstat(request.getDateConstat())
                .status(resolveStatus(request.getStatus(), PenaliteMarche.STATUS_BROUILLON))
                .build();
        return penaliteRepository.save(entity);
    }

    @Transactional
    public PenaliteMarche valider(String id) {
        PenaliteMarche entity = getById(id);
        if (PenaliteMarche.STATUS_VALIDEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Penalite is already validated");
        }
        if (PenaliteMarche.STATUS_ANNULEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Cannot validate a cancelled penalite");
        }
        entity.setStatus(PenaliteMarche.STATUS_VALIDEE);
        entity.setUpdatedAt(OffsetDateTime.now());
        log.info("Penalite {} validated — ready for DGD integration (stub)", entity.getNumero());
        return penaliteRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public PenaliteMarche getById(String id) {
        seedService.seedIfEmpty();
        return resolvePenalite(id).orElseThrow(() -> new IllegalArgumentException("Penalite not found"));
    }

    private Optional<PenaliteMarche> resolvePenalite(String id) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        return penaliteRepository.findByIdAndTenantId(id.trim(), tenantId);
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
        long count = penaliteRepository.countByTenantId(tenantId) + 1;
        return "PEN-" + java.time.Year.now().getValue() + "-" + String.format("%03d", count);
    }

    private String nextPenaliteId(UUID tenantId) {
        long count = penaliteRepository.countByTenantId(tenantId) + 1;
        return "pen-" + String.format("%03d", count);
    }

    private String resolveType(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case PenaliteMarche.TYPE_RETARD,
                    PenaliteMarche.TYPE_QUALITE,
                    PenaliteMarche.TYPE_AUTRE -> normalized;
            default -> fallback;
        };
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case PenaliteMarche.STATUS_BROUILLON,
                    PenaliteMarche.STATUS_VALIDEE,
                    PenaliteMarche.STATUS_ANNULEE -> normalized;
            default -> fallback;
        };
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
