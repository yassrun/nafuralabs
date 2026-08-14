package ma.nafura.marches.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.marches.api.dto.CautionRenouvelerDto;
import ma.nafura.marches.api.request.CautionMarcheCreateDto;
import ma.nafura.marches.domain.model.CautionMarche;
import ma.nafura.marches.domain.model.ContratMarche;
import ma.nafura.marches.repository.CautionMarcheRepository;
import ma.nafura.marches.repository.ContratMarcheRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CautionMarcheService {

    private static final List<String> ACTIVE_STATUSES =
            List.of(CautionMarche.STATUS_ACTIVE, CautionMarche.STATUS_RENOUVELEE);

    private final CautionMarcheRepository cautionRepository;
    private final ContratMarcheRepository contratRepository;
    private final CautionMarcheSeedService seedService;

    public CautionMarcheService(
            CautionMarcheRepository cautionRepository,
            ContratMarcheRepository contratRepository,
            CautionMarcheSeedService seedService) {
        this.cautionRepository = cautionRepository;
        this.contratRepository = contratRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<CautionMarche> list(String contratId, String status, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<CautionMarche> rows = loadRows(tenantId, contratId, status);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(c -> matchesSearch(c, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public CautionMarche getById(String id) {
        seedService.seedIfEmpty();
        return resolveCaution(id).orElseThrow(() -> new IllegalArgumentException("Caution not found"));
    }

    @Transactional
    public CautionMarche create(CautionMarcheCreateDto request) {
        UUID tenantId = tenantId();
        ContratMarche contrat = resolveContrat(request.getContratMarcheId())
                .orElseThrow(() -> new IllegalArgumentException("Contrat marché not found"));
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextCautionId(tenantId);
        if (cautionRepository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Caution id already exists: " + id);
        }
        String numero = StringUtils.hasText(request.getNumero())
                ? request.getNumero().trim()
                : nextNumero(tenantId);
        CautionMarche entity = CautionMarche.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(numero)
                .contratMarcheId(contrat.getId())
                .marcheNumero(contrat.getNumero())
                .type(resolveType(request.getType(), CautionMarche.TYPE_PROVISOIRE))
                .banquePartnerId(trimOrNull(request.getBanquePartnerId()))
                .banqueNom(trimOrNull(request.getBanqueNom()))
                .montant(request.getMontant() != null ? request.getMontant() : java.math.BigDecimal.ZERO)
                .dateEmission(request.getDateEmission())
                .dateExpiration(request.getDateExpiration())
                .status(resolveStatus(request.getStatus(), CautionMarche.STATUS_ACTIVE))
                .scanUrl(trimOrNull(request.getScanUrl()))
                .build();
        return cautionRepository.save(entity);
    }

    @Transactional
    public CautionMarche renouveler(String id, CautionRenouvelerDto body) {
        CautionMarche entity = getById(id);
        if (CautionMarche.STATUS_MAINLEVEE.equals(entity.getStatus())
                || CautionMarche.STATUS_EXPIRE.equals(entity.getStatus())) {
            throw new IllegalStateException("Cannot renew a released or expired caution");
        }
        if (body != null && body.getDateExpiration() != null) {
            entity.setDateExpiration(body.getDateExpiration());
        } else if (entity.getDateExpiration() != null) {
            entity.setDateExpiration(entity.getDateExpiration().plusYears(1));
        }
        if (body != null && body.getMontant() != null) {
            entity.setMontant(body.getMontant());
        }
        entity.setStatus(CautionMarche.STATUS_RENOUVELEE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return cautionRepository.save(entity);
    }

    @Transactional
    public CautionMarche demanderMainlevee(String id) {
        CautionMarche entity = getById(id);
        if (CautionMarche.STATUS_MAINLEVEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Caution is already released");
        }
        entity.setStatus(CautionMarche.STATUS_EN_MAINLEVEE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return cautionRepository.save(entity);
    }

    @Transactional
    public CautionMarche mainlever(String id) {
        CautionMarche entity = getById(id);
        if (CautionMarche.STATUS_MAINLEVEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Caution is already released");
        }
        entity.setStatus(CautionMarche.STATUS_MAINLEVEE);
        entity.setUpdatedAt(OffsetDateTime.now());
        return cautionRepository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<CautionMarche> expirant(int days) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(Math.max(days, 0));
        return cautionRepository.findByTenantIdAndStatusInAndDateExpirationBetweenOrderByDateExpirationAsc(
                tenantId, ACTIVE_STATUSES, today, limit);
    }

    private List<CautionMarche> loadRows(UUID tenantId, String contratId, String status) {
        List<CautionMarche> rows;
        if (StringUtils.hasText(contratId)) {
            rows = cautionRepository.findByTenantIdAndContratMarcheIdOrderByCreatedAtDesc(
                    tenantId, contratId.trim());
        } else {
            rows = cautionRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        }
        if (StringUtils.hasText(status)) {
            String st = status.trim();
            rows = rows.stream().filter(c -> st.equals(c.getStatus())).toList();
        }
        return rows;
    }

    private Optional<CautionMarche> resolveCaution(String id) {
        UUID tenantId = tenantId();
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        return cautionRepository.findByIdAndTenantId(id.trim(), tenantId);
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
        long count = cautionRepository.countByTenantId(tenantId) + 1;
        return "CB-" + java.time.Year.now().getValue() + "-" + String.format("%03d", count);
    }

    private String nextCautionId(UUID tenantId) {
        long count = cautionRepository.countByTenantId(tenantId) + 1;
        return "cb-" + String.format("%03d", count);
    }

    private String resolveType(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case CautionMarche.TYPE_PROVISOIRE,
                    CautionMarche.TYPE_DEFINITIVE,
                    CautionMarche.TYPE_RG,
                    CautionMarche.TYPE_AVANCE -> normalized;
            case "RESTITUTION_AVANCE" -> CautionMarche.TYPE_AVANCE;
            case "RETENUE_GARANTIE" -> CautionMarche.TYPE_RG;
            default -> fallback;
        };
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case CautionMarche.STATUS_ACTIVE,
                    CautionMarche.STATUS_RENOUVELEE,
                    CautionMarche.STATUS_MAINLEVEE,
                    CautionMarche.STATUS_EXPIRE,
                    CautionMarche.STATUS_EN_MAINLEVEE -> normalized;
            case "LEVEE" -> CautionMarche.STATUS_MAINLEVEE;
            case "EMISE" -> CautionMarche.STATUS_ACTIVE;
            default -> fallback;
        };
    }

    private boolean matchesSearch(CautionMarche c, String term) {
        return contains(c.getNumero(), term) || contains(c.getBanqueNom(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
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
