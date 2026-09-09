package ma.nafura.rh.service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.rh.api.request.RhNomenclatureCreateDto;
import ma.nafura.rh.api.request.RhNomenclatureUpdateDto;
import ma.nafura.rh.domain.referentiel.RhDepartement;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.RhDepartementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RhDepartementService {

    private static final Pattern ID_SUFFIX = Pattern.compile("^rh-dep-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final RhDepartementRepository repository;
    private final EmployeRepository employeRepository;

    public RhDepartementService(RhDepartementRepository repository, EmployeRepository employeRepository) {
        this.repository = repository;
        this.employeRepository = employeRepository;
    }

    @Transactional(readOnly = true)
    public List<RhDepartement> list(String search, Boolean actif) {
        UUID tenantId = RhNomenclatureCodes.tenantId();
        List<RhDepartement> rows =
                Boolean.TRUE.equals(actif)
                        ? repository.findByTenantIdAndActifOrderByLibelleAsc(tenantId, true)
                        : repository.findByTenantIdOrderByLibelleAsc(tenantId);
        if (!StringUtils.hasText(search)) {
            return rows;
        }
        String term = search.trim().toLowerCase(Locale.ROOT);
        return rows.stream().filter(p -> matches(p, term)).toList();
    }

    @Transactional(readOnly = true)
    public RhDepartement getById(String id) {
        return repository
                .findByIdAndTenantId(id, RhNomenclatureCodes.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Département introuvable: " + id));
    }

    @Transactional
    public RhDepartement create(RhNomenclatureCreateDto request) {
        UUID tenantId = RhNomenclatureCodes.tenantId();
        String libelle = request.getLibelle().trim();
        int next = nextIndex(tenantId);
        String id = StringUtils.hasText(request.getId())
                ? request.getId().trim()
                : RhNomenclatureCodes.nextId("rh-dep", next);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Departement id already exists: " + id);
        }
        String code = StringUtils.hasText(request.getCode())
                ? request.getCode().trim().toUpperCase(Locale.ROOT)
                : uniqueCode(tenantId, RhNomenclatureCodes.slug(libelle, "D", next));
        if (repository.findByTenantIdAndCodeIgnoreCase(tenantId, code).isPresent()) {
            throw new IllegalArgumentException("Departement code already exists: " + code);
        }
        RhDepartement entity = RhDepartement.builder()
                .id(id)
                .tenantId(tenantId)
                .code(code)
                .libelle(libelle)
                .actif(request.getActif() == null || request.getActif())
                .build();
        return repository.save(entity);
    }

    @Transactional
    public RhDepartement update(String id, RhNomenclatureUpdateDto request) {
        RhDepartement entity = getById(id);
        UUID tenantId = entity.getTenantId();
        if (request.getLibelle() != null) {
            entity.setLibelle(request.getLibelle().trim());
        }
        if (request.getCode() != null) {
            String code = request.getCode().trim().toUpperCase(Locale.ROOT);
            repository
                    .findByTenantIdAndCodeIgnoreCase(tenantId, code)
                    .filter(other -> !other.getId().equals(id))
                    .ifPresent(other -> {
                        throw new IllegalArgumentException("Departement code already exists: " + code);
                    });
            entity.setCode(code);
        }
        if (request.getActif() != null) {
            entity.setActif(request.getActif());
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        RhDepartement entity = getById(id);
        long used = employeRepository.countByTenantIdAndDepartementId(entity.getTenantId(), id);
        if (used > 0) {
            throw new IllegalArgumentException("Département utilisé par " + used + " employé(s)");
        }
        repository.delete(entity);
    }

    @Transactional
    public RhDepartement ensure(String code, String libelle) {
        UUID tenantId = RhNomenclatureCodes.tenantId();
        Optional<RhDepartement> byCode = repository.findByTenantIdAndCodeIgnoreCase(tenantId, code);
        if (byCode.isPresent()) {
            RhDepartement existing = byCode.get();
            if (StringUtils.hasText(libelle) && !libelle.equals(existing.getLibelle())) {
                existing.setLibelle(libelle.trim());
                return repository.save(existing);
            }
            return existing;
        }
        Optional<RhDepartement> byLibelle =
                repository.findByTenantIdAndLibelleIgnoreCase(tenantId, libelle);
        if (byLibelle.isPresent()) {
            return byLibelle.get();
        }
        RhNomenclatureCreateDto dto = new RhNomenclatureCreateDto();
        dto.setCode(code);
        dto.setLibelle(libelle);
        dto.setActif(true);
        return create(dto);
    }

    private boolean matches(RhDepartement row, String term) {
        return contains(row.getId(), term)
                || contains(row.getCode(), term)
                || contains(row.getLibelle(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private String uniqueCode(UUID tenantId, String candidate) {
        if (repository.findByTenantIdAndCodeIgnoreCase(tenantId, candidate).isEmpty()) {
            return candidate;
        }
        int i = 2;
        while (repository.findByTenantIdAndCodeIgnoreCase(tenantId, candidate + "-" + i).isPresent()) {
            i++;
        }
        return candidate + "-" + i;
    }

    private int nextIndex(UUID tenantId) {
        int max = 0;
        for (RhDepartement row : repository.findByTenantIdOrderByLibelleAsc(tenantId)) {
            Matcher matcher = ID_SUFFIX.matcher(row.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return max;
    }
}
