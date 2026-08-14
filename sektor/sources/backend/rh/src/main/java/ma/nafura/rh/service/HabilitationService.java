package ma.nafura.rh.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.request.HabilitationCreateDto;
import ma.nafura.rh.api.request.HabilitationUpdateDto;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.domain.model.Habilitation;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.HabilitationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class HabilitationService {

    private static final Pattern HABILITATION_ID_SUFFIX = Pattern.compile("^hab-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final HabilitationRepository repository;
    private final EmployeRepository employeRepository;
    private final ContratHabilitationSeedService seedService;

    public HabilitationService(
            HabilitationRepository repository,
            EmployeRepository employeRepository,
            ContratHabilitationSeedService seedService) {
        this.repository = repository;
        this.employeRepository = employeRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<Habilitation> list(String employeId, String code, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Habilitation> rows = loadRows(tenantId, employeId, code);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(h -> matchesSearch(h, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<Habilitation> listExpirant(int days, String employeId) {
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
    public Habilitation getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Habilitation not found"));
    }

    @Transactional
    public Habilitation create(HabilitationCreateDto request) {
        UUID tenantId = tenantId();
        requireEmploye(request.getEmployeId());

        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextHabilitationId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Habilitation id already exists: " + id);
        }

        validateDates(request.getDateObtention(), request.getDateExpiration());

        Habilitation entity = Habilitation.builder()
                .id(id)
                .tenantId(tenantId)
                .employeId(request.getEmployeId().trim())
                .code(request.getCode().trim())
                .libelle(request.getLibelle().trim())
                .dateObtention(request.getDateObtention())
                .dateExpiration(request.getDateExpiration())
                .build();
        return repository.save(entity);
    }

    @Transactional
    public Habilitation update(String id, HabilitationUpdateDto request) {
        Habilitation entity = getById(id);
        if (request.getEmployeId() != null) {
            requireEmploye(request.getEmployeId());
            entity.setEmployeId(request.getEmployeId().trim());
        }
        if (request.getCode() != null) {
            entity.setCode(request.getCode().trim());
        }
        if (request.getLibelle() != null) {
            entity.setLibelle(request.getLibelle().trim());
        }
        if (request.getDateObtention() != null) {
            entity.setDateObtention(request.getDateObtention());
        }
        if (request.getDateExpiration() != null) {
            entity.setDateExpiration(request.getDateExpiration());
        }
        validateDates(entity.getDateObtention(), entity.getDateExpiration());
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        Habilitation entity = getById(id);
        repository.delete(entity);
    }

    private List<Habilitation> loadRows(UUID tenantId, String employeId, String code) {
        String normalizedEmployeId = normalizeFilter(employeId);
        String normalizedCode = normalizeFilter(code);

        if (normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdOrderByDateExpirationAsc(tenantId, normalizedEmployeId)
                    .stream()
                    .filter(h -> normalizedCode == null || normalizedCode.equals(h.getCode()))
                    .toList();
        }
        if (normalizedCode != null) {
            return repository.findByTenantIdOrderByDateExpirationAscDateObtentionDesc(tenantId).stream()
                    .filter(h -> normalizedCode.equals(h.getCode()))
                    .toList();
        }
        return repository.findByTenantIdOrderByDateExpirationAscDateObtentionDesc(tenantId);
    }

    private boolean matchesSearch(Habilitation habilitation, String term) {
        return contains(habilitation.getEmployeId(), term)
                || contains(habilitation.getCode(), term)
                || contains(habilitation.getLibelle(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private Optional<Habilitation> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        return repository.findByIdAndTenantId(id, tenantId());
    }

    private Employe requireEmploye(String employeId) {
        return employeRepository
                .findByIdAndTenantId(employeId.trim(), tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Employe not found: " + employeId));
    }

    private void validateDates(LocalDate dateObtention, LocalDate dateExpiration) {
        if (dateObtention == null) {
            throw new IllegalArgumentException("Obtention date is required");
        }
        if (dateExpiration != null && dateExpiration.isBefore(dateObtention)) {
            throw new IllegalArgumentException("Expiration date must be on or after obtention date");
        }
    }

    private String nextHabilitationId(UUID tenantId) {
        int max = 0;
        for (Habilitation habilitation : repository.findByTenantIdOrderByDateExpirationAscDateObtentionDesc(tenantId)) {
            Matcher matcher = HABILITATION_ID_SUFFIX.matcher(habilitation.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "hab-%03d", max + 1);
    }

    private String normalizeFilter(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
