package ma.nafura.rh.service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.request.FormationCreateDto;
import ma.nafura.rh.api.request.FormationUpdateDto;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.domain.model.Formation;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.FormationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FormationService {

    private static final Pattern FORMATION_ID_SUFFIX = Pattern.compile("^frm-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final FormationRepository repository;
    private final EmployeRepository employeRepository;

    public FormationService(FormationRepository repository, EmployeRepository employeRepository) {
        this.repository = repository;
        this.employeRepository = employeRepository;
    }

    @Transactional(readOnly = true)
    public List<Formation> list(String employeId, String search) {
        UUID tenantId = tenantId();
        List<Formation> rows = loadRows(tenantId, employeId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(f -> matchesSearch(f, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public Formation getById(String id) {
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Formation not found"));
    }

    @Transactional
    public Formation create(FormationCreateDto request) {
        UUID tenantId = tenantId();
        requireEmploye(request.getEmployeId());

        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextFormationId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Formation id already exists: " + id);
        }

        Formation entity = Formation.builder()
                .id(id)
                .tenantId(tenantId)
                .employeId(request.getEmployeId().trim())
                .libelle(request.getLibelle().trim())
                .date(request.getDate())
                .organisme(trimOrNull(request.getOrganisme()))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public Formation update(String id, FormationUpdateDto request) {
        Formation entity = getById(id);
        if (request.getEmployeId() != null) {
            requireEmploye(request.getEmployeId());
            entity.setEmployeId(request.getEmployeId().trim());
        }
        if (request.getLibelle() != null) {
            entity.setLibelle(request.getLibelle().trim());
        }
        if (request.getDate() != null) {
            entity.setDate(request.getDate());
        }
        if (request.getOrganisme() != null) {
            entity.setOrganisme(trimOrNull(request.getOrganisme()));
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        Formation entity = getById(id);
        repository.delete(entity);
    }

    private List<Formation> loadRows(UUID tenantId, String employeId) {
        String normalizedEmployeId = normalizeFilter(employeId);
        if (normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdOrderByDateDesc(tenantId, normalizedEmployeId);
        }
        return repository.findByTenantIdOrderByDateDesc(tenantId);
    }

    private boolean matchesSearch(Formation formation, String term) {
        return contains(formation.getEmployeId(), term)
                || contains(formation.getLibelle(), term)
                || contains(formation.getOrganisme(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private Optional<Formation> resolve(String rawId) {
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

    private String nextFormationId(UUID tenantId) {
        int max = 0;
        for (Formation formation : repository.findByTenantIdOrderByDateDesc(tenantId)) {
            Matcher matcher = FORMATION_ID_SUFFIX.matcher(formation.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "frm-%03d", max + 1);
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
