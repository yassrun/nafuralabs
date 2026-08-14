package ma.nafura.hse.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.hse.api.request.EpiDotationCreateDto;
import ma.nafura.hse.api.request.EpiDotationUpdateDto;
import ma.nafura.hse.domain.model.EpiDotation;
import ma.nafura.hse.repository.EpiDotationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class EpiDotationService {

    private static final Pattern EPI_ID_SUFFIX = Pattern.compile("^epi-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final EpiDotationRepository repository;
    private final EpiDotationSeedService seedService;
    private final EpiDotationStockMovementService stockMovementService;

    public EpiDotationService(
            EpiDotationRepository repository,
            EpiDotationSeedService seedService,
            EpiDotationStockMovementService stockMovementService) {
        this.repository = repository;
        this.seedService = seedService;
        this.stockMovementService = stockMovementService;
    }

    @Transactional(readOnly = true)
    public List<EpiDotation> list(String employeId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<EpiDotation> rows = loadRows(tenantId, employeId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(e -> matchesSearch(e, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<EpiDotation> listExpirant(int days, String employeId) {
        seedService.seedIfEmpty();
        if (days <= 0) {
            throw new IllegalArgumentException("days must be positive");
        }
        UUID tenantId = tenantId();
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(days);
        if (StringUtils.hasText(employeId)) {
            return repository.findByTenantIdAndEmployeIdAndDateExpirationBetweenOrderByDateExpirationAsc(
                    tenantId, employeId.trim(), from, to);
        }
        return repository.findByTenantIdAndDateExpirationBetweenOrderByDateExpirationAsc(tenantId, from, to);
    }

    @Transactional(readOnly = true)
    public EpiDotation getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("EPI dotation not found"));
    }

    @Transactional
    public EpiDotation create(EpiDotationCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextEpiId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("EPI dotation id already exists: " + id);
        }

        EpiDotation entity = EpiDotation.builder()
                .id(id)
                .tenantId(tenantId)
                .reference(request.getReference().trim())
                .designation(request.getDesignation().trim())
                .categorie(normalizeCategorie(request.getCategorie()))
                .marque(request.getMarque().trim())
                .normeCe(trimOrNull(request.getNormeCe()))
                .employeId(request.getEmployeId().trim())
                .employeNom(request.getEmployeNom().trim())
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .dateAttribution(request.getDateAttribution())
                .dateExpiration(request.getDateExpiration())
                .prixUnitaire(request.getPrixUnitaire() != null ? request.getPrixUnitaire() : BigDecimal.ZERO)
                .status(normalizeStatus(request.getStatus(), EpiDotation.STATUS_OK))
                .articleId(trimOrNull(request.getArticleId()))
                .dateDerniereVerification(request.getDateDerniereVerification())
                .prochaineVerification(request.getProchaineVerification())
                .build();
        EpiDotation saved = repository.save(entity);
        stockMovementService.triggerSortie(saved);
        return saved;
    }

    @Transactional
    public EpiDotation update(String id, EpiDotationUpdateDto request) {
        EpiDotation entity = getById(id);
        if (request.getReference() != null) {
            entity.setReference(request.getReference().trim());
        }
        if (request.getDesignation() != null) {
            entity.setDesignation(request.getDesignation().trim());
        }
        if (request.getCategorie() != null) {
            entity.setCategorie(normalizeCategorie(request.getCategorie()));
        }
        if (request.getMarque() != null) {
            entity.setMarque(request.getMarque().trim());
        }
        if (request.getNormeCe() != null) {
            entity.setNormeCe(trimOrNull(request.getNormeCe()));
        }
        if (request.getEmployeId() != null) {
            entity.setEmployeId(request.getEmployeId().trim());
        }
        if (request.getEmployeNom() != null) {
            entity.setEmployeNom(request.getEmployeNom().trim());
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getDateAttribution() != null) {
            entity.setDateAttribution(request.getDateAttribution());
        }
        if (request.getDateExpiration() != null) {
            entity.setDateExpiration(request.getDateExpiration());
        }
        if (request.getPrixUnitaire() != null) {
            entity.setPrixUnitaire(request.getPrixUnitaire());
        }
        if (request.getStatus() != null) {
            entity.setStatus(normalizeStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getArticleId() != null) {
            entity.setArticleId(trimOrNull(request.getArticleId()));
        }
        if (request.getDateDerniereVerification() != null) {
            entity.setDateDerniereVerification(request.getDateDerniereVerification());
        }
        if (request.getProchaineVerification() != null) {
            entity.setProchaineVerification(request.getProchaineVerification());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        EpiDotation entity = getById(id);
        repository.delete(entity);
    }

    private List<EpiDotation> loadRows(UUID tenantId, String employeId) {
        if (StringUtils.hasText(employeId)) {
            return repository.findByTenantIdAndEmployeIdOrderByDateAttributionDesc(tenantId, employeId.trim());
        }
        return repository.findByTenantIdOrderByDateAttributionDescCreatedAtDesc(tenantId);
    }

    private boolean matchesSearch(EpiDotation dotation, String term) {
        return contains(dotation.getReference(), term)
                || contains(dotation.getDesignation(), term)
                || contains(dotation.getEmployeNom(), term)
                || contains(dotation.getMarque(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private java.util.Optional<EpiDotation> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return repository.findByIdAndTenantId(id, tenantId());
    }

    private String nextEpiId(UUID tenantId) {
        int max = 0;
        for (EpiDotation dotation : repository.findByTenantIdOrderByDateAttributionDescCreatedAtDesc(tenantId)) {
            Matcher matcher = EPI_ID_SUFFIX.matcher(dotation.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "epi-%03d", max + 1);
    }

    private String normalizeCategorie(String raw) {
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeStatus(String raw, String fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
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
