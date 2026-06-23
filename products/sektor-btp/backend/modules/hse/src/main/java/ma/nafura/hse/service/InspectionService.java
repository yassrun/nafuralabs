package ma.nafura.hse.service;

import java.math.BigDecimal;
import java.time.Year;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.hse.api.request.InspectionCreateDto;
import ma.nafura.hse.api.request.InspectionUpdateDto;
import ma.nafura.hse.domain.model.Inspection;
import ma.nafura.hse.repository.InspectionRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class InspectionService {

    private static final Pattern INSPECTION_NUMERO_SUFFIX =
            Pattern.compile("^INSP-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern INSPECTION_ID_SUFFIX = Pattern.compile("^ins(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final InspectionRepository repository;
    private final InspectionSeedService seedService;

    public InspectionService(InspectionRepository repository, InspectionSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<Inspection> list(String status, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Inspection> rows = loadRows(tenantId, status);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(i -> matchesSearch(i, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public Inspection getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Inspection not found"));
    }

    @Transactional
    public Inspection create(InspectionCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextInspectionId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Inspection id already exists: " + id);
        }

        Inspection entity = Inspection.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .dateInspection(request.getDateInspection())
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .inspecteurNom(request.getInspecteurNom().trim())
                .organismeType(trimOrNull(request.getOrganismeType()))
                .referenceRapport(trimOrNull(request.getReferenceRapport()))
                .thematique(request.getThematique().trim())
                .nbObservations(request.getNbObservations() != null ? request.getNbObservations() : 0)
                .nbNonConformites(request.getNbNonConformites() != null ? request.getNbNonConformites() : 0)
                .noteGlobale(request.getNoteGlobale())
                .status(normalizeStatus(request.getStatus(), Inspection.STATUS_PLANIFIEE))
                .observations(trimOrNull(request.getObservations()))
                .notes(trimOrNull(request.getNotes()))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public Inspection update(String id, InspectionUpdateDto request) {
        Inspection entity = getById(id);
        if (request.getDateInspection() != null) {
            entity.setDateInspection(request.getDateInspection());
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getInspecteurNom() != null) {
            entity.setInspecteurNom(request.getInspecteurNom().trim());
        }
        if (request.getOrganismeType() != null) {
            entity.setOrganismeType(trimOrNull(request.getOrganismeType()));
        }
        if (request.getReferenceRapport() != null) {
            entity.setReferenceRapport(trimOrNull(request.getReferenceRapport()));
        }
        if (request.getThematique() != null) {
            entity.setThematique(request.getThematique().trim());
        }
        if (request.getNbObservations() != null) {
            entity.setNbObservations(request.getNbObservations());
        }
        if (request.getNbNonConformites() != null) {
            entity.setNbNonConformites(request.getNbNonConformites());
        }
        if (request.getNoteGlobale() != null) {
            entity.setNoteGlobale(request.getNoteGlobale());
        }
        if (request.getStatus() != null) {
            entity.setStatus(normalizeStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getObservations() != null) {
            entity.setObservations(trimOrNull(request.getObservations()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        Inspection entity = getById(id);
        repository.delete(entity);
    }

    private List<Inspection> loadRows(UUID tenantId, String status) {
        String normalizedStatus = normalizeFilter(status);
        if (normalizedStatus != null) {
            return repository.findByTenantIdAndStatusOrderByDateInspectionDescCreatedAtDesc(
                    tenantId, normalizedStatus);
        }
        return repository.findByTenantIdOrderByDateInspectionDescCreatedAtDesc(tenantId);
    }

    private boolean matchesSearch(Inspection inspection, String term) {
        return contains(inspection.getNumero(), term)
                || contains(inspection.getInspecteurNom(), term)
                || contains(inspection.getThematique(), term)
                || contains(inspection.getChantierCode(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private java.util.Optional<Inspection> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return repository.findByIdAndTenantId(id, tenantId());
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (Inspection inspection : repository.findByTenantIdOrderByDateInspectionDescCreatedAtDesc(tenantId)) {
            Matcher matcher = INSPECTION_NUMERO_SUFFIX.matcher(inspection.getNumero());
            if (matcher.matches() && Integer.parseInt(matcher.group(1)) == year) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return String.format(Locale.ROOT, "INSP-%d-%04d", year, max + 1);
    }

    private String nextInspectionId(UUID tenantId) {
        int max = 0;
        for (Inspection inspection : repository.findByTenantIdOrderByDateInspectionDescCreatedAtDesc(tenantId)) {
            Matcher matcher = INSPECTION_ID_SUFFIX.matcher(inspection.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "ins%03d", max + 1);
    }

    private String normalizeStatus(String raw, String fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeFilter(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim().toUpperCase(Locale.ROOT);
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
