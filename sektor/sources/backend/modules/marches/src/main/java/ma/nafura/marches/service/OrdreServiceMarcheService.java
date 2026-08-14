package ma.nafura.marches.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.api.request.OrdreServiceMarcheCreateDto;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.domain.model.OrdreServiceMarche;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.marches.repository.OrdreServiceMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class OrdreServiceMarcheService {

    private static final Logger log = LoggerFactory.getLogger(OrdreServiceMarcheService.class);

    private final OrdreServiceMarcheRepository ordreRepository;
    private final ContratMarcheRepository contratRepository;
    private final OrdreServiceMarcheSeedService seedService;

    public OrdreServiceMarcheService(
            OrdreServiceMarcheRepository ordreRepository,
            ContratMarcheRepository contratRepository,
            OrdreServiceMarcheSeedService seedService) {
        this.ordreRepository = ordreRepository;
        this.contratRepository = contratRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<OrdreServiceMarche> list(String contratId) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        if (StringUtils.hasText(contratId)) {
            return ordreRepository.findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(
                    tenantId, contratId.trim());
        }
        return ordreRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public OrdreServiceMarche getById(String id) {
        seedService.seedIfEmpty();
        return resolveOrdre(id).orElseThrow(() -> new IllegalArgumentException("Ordre de service not found"));
    }

    @Transactional
    public OrdreServiceMarche create(OrdreServiceMarcheCreateDto request) {
        UUID tenantId = tenantId();
        ContratMarche contrat = resolveContrat(request.getContratMarcheId())
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextOrdreId(tenantId);
        if (ordreRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Ordre de service id already exists: " + id);
        }
        String numero = StringUtils.hasText(request.getNumero())
                ? request.getNumero().trim()
                : nextNumero(tenantId);
        String chantierId = trimOrNull(request.getChantierId());
        String chantierCode = trimOrNull(request.getChantierCode());
        if (!StringUtils.hasText(chantierId) && StringUtils.hasText(contrat.getChantierId())) {
            chantierId = contrat.getChantierId();
        }
        if (!StringUtils.hasText(chantierCode) && StringUtils.hasText(contrat.getChantierCode())) {
            chantierCode = contrat.getChantierCode();
        }
        OrdreServiceMarche entity = OrdreServiceMarche.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(numero)
                .contratMarcheId(contrat.getId())
                .chantierId(chantierId)
                .chantierCode(chantierCode)
                .type(resolveType(request.getType(), OrdreServiceMarche.TYPE_NOTIFICATION))
                .dateEmission(request.getDateEmission() != null ? request.getDateEmission() : LocalDate.now())
                .emetteur(resolveEmetteur(request.getEmetteur()))
                .objet(trimOrNull(request.getObjet()))
                .description(trimOrNull(request.getDescription()))
                .impactDelai(request.getImpactDelai())
                .impactCout(request.getImpactCout())
                .status(resolveStatus(request.getStatus(), OrdreServiceMarche.STATUS_BROUILLON))
                .build();
        return ordreRepository.save(entity);
    }

    @Transactional
    public OrdreServiceMarche notifier(String id) {
        OrdreServiceMarche entity = getById(id);
        if (OrdreServiceMarche.STATUS_ANNULE.equals(entity.getStatus())) {
            throw new IllegalStateException("Cannot notify a cancelled ordre de service");
        }
        if (OrdreServiceMarche.STATUS_BROUILLON.equals(entity.getStatus())) {
            entity.setStatus(OrdreServiceMarche.STATUS_EMIS);
        } else if (OrdreServiceMarche.STATUS_EMIS.equals(entity.getStatus())) {
            entity.setStatus(OrdreServiceMarche.STATUS_RECEPTIONNE);
            if (entity.getDateAccuseReception() == null) {
                entity.setDateAccuseReception(LocalDate.now());
            }
        }
        entity.setUpdatedAt(OffsetDateTime.now());
        if (OrdreServiceMarche.TYPE_ARRET.equals(entity.getType())) {
            log.info(
                    "[STUB] Chantier {} (id={}) would be set to SUSPENDU — cross-domain Chantiers not wired",
                    entity.getChantierCode(),
                    entity.getChantierId());
        }
        return ordreRepository.save(entity);
    }

    private Optional<OrdreServiceMarche> resolveOrdre(String id) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        return ordreRepository.findByIdAndTenantId(id.trim(), tenantId);
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
        long count = ordreRepository.countByTenantId(tenantId) + 1;
        return "OS-" + java.time.Year.now().getValue() + "-" + String.format("%03d", count);
    }

    private String nextOrdreId(UUID tenantId) {
        long count = ordreRepository.countByTenantId(tenantId) + 1;
        return "os-" + String.format("%03d", count);
    }

    private String resolveType(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case OrdreServiceMarche.TYPE_COMMENCEMENT,
                    OrdreServiceMarche.TYPE_ARRET,
                    OrdreServiceMarche.TYPE_REPRISE,
                    OrdreServiceMarche.TYPE_MODIFICATION,
                    OrdreServiceMarche.TYPE_NOTIFICATION -> normalized;
            default -> fallback;
        };
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case OrdreServiceMarche.STATUS_BROUILLON,
                    OrdreServiceMarche.STATUS_EMIS,
                    OrdreServiceMarche.STATUS_RECEPTIONNE,
                    OrdreServiceMarche.STATUS_ANNULE -> normalized;
            default -> fallback;
        };
    }

    private String resolveEmetteur(String requested) {
        if (!StringUtils.hasText(requested)) {
            return "MOA";
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "MOA", "MOE", "NAFURA" -> normalized;
            default -> "MOA";
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
