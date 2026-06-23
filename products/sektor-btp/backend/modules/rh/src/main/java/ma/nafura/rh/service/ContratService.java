package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.request.ContratCreateDto;
import ma.nafura.rh.api.request.ContratSignCanvasDto;
import ma.nafura.rh.api.request.ContratUpdateDto;
import ma.nafura.rh.domain.model.Contrat;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.repository.ContratRepository;
import ma.nafura.rh.repository.EmployeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ContratService {

    private static final Pattern CONTRAT_ID_SUFFIX = Pattern.compile("^ctr-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final ContratRepository repository;
    private final EmployeRepository employeRepository;
    private final ContratHabilitationSeedService seedService;

    public ContratService(
            ContratRepository repository,
            EmployeRepository employeRepository,
            ContratHabilitationSeedService seedService) {
        this.repository = repository;
        this.employeRepository = employeRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<Contrat> list(String status, String employeId, String typeContrat, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Contrat> rows = loadRows(tenantId, status, employeId, typeContrat);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(c -> matchesSearch(c, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public Contrat getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Contrat not found"));
    }

    @Transactional
    public Contrat create(ContratCreateDto request) {
        UUID tenantId = tenantId();
        requireEmploye(request.getEmployeId());

        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextContratId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Contrat id already exists: " + id);
        }

        validateDates(request.getDateDebut(), request.getDateFin());

        Contrat entity = Contrat.builder()
                .id(id)
                .tenantId(tenantId)
                .employeId(request.getEmployeId().trim())
                .typeContrat(request.getTypeContrat().trim())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .salaireBase(defaultAmount(request.getSalaireBase()))
                .status(resolveStatus(request.getStatus(), Contrat.STATUS_BROUILLON))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public Contrat update(String id, ContratUpdateDto request) {
        Contrat entity = getById(id);
        if (request.getEmployeId() != null) {
            requireEmploye(request.getEmployeId());
            entity.setEmployeId(request.getEmployeId().trim());
        }
        if (request.getTypeContrat() != null) {
            entity.setTypeContrat(request.getTypeContrat().trim());
        }
        if (request.getDateDebut() != null) {
            entity.setDateDebut(request.getDateDebut());
        }
        if (request.getDateFin() != null) {
            entity.setDateFin(request.getDateFin());
        }
        validateDates(entity.getDateDebut(), entity.getDateFin());
        if (request.getSalaireBase() != null) {
            entity.setSalaireBase(defaultAmount(request.getSalaireBase()));
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        Contrat entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public Contrat signCanvas(String id, ContratSignCanvasDto request) {
        Contrat entity = getById(id);
        entity.setSignatureDataUrl(request.getSignatureDataUrl().trim());
        entity.setStatus(Contrat.STATUS_SIGNE);
        return repository.save(entity);
    }

    private List<Contrat> loadRows(UUID tenantId, String status, String employeId, String typeContrat) {
        String normalizedStatus = normalizeFilter(status);
        String normalizedEmployeId = normalizeFilter(employeId);
        String normalizedType = normalizeFilter(typeContrat);

        if (normalizedStatus != null && normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdAndStatusOrderByDateDebutDesc(
                            tenantId, normalizedEmployeId, normalizedStatus)
                    .stream()
                    .filter(c -> normalizedType == null || normalizedType.equals(c.getTypeContrat()))
                    .toList();
        }
        if (normalizedStatus != null) {
            return repository.findByTenantIdAndStatusOrderByDateDebutDesc(tenantId, normalizedStatus)
                    .stream()
                    .filter(c -> normalizedType == null || normalizedType.equals(c.getTypeContrat()))
                    .toList();
        }
        if (normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdOrderByDateDebutDesc(tenantId, normalizedEmployeId)
                    .stream()
                    .filter(c -> normalizedType == null || normalizedType.equals(c.getTypeContrat()))
                    .toList();
        }
        if (normalizedType != null) {
            return repository.findByTenantIdOrderByDateDebutDesc(tenantId).stream()
                    .filter(c -> normalizedType.equals(c.getTypeContrat()))
                    .toList();
        }
        return repository.findByTenantIdOrderByDateDebutDesc(tenantId);
    }

    private boolean matchesSearch(Contrat contrat, String term) {
        return contains(contrat.getEmployeId(), term)
                || contains(contrat.getTypeContrat(), term)
                || contains(contrat.getStatus(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private Optional<Contrat> resolve(String rawId) {
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

    private void validateDates(java.time.LocalDate dateDebut, java.time.LocalDate dateFin) {
        if (dateDebut == null) {
            throw new IllegalArgumentException("Start date is required");
        }
        if (dateFin != null && dateFin.isBefore(dateDebut)) {
            throw new IllegalArgumentException("End date must be on or after start date");
        }
    }

    private String nextContratId(UUID tenantId) {
        int max = 0;
        for (Contrat contrat : repository.findByTenantIdOrderByDateDebutDesc(tenantId)) {
            Matcher matcher = CONTRAT_ID_SUFFIX.matcher(contrat.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "ctr-%03d", max + 1);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case Contrat.STATUS_BROUILLON,
                    Contrat.STATUS_EN_COURS,
                    Contrat.STATUS_SIGNE,
                    Contrat.STATUS_EXPIRE,
                    Contrat.STATUS_RESILIE -> normalized;
            default -> fallback;
        };
    }

    private String normalizeFilter(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
