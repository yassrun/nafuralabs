package ma.nafura.rh.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.dto.HeureSupplementaireSyntheseDto;
import ma.nafura.rh.api.request.HeureSupplementaireCreateDto;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.domain.model.HeureSupplementaire;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.HeureSupplementaireRepository;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class HeureSupplementaireService {

    private static final BigDecimal HEURES_MENSUELLES = new BigDecimal("191");
    private static final Pattern ID_SUFFIX = Pattern.compile("^hs-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern MOIS_PATTERN = Pattern.compile("^\\d{4}-\\d{2}$");

    private final HeureSupplementaireRepository repository;
    private final EmployeRepository employeRepository;
    private final HeureSupplementaireSeedService seedService;

    public HeureSupplementaireService(
            HeureSupplementaireRepository repository,
            EmployeRepository employeRepository,
            HeureSupplementaireSeedService seedService) {
        this.repository = repository;
        this.employeRepository = employeRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<HeureSupplementaire> list(String employeId, String mois) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<HeureSupplementaire> rows = loadRows(tenantId, employeId, mois);
        return rows;
    }

    @Transactional
    public HeureSupplementaire create(HeureSupplementaireCreateDto request) {
        UUID tenantId = tenantId();
        Employe employe = requireEmploye(request.getEmployeId());
        String type = resolveType(request.getType());
        BigDecimal tauxMajoration = tauxForType(type);
        BigDecimal montant = computeMontant(employe.getSalaireBase(), request.getHeures(), tauxMajoration);

        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Heure supplementaire id already exists: " + id);
        }

        HeureSupplementaire entity = HeureSupplementaire.builder()
                .id(id)
                .tenantId(tenantId)
                .employeId(employe.getId())
                .date(request.getDate())
                .type(type)
                .heures(request.getHeures())
                .tauxMajoration(tauxMajoration)
                .montant(montant)
                .status(resolveStatus(request.getStatus(), HeureSupplementaire.STATUS_BROUILLON))
                .pointageId(trimOrNull(request.getPointageId()))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public HeureSupplementaire valider(String id) {
        HeureSupplementaire entity = getById(id);
        if (!HeureSupplementaire.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft heures supplementaires can be validated");
        }
        entity.setStatus(HeureSupplementaire.STATUS_VALIDE);
        return repository.save(entity);
    }

    @Transactional(readOnly = true)
    public HeureSupplementaireSyntheseDto synthese(String employeId, LocalDate from, LocalDate to) {
        seedService.seedIfEmpty();
        if (!StringUtils.hasText(employeId)) {
            throw new IllegalArgumentException("employeId is required");
        }
        if (from == null || to == null) {
            throw new IllegalArgumentException("from and to dates are required");
        }
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("to must be on or after from");
        }

        UUID tenantId = tenantId();
        requireEmploye(employeId.trim());
        List<HeureSupplementaire> rows = repository.findByTenantIdAndEmployeIdAndDateBetweenOrderByDateDescIdDesc(
                tenantId, employeId.trim(), from, to);

        BigDecimal heuresHS25 = BigDecimal.ZERO;
        BigDecimal heuresHS50 = BigDecimal.ZERO;
        BigDecimal heuresHS100 = BigDecimal.ZERO;
        BigDecimal montantHS25 = BigDecimal.ZERO;
        BigDecimal montantHS50 = BigDecimal.ZERO;
        BigDecimal montantHS100 = BigDecimal.ZERO;
        long lignesValidees = 0;
        long lignesBrouillon = 0;

        for (HeureSupplementaire row : rows) {
            if (HeureSupplementaire.STATUS_VALIDE.equals(row.getStatus())
                    || HeureSupplementaire.STATUS_INTEGREE_PAIE.equals(row.getStatus())) {
                lignesValidees++;
            } else if (HeureSupplementaire.STATUS_BROUILLON.equals(row.getStatus())) {
                lignesBrouillon++;
            }

            switch (row.getType()) {
                case HeureSupplementaire.TYPE_HS25 -> {
                    heuresHS25 = heuresHS25.add(row.getHeures());
                    montantHS25 = montantHS25.add(row.getMontant());
                }
                case HeureSupplementaire.TYPE_HS50 -> {
                    heuresHS50 = heuresHS50.add(row.getHeures());
                    montantHS50 = montantHS50.add(row.getMontant());
                }
                case HeureSupplementaire.TYPE_HS100 -> {
                    heuresHS100 = heuresHS100.add(row.getHeures());
                    montantHS100 = montantHS100.add(row.getMontant());
                }
                default -> { }
            }
        }

        return HeureSupplementaireSyntheseDto.builder()
                .employeId(employeId.trim())
                .from(from.toString())
                .to(to.toString())
                .heuresHS25(heuresHS25)
                .heuresHS50(heuresHS50)
                .heuresHS100(heuresHS100)
                .montantHS25(montantHS25)
                .montantHS50(montantHS50)
                .montantHS100(montantHS100)
                .montantTotal(montantHS25.add(montantHS50).add(montantHS100))
                .lignesValidees(lignesValidees)
                .lignesBrouillon(lignesBrouillon)
                .build();
    }

    static BigDecimal tauxForType(String type) {
        return switch (type) {
            case HeureSupplementaire.TYPE_HS25 -> new BigDecimal("0.2500");
            case HeureSupplementaire.TYPE_HS50 -> new BigDecimal("0.5000");
            case HeureSupplementaire.TYPE_HS100 -> new BigDecimal("1.0000");
            default -> throw new IllegalArgumentException("Invalid heure supplementaire type: " + type);
        };
    }

    static BigDecimal computeMontant(BigDecimal salaireBase, BigDecimal heures, BigDecimal tauxMajoration) {
        BigDecimal base = salaireBase != null ? salaireBase : BigDecimal.ZERO;
        BigDecimal h = heures != null ? heures : BigDecimal.ZERO;
        BigDecimal tauxHoraire = base.divide(HEURES_MENSUELLES, 6, RoundingMode.HALF_UP);
        return h.multiply(tauxHoraire)
                .multiply(BigDecimal.ONE.add(tauxMajoration))
                .setScale(4, RoundingMode.HALF_UP);
    }

    private HeureSupplementaire getById(String id) {
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Heure supplementaire not found"));
    }

    private Optional<HeureSupplementaire> resolve(String rawId) {
        String normalized = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(normalized)) {
            return Optional.empty();
        }
        return repository.findByIdAndTenantId(normalized, tenantId());
    }

    private List<HeureSupplementaire> loadRows(UUID tenantId, String employeId, String mois) {
        String normalizedEmployeId = normalizeFilter(employeId);
        String normalizedMois = normalizeFilter(mois);

        if (normalizedEmployeId != null && normalizedMois != null) {
            YearMonth yearMonth = parseMois(normalizedMois);
            LocalDate from = yearMonth.atDay(1);
            LocalDate to = yearMonth.atEndOfMonth();
            return repository.findByTenantIdAndEmployeIdAndDateBetweenOrderByDateDescIdDesc(
                    tenantId, normalizedEmployeId, from, to);
        }
        if (normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdOrderByDateDescIdDesc(tenantId, normalizedEmployeId);
        }
        if (normalizedMois != null) {
            YearMonth yearMonth = parseMois(normalizedMois);
            return repository.findByTenantIdAndDateBetweenOrderByDateDescIdDesc(
                    tenantId, yearMonth.atDay(1), yearMonth.atEndOfMonth());
        }
        return repository.findByTenantIdOrderByDateDescIdDesc(tenantId);
    }

    private YearMonth parseMois(String mois) {
        if (!MOIS_PATTERN.matcher(mois).matches()) {
            throw new IllegalArgumentException("Invalid mois format, expected yyyy-MM");
        }
        return YearMonth.parse(mois);
    }

    private Employe requireEmploye(String employeId) {
        return employeRepository
                .findByIdAndTenantId(employeId.trim(), tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Employe not found: " + employeId));
    }

    private String resolveType(String rawType) {
        if (!StringUtils.hasText(rawType)) {
            throw new IllegalArgumentException("type is required");
        }
        String normalized = rawType.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case HeureSupplementaire.TYPE_HS25,
                    HeureSupplementaire.TYPE_HS50,
                    HeureSupplementaire.TYPE_HS100 -> normalized;
            default -> throw new IllegalArgumentException("Invalid type, expected HS25, HS50 or HS100");
        };
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case HeureSupplementaire.STATUS_BROUILLON,
                    HeureSupplementaire.STATUS_VALIDE,
                    HeureSupplementaire.STATUS_INTEGREE_PAIE,
                    HeureSupplementaire.STATUS_REJETE -> normalized;
            default -> fallback;
        };
    }

    private String nextId(UUID tenantId) {
        int max = 0;
        for (HeureSupplementaire row : repository.findByTenantIdOrderByDateDescIdDesc(tenantId)) {
            Matcher matcher = ID_SUFFIX.matcher(row.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "hs-%03d", max + 1);
    }

    private String normalizeFilter(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String trimOrNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
