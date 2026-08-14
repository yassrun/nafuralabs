package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.request.FraisDeplacementCreateDto;
import ma.nafura.rh.api.request.FraisDeplacementUpdateDto;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.domain.model.FraisDeplacement;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.FraisDeplacementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FraisDeplacementService {

    private static final Pattern FRAIS_ID_SUFFIX = Pattern.compile("^frd-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final FraisDeplacementRepository repository;
    private final EmployeRepository employeRepository;
    private final FraisDeplacementSeedService seedService;

    public FraisDeplacementService(
            FraisDeplacementRepository repository,
            EmployeRepository employeRepository,
            FraisDeplacementSeedService seedService) {
        this.repository = repository;
        this.employeRepository = employeRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<FraisDeplacement> list(String employeId, String status) {
        seedService.seedIfEmpty();
        return loadRows(tenantId(), employeId, status);
    }

    @Transactional(readOnly = true)
    public FraisDeplacement getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Frais deplacement not found"));
    }

    @Transactional
    public FraisDeplacement create(FraisDeplacementCreateDto request) {
        UUID tenantId = tenantId();
        Employe employe = requireEmploye(request.getEmployeId());

        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextFraisId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Frais deplacement id already exists: " + id);
        }

        FraisDeplacement entity = FraisDeplacement.builder()
                .id(id)
                .tenantId(tenantId)
                .employeId(employe.getId())
                .employeNom(resolveEmployeNom(request.getEmployeNom(), employe))
                .type(resolveType(request.getType()))
                .date(requireDate(request.getDate()))
                .montant(requireMontant(request.getMontant()))
                .km(request.getKm())
                .status(resolveStatus(request.getStatus(), FraisDeplacement.STATUS_BROUILLON))
                .build();
        validateKmForType(entity.getType(), entity.getKm());
        return repository.save(entity);
    }

    @Transactional
    public FraisDeplacement update(String id, FraisDeplacementUpdateDto request) {
        FraisDeplacement entity = getById(id);
        if (!FraisDeplacement.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft frais can be updated");
        }

        if (request.getEmployeId() != null) {
            Employe employe = requireEmploye(request.getEmployeId());
            entity.setEmployeId(employe.getId());
            entity.setEmployeNom(resolveEmployeNom(request.getEmployeNom(), employe));
        } else if (request.getEmployeNom() != null) {
            entity.setEmployeNom(trimOrNull(request.getEmployeNom()));
        }
        if (request.getType() != null) {
            entity.setType(resolveType(request.getType()));
        }
        if (request.getDate() != null) {
            entity.setDate(requireDate(request.getDate()));
        }
        if (request.getMontant() != null) {
            entity.setMontant(requireMontant(request.getMontant()));
        }
        if (request.getKm() != null) {
            entity.setKm(request.getKm());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        validateKmForType(entity.getType(), entity.getKm());
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        FraisDeplacement entity = getById(id);
        if (!FraisDeplacement.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft frais can be deleted");
        }
        repository.delete(entity);
    }

    @Transactional
    public FraisDeplacement submit(String id) {
        FraisDeplacement entity = getById(id);
        if (!FraisDeplacement.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft frais can be submitted");
        }
        entity.setStatus(FraisDeplacement.STATUS_SOUMIS);
        entity.setMotifRejet(null);
        return repository.save(entity);
    }

    @Transactional
    public FraisDeplacement approve(String id) {
        FraisDeplacement entity = getById(id);
        if (!FraisDeplacement.STATUS_SOUMIS.equals(entity.getStatus())) {
            throw new IllegalStateException("Only submitted frais can be approved");
        }
        entity.setStatus(FraisDeplacement.STATUS_APPROUVE);
        entity.setMotifRejet(null);
        return repository.save(entity);
    }

    @Transactional
    public FraisDeplacement reject(String id, String motifRejet) {
        FraisDeplacement entity = getById(id);
        if (!FraisDeplacement.STATUS_SOUMIS.equals(entity.getStatus())) {
            throw new IllegalStateException("Only submitted frais can be rejected");
        }
        if (!StringUtils.hasText(motifRejet)) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        entity.setStatus(FraisDeplacement.STATUS_REJETE);
        entity.setMotifRejet(motifRejet.trim());
        return repository.save(entity);
    }

    @Transactional
    public FraisDeplacement integrerPaie(String id) {
        FraisDeplacement entity = getById(id);
        if (!FraisDeplacement.STATUS_APPROUVE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only approved frais can be integrated into payroll");
        }
        // Stub: full FichePaie linkage (montant on fiche du mois) deferred.
        entity.setStatus(FraisDeplacement.STATUS_INTEGRE);
        return repository.save(entity);
    }

    private List<FraisDeplacement> loadRows(UUID tenantId, String employeId, String status) {
        String normalizedStatus = normalizeFilter(status);
        String normalizedEmployeId = normalizeFilter(employeId);

        if (normalizedStatus != null && normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdAndStatusOrderByDateDescIdDesc(
                    tenantId, normalizedEmployeId, normalizedStatus);
        }
        if (normalizedStatus != null) {
            return repository.findByTenantIdAndStatusOrderByDateDescIdDesc(tenantId, normalizedStatus);
        }
        if (normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdOrderByDateDescIdDesc(tenantId, normalizedEmployeId);
        }
        return repository.findByTenantIdOrderByDateDescIdDesc(tenantId);
    }

    private Optional<FraisDeplacement> resolve(String rawId) {
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

    private String resolveEmployeNom(String requested, Employe employe) {
        if (StringUtils.hasText(requested)) {
            return requested.trim();
        }
        return employe.getNom() + " " + employe.getPrenom();
    }

    private String resolveType(String type) {
        if (!StringUtils.hasText(type)) {
            throw new IllegalArgumentException("Type is required");
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case FraisDeplacement.TYPE_INDEMNITE_KM,
                    FraisDeplacement.TYPE_PANIER_REPAS,
                    FraisDeplacement.TYPE_HEBERGEMENT -> normalized;
            default -> throw new IllegalArgumentException("Invalid frais type: " + type);
        };
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case FraisDeplacement.STATUS_BROUILLON,
                    FraisDeplacement.STATUS_SOUMIS,
                    FraisDeplacement.STATUS_APPROUVE,
                    FraisDeplacement.STATUS_REJETE,
                    FraisDeplacement.STATUS_INTEGRE -> normalized;
            default -> fallback;
        };
    }

    private void validateKmForType(String type, BigDecimal km) {
        if (FraisDeplacement.TYPE_INDEMNITE_KM.equals(type) && km == null) {
            throw new IllegalArgumentException("Km is required for INDEMNITE_KM");
        }
    }

    private LocalDate requireDate(LocalDate date) {
        if (date == null) {
            throw new IllegalArgumentException("Date is required");
        }
        return date;
    }

    private BigDecimal requireMontant(BigDecimal montant) {
        if (montant == null) {
            throw new IllegalArgumentException("Montant is required");
        }
        if (montant.signum() <= 0) {
            throw new IllegalArgumentException("Montant must be positive");
        }
        return montant;
    }

    private String nextFraisId(UUID tenantId) {
        int max = 0;
        for (FraisDeplacement frais : repository.findByTenantIdOrderByDateDescIdDesc(tenantId)) {
            Matcher matcher = FRAIS_ID_SUFFIX.matcher(frais.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "frd-%03d", max + 1);
    }

    private String normalizeFilter(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
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
