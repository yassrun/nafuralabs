package ma.nafura.hse.service;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.hse.api.request.FormationHseCreateDto;
import ma.nafura.hse.api.request.FormationHseUpdateDto;
import ma.nafura.hse.domain.model.FormationHse;
import ma.nafura.hse.repository.FormationHseRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FormationHseService {

    private static final Pattern FORMATION_NUMERO_SUFFIX =
            Pattern.compile("^FORM-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern FORMATION_ID_SUFFIX = Pattern.compile("^form(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final FormationHseRepository repository;
    private final FormationHseSeedService seedService;

    public FormationHseService(FormationHseRepository repository, FormationHseSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<FormationHse> list(String status, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<FormationHse> rows = loadRows(tenantId, status);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(f -> matchesSearch(f, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public List<FormationHse> listExpirant(int days) {
        seedService.seedIfEmpty();
        if (days <= 0) {
            throw new IllegalArgumentException("days must be positive");
        }
        UUID tenantId = tenantId();
        LocalDate from = LocalDate.now();
        LocalDate to = from.plusDays(days);
        return repository.findByTenantIdAndAttestationValiditeBetweenOrderByAttestationValiditeAsc(tenantId, from, to);
    }

    @Transactional(readOnly = true)
    public FormationHse getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Formation not found"));
    }

    @Transactional
    public FormationHse create(FormationHseCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextFormationId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Formation id already exists: " + id);
        }

        FormationHse entity = FormationHse.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .titre(request.getTitre().trim())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .dureeHeures(request.getDureeHeures())
                .formateur(trimOrNull(request.getFormateur()))
                .lieu(trimOrNull(request.getLieu()))
                .nbParticipants(request.getNbParticipants() != null ? request.getNbParticipants() : 0)
                .habilitationCode(trimOrNull(request.getHabilitationCode()))
                .attestationReference(trimOrNull(request.getAttestationReference()))
                .attestationValidite(request.getAttestationValidite())
                .status(normalizeStatus(request.getStatus(), FormationHse.STATUS_PLANIFIEE))
                .notes(trimOrNull(request.getNotes()))
                .participants(copyList(request.getParticipants()))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public FormationHse update(String id, FormationHseUpdateDto request) {
        FormationHse entity = getById(id);
        if (request.getTitre() != null) {
            entity.setTitre(request.getTitre().trim());
        }
        if (request.getDateDebut() != null) {
            entity.setDateDebut(request.getDateDebut());
        }
        if (request.getDateFin() != null) {
            entity.setDateFin(request.getDateFin());
        }
        if (request.getDureeHeures() != null) {
            entity.setDureeHeures(request.getDureeHeures());
        }
        if (request.getFormateur() != null) {
            entity.setFormateur(trimOrNull(request.getFormateur()));
        }
        if (request.getLieu() != null) {
            entity.setLieu(trimOrNull(request.getLieu()));
        }
        if (request.getNbParticipants() != null) {
            entity.setNbParticipants(request.getNbParticipants());
        }
        if (request.getHabilitationCode() != null) {
            entity.setHabilitationCode(trimOrNull(request.getHabilitationCode()));
        }
        if (request.getAttestationReference() != null) {
            entity.setAttestationReference(trimOrNull(request.getAttestationReference()));
        }
        if (request.getAttestationValidite() != null) {
            entity.setAttestationValidite(request.getAttestationValidite());
        }
        if (request.getStatus() != null) {
            entity.setStatus(normalizeStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getParticipants() != null) {
            entity.setParticipants(copyList(request.getParticipants()));
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        FormationHse entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public FormationHse cloturer(String id) {
        FormationHse entity = getById(id);
        if (!FormationHse.STATUS_EN_COURS.equals(entity.getStatus())) {
            throw new IllegalStateException("Formation must be EN_COURS to close");
        }
        entity.setStatus(FormationHse.STATUS_TERMINEE);
        if (entity.getDateFin() == null) {
            entity.setDateFin(LocalDate.now());
        }
        return repository.save(entity);
    }

    private List<FormationHse> loadRows(UUID tenantId, String status) {
        String normalizedStatus = normalizeFilter(status);
        if (normalizedStatus != null) {
            return repository.findByTenantIdAndStatusOrderByDateDebutDescCreatedAtDesc(tenantId, normalizedStatus);
        }
        return repository.findByTenantIdOrderByDateDebutDescCreatedAtDesc(tenantId);
    }

    private boolean matchesSearch(FormationHse formation, String term) {
        return contains(formation.getNumero(), term)
                || contains(formation.getTitre(), term)
                || contains(formation.getFormateur(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private java.util.Optional<FormationHse> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return repository.findByIdAndTenantId(id, tenantId());
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (FormationHse formation : repository.findByTenantIdOrderByDateDebutDescCreatedAtDesc(tenantId)) {
            Matcher matcher = FORMATION_NUMERO_SUFFIX.matcher(formation.getNumero());
            if (matcher.matches() && Integer.parseInt(matcher.group(1)) == year) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return String.format(Locale.ROOT, "FORM-%d-%04d", year, max + 1);
    }

    private String nextFormationId(UUID tenantId) {
        int max = 0;
        for (FormationHse formation : repository.findByTenantIdOrderByDateDebutDescCreatedAtDesc(tenantId)) {
            Matcher matcher = FORMATION_ID_SUFFIX.matcher(formation.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "form%03d", max + 1);
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

    private List<String> copyList(List<String> source) {
        if (source == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(source);
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
