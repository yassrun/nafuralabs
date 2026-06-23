package ma.nafura.hse.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.hse.api.request.VisiteMedicaleCreateDto;
import ma.nafura.hse.api.request.VisiteMedicaleUpdateDto;
import ma.nafura.hse.domain.model.VisiteMedicale;
import ma.nafura.hse.repository.VisiteMedicaleRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class VisiteMedicaleService {

    private static final Logger log = LoggerFactory.getLogger(VisiteMedicaleService.class);
    private static final Pattern VISITE_ID_SUFFIX = Pattern.compile("^vm-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final VisiteMedicaleRepository repository;
    private final VisiteMedicaleSeedService seedService;

    public VisiteMedicaleService(VisiteMedicaleRepository repository, VisiteMedicaleSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<VisiteMedicale> list(String employeId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<VisiteMedicale> rows = loadRows(tenantId, employeId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(v -> matchesSearch(v, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<VisiteMedicale> listEcheances(int days) {
        seedService.seedIfEmpty();
        if (days <= 0) {
            throw new IllegalArgumentException("days must be positive");
        }
        UUID tenantId = tenantId();
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(days);
        return repository.findByTenantIdAndProchaineEcheanceBetweenOrderByProchaineEcheanceAsc(tenantId, from, to);
    }

    @Transactional(readOnly = true)
    public VisiteMedicale getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Visite médicale not found"));
    }

    @Transactional
    public VisiteMedicale create(VisiteMedicaleCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextVisiteId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Visite médicale id already exists: " + id);
        }

        VisiteMedicale entity = VisiteMedicale.builder()
                .id(id)
                .tenantId(tenantId)
                .employeId(request.getEmployeId().trim())
                .employeMatricule(request.getEmployeMatricule().trim())
                .employeNom(request.getEmployeNom().trim())
                .posteOccupe(request.getPosteOccupe().trim())
                .type(normalizeType(request.getType()))
                .date(request.getDate())
                .aptitude(normalizeAptitude(request.getAptitude()))
                .medecinNom(request.getMedecinNom().trim())
                .restrictions(trimOrNull(request.getRestrictions()))
                .prochaineEcheance(request.getProchaineEcheance())
                .build();
        VisiteMedicale saved = repository.save(entity);
        notifyPointageIfInapte(saved);
        return saved;
    }

    @Transactional
    public VisiteMedicale update(String id, VisiteMedicaleUpdateDto request) {
        VisiteMedicale entity = getById(id);
        if (request.getEmployeId() != null) {
            entity.setEmployeId(request.getEmployeId().trim());
        }
        if (request.getEmployeMatricule() != null) {
            entity.setEmployeMatricule(request.getEmployeMatricule().trim());
        }
        if (request.getEmployeNom() != null) {
            entity.setEmployeNom(request.getEmployeNom().trim());
        }
        if (request.getPosteOccupe() != null) {
            entity.setPosteOccupe(request.getPosteOccupe().trim());
        }
        if (request.getType() != null) {
            entity.setType(normalizeType(request.getType()));
        }
        if (request.getDate() != null) {
            entity.setDate(request.getDate());
        }
        if (request.getAptitude() != null) {
            entity.setAptitude(normalizeAptitude(request.getAptitude()));
        }
        if (request.getMedecinNom() != null) {
            entity.setMedecinNom(request.getMedecinNom().trim());
        }
        if (request.getRestrictions() != null) {
            entity.setRestrictions(trimOrNull(request.getRestrictions()));
        }
        if (request.getProchaineEcheance() != null) {
            entity.setProchaineEcheance(request.getProchaineEcheance());
        }
        VisiteMedicale saved = repository.save(entity);
        notifyPointageIfInapte(saved);
        return saved;
    }

    @Transactional
    public void delete(String id) {
        VisiteMedicale entity = getById(id);
        repository.delete(entity);
    }

    /**
     * Stub Wave 4 RH : blocage pointage employé si aptitude INAPTE (pas de dépendance cross-domain).
     */
    private void notifyPointageIfInapte(VisiteMedicale visite) {
        if (!VisiteMedicale.APTITUDE_INAPTE.equals(visite.getAptitude())) {
            return;
        }
        // TODO(Wave4-RH): appeler PointageService.blockEmploye(employeId) lorsque le module RH est disponible.
        log.info(
                "HSE visite médicale INAPTE — pointage à bloquer pour employeId={} visiteId={} date={}",
                visite.getEmployeId(),
                visite.getId(),
                visite.getDate());
    }

    private List<VisiteMedicale> loadRows(UUID tenantId, String employeId) {
        if (StringUtils.hasText(employeId)) {
            return repository.findByTenantIdAndEmployeIdOrderByDateDescCreatedAtDesc(tenantId, employeId.trim());
        }
        return repository.findByTenantIdOrderByDateDescCreatedAtDesc(tenantId);
    }

    private boolean matchesSearch(VisiteMedicale visite, String term) {
        return contains(visite.getEmployeNom(), term)
                || contains(visite.getEmployeMatricule(), term)
                || contains(visite.getMedecinNom(), term)
                || contains(visite.getPosteOccupe(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private java.util.Optional<VisiteMedicale> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return repository.findByIdAndTenantId(id, tenantId());
    }

    private String nextVisiteId(UUID tenantId) {
        int max = 0;
        for (VisiteMedicale visite : repository.findByTenantIdOrderByDateDescCreatedAtDesc(tenantId)) {
            Matcher matcher = VISITE_ID_SUFFIX.matcher(visite.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "vm-%03d", max + 1);
    }

    private String normalizeType(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw new IllegalArgumentException("type is required");
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeAptitude(String raw) {
        if (!StringUtils.hasText(raw)) {
            throw new IllegalArgumentException("aptitude is required");
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
