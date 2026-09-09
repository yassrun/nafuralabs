package ma.nafura.rh.service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.rh.api.request.RhNomenclatureCreateDto;
import ma.nafura.rh.api.request.RhNomenclatureUpdateDto;
import ma.nafura.rh.domain.referentiel.RhPoste;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.RhPosteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RhPosteService {

    private static final Pattern ID_SUFFIX = Pattern.compile("^rh-pst-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final RhPosteRepository repository;
    private final EmployeRepository employeRepository;

    public RhPosteService(RhPosteRepository repository, EmployeRepository employeRepository) {
        this.repository = repository;
        this.employeRepository = employeRepository;
    }

    @Transactional(readOnly = true)
    public List<RhPoste> list(String search, Boolean actif) {
        UUID tenantId = RhNomenclatureCodes.tenantId();
        List<RhPoste> rows =
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
    public RhPoste getById(String id) {
        return repository
                .findByIdAndTenantId(id, RhNomenclatureCodes.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Poste RH introuvable: " + id));
    }

    @Transactional
    public RhPoste create(RhNomenclatureCreateDto request) {
        UUID tenantId = RhNomenclatureCodes.tenantId();
        String libelle = request.getLibelle().trim();
        int next = nextIndex(tenantId);
        String id = StringUtils.hasText(request.getId())
                ? request.getId().trim()
                : RhNomenclatureCodes.nextId("rh-pst", next);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Poste id already exists: " + id);
        }
        String code = StringUtils.hasText(request.getCode())
                ? request.getCode().trim().toUpperCase(Locale.ROOT)
                : uniqueCode(tenantId, RhNomenclatureCodes.slug(libelle, "P", next));
        if (repository.findByTenantIdAndCodeIgnoreCase(tenantId, code).isPresent()) {
            throw new IllegalArgumentException("Poste code already exists: " + code);
        }
        RhPoste entity = RhPoste.builder()
                .id(id)
                .tenantId(tenantId)
                .code(code)
                .libelle(libelle)
                .actif(request.getActif() == null || request.getActif())
                .build();
        return repository.save(entity);
    }

    @Transactional
    public RhPoste update(String id, RhNomenclatureUpdateDto request) {
        RhPoste entity = getById(id);
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
                        throw new IllegalArgumentException("Poste code already exists: " + code);
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
        RhPoste entity = getById(id);
        long used = employeRepository.countByTenantIdAndPosteId(entity.getTenantId(), id);
        if (used > 0) {
            throw new IllegalArgumentException("Poste utilisé par " + used + " employé(s)");
        }
        repository.delete(entity);
    }

    @Transactional
    public RhPoste ensure(String code, String libelle) {
        UUID tenantId = RhNomenclatureCodes.tenantId();
        Optional<RhPoste> byCode = repository.findByTenantIdAndCodeIgnoreCase(tenantId, code);
        if (byCode.isPresent()) {
            RhPoste existing = byCode.get();
            if (StringUtils.hasText(libelle) && !libelle.equals(existing.getLibelle())) {
                existing.setLibelle(libelle.trim());
                return repository.save(existing);
            }
            return existing;
        }
        Optional<RhPoste> byLibelle =
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

    private boolean matches(RhPoste poste, String term) {
        return contains(poste.getId(), term)
                || contains(poste.getCode(), term)
                || contains(poste.getLibelle(), term);
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
        for (RhPoste row : repository.findByTenantIdOrderByLibelleAsc(tenantId)) {
            Matcher matcher = ID_SUFFIX.matcher(row.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return max;
    }
}
