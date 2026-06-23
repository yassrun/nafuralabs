package ma.nafura.hse.service;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.hse.api.dto.CnssDatDeclarationResultDto;
import ma.nafura.hse.api.request.IncidentCreateDto;
import ma.nafura.hse.api.request.IncidentUpdateDto;
import ma.nafura.hse.domain.model.Incident;
import ma.nafura.hse.repository.IncidentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class IncidentService {

    private static final Pattern INCIDENT_NUMERO_SUFFIX =
            Pattern.compile("^INC-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern INCIDENT_ID_SUFFIX = Pattern.compile("^inc(\\d+)$", Pattern.CASE_INSENSITIVE);

    private static final Set<String> CNSS_DAT_TYPES =
            Set.of(Incident.TYPE_AT, Incident.TYPE_MP);

    private final IncidentRepository repository;
    private final IncidentSeedService seedService;

    public IncidentService(IncidentRepository repository, IncidentSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<Incident> list(String status, String gravite, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Incident> rows = loadRows(tenantId, status, gravite);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(i -> matchesSearch(i, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public Incident getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Incident not found"));
    }

    @Transactional
    public Incident create(IncidentCreateDto request) {
        UUID tenantId = tenantId();
        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextIncidentId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Incident id already exists: " + id);
        }

        Incident entity = Incident.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .employeId(trimOrNull(request.getEmployeId()))
                .victimeNom(trimOrNull(request.getVictimeNom()))
                .dateIncident(request.getDateIncident())
                .heureIncident(request.getHeureIncident())
                .lieu(request.getLieu().trim())
                .typeIncident(normalizeType(request.getTypeIncident()))
                .gravite(normalizeGravite(request.getGravite()))
                .description(request.getDescription().trim())
                .causes(trimOrNull(request.getCauses()))
                .actionsImmediates(trimOrNull(request.getActionsImmediates()))
                .planAction(trimOrNull(request.getPlanAction()))
                .joursArret(request.getJoursArret())
                .status(normalizeStatus(request.getStatus(), Incident.STATUS_OUVERT))
                .notes(trimOrNull(request.getNotes()))
                .photosUrls(copyList(request.getPhotosUrls()))
                .temoins(copyList(request.getTemoins()))
                .ijssMontant(request.getIjssMontant())
                .ijssPeriode(trimOrNull(request.getIjssPeriode()))
                .build();
        return repository.save(entity);
    }

    @Transactional
    public Incident update(String id, IncidentUpdateDto request) {
        Incident entity = getById(id);
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getEmployeId() != null) {
            entity.setEmployeId(trimOrNull(request.getEmployeId()));
        }
        if (request.getVictimeNom() != null) {
            entity.setVictimeNom(trimOrNull(request.getVictimeNom()));
        }
        if (request.getDateIncident() != null) {
            entity.setDateIncident(request.getDateIncident());
        }
        if (request.getHeureIncident() != null) {
            entity.setHeureIncident(request.getHeureIncident());
        }
        if (request.getLieu() != null) {
            entity.setLieu(request.getLieu().trim());
        }
        if (request.getTypeIncident() != null) {
            entity.setTypeIncident(normalizeType(request.getTypeIncident()));
        }
        if (request.getGravite() != null) {
            entity.setGravite(normalizeGravite(request.getGravite()));
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription().trim());
        }
        if (request.getCauses() != null) {
            entity.setCauses(trimOrNull(request.getCauses()));
        }
        if (request.getActionsImmediates() != null) {
            entity.setActionsImmediates(trimOrNull(request.getActionsImmediates()));
        }
        if (request.getPlanAction() != null) {
            entity.setPlanAction(trimOrNull(request.getPlanAction()));
        }
        if (request.getJoursArret() != null) {
            entity.setJoursArret(request.getJoursArret());
        }
        if (request.getStatus() != null) {
            entity.setStatus(normalizeStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getPhotosUrls() != null) {
            entity.setPhotosUrls(copyList(request.getPhotosUrls()));
        }
        if (request.getTemoins() != null) {
            entity.setTemoins(copyList(request.getTemoins()));
        }
        if (request.getIjssMontant() != null) {
            entity.setIjssMontant(request.getIjssMontant());
        }
        if (request.getIjssPeriode() != null) {
            entity.setIjssPeriode(trimOrNull(request.getIjssPeriode()));
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        Incident entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public Incident investiguer(String id) {
        Incident entity = getById(id);
        if (!Incident.STATUS_OUVERT.equals(entity.getStatus())) {
            throw new IllegalStateException("Incident must be OUVERT to start investigation");
        }
        entity.setStatus(Incident.STATUS_INVESTIGATION);
        return repository.save(entity);
    }

    @Transactional
    public Incident clore(String id) {
        Incident entity = getById(id);
        if (!Incident.STATUS_INVESTIGATION.equals(entity.getStatus())) {
            throw new IllegalStateException("Incident must be INVESTIGATION to close");
        }
        entity.setStatus(Incident.STATUS_CLOS);
        return repository.save(entity);
    }

    @Transactional
    public CnssDatDeclarationResultDto declarerCnssDat(String id) {
        Incident entity = getById(id);
        if (!CNSS_DAT_TYPES.contains(entity.getTypeIncident())) {
            throw new IllegalStateException("CNSS DAT declaration applies only to AT and MP incidents");
        }
        String xmlUrl = "https://storage.placeholder/nafura/cnss-dat/" + entity.getNumero() + ".xml";
        String reference = "CNSS-DA-" + Year.now().getValue() + "-" + String.format(Locale.ROOT, "%05d", Math.abs(id.hashCode() % 100000));
        entity.setCnssDatDeclare(true);
        entity.setCnssDatXmlUrl(xmlUrl);
        entity.setCnssReferenceDeclaration(reference);
        entity.setCnssDateDeclaration(LocalDate.now());
        repository.save(entity);
        return CnssDatDeclarationResultDto.builder()
                .cnssDatDeclare(true)
                .cnssDatXmlUrl(xmlUrl)
                .cnssReferenceDeclaration(reference)
                .build();
    }

    private List<Incident> loadRows(UUID tenantId, String status, String gravite) {
        String normalizedStatus = normalizeFilter(status);
        String normalizedGravite = normalizeFilter(gravite);
        if (normalizedStatus != null && normalizedGravite != null) {
            return repository.findByTenantIdAndStatusAndGraviteOrderByDateIncidentDescCreatedAtDesc(
                    tenantId, normalizedStatus, normalizedGravite);
        }
        if (normalizedStatus != null) {
            return repository.findByTenantIdAndStatusOrderByDateIncidentDescCreatedAtDesc(tenantId, normalizedStatus);
        }
        if (normalizedGravite != null) {
            return repository.findByTenantIdAndGraviteOrderByDateIncidentDescCreatedAtDesc(tenantId, normalizedGravite);
        }
        return repository.findByTenantIdOrderByDateIncidentDescCreatedAtDesc(tenantId);
    }

    private boolean matchesSearch(Incident incident, String term) {
        return contains(incident.getNumero(), term)
                || contains(incident.getLieu(), term)
                || contains(incident.getVictimeNom(), term)
                || contains(incident.getDescription(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private java.util.Optional<Incident> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return java.util.Optional.empty();
        }
        return repository.findByIdAndTenantId(id, tenantId());
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (Incident incident : repository.findByTenantIdOrderByDateIncidentDescCreatedAtDesc(tenantId)) {
            Matcher matcher = INCIDENT_NUMERO_SUFFIX.matcher(incident.getNumero());
            if (matcher.matches() && Integer.parseInt(matcher.group(1)) == year) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return String.format(Locale.ROOT, "INC-%d-%04d", year, max + 1);
    }

    private String nextIncidentId(UUID tenantId) {
        int max = 0;
        for (Incident incident : repository.findByTenantIdOrderByDateIncidentDescCreatedAtDesc(tenantId)) {
            Matcher matcher = INCIDENT_ID_SUFFIX.matcher(incident.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "inc%03d", max + 1);
    }

    private String normalizeType(String raw) {
        String value = raw.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "AT", "AT_TRAVAIL", "AT_TRAJET" -> Incident.TYPE_AT;
            case "MP" -> Incident.TYPE_MP;
            case "PRESQU_ACCIDENT", "PRESQUE_ACCIDENT" -> Incident.TYPE_PRESQU_ACCIDENT;
            case "ENVIRONNEMENT" -> Incident.TYPE_ENVIRONNEMENT;
            case "INCIDENT", "DOMMAGE_MATERIEL", "AUTRE" -> Incident.TYPE_INCIDENT;
            default -> value;
        };
    }

    private String normalizeGravite(String raw) {
        String value = raw.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "SANS_ARRET", "LEGER" -> Incident.GRAVITE_LEGER;
            case "AVEC_ARRET", "MODERE" -> Incident.GRAVITE_MODERE;
            case "GRAVE" -> Incident.GRAVITE_GRAVE;
            case "MORTEL", "CRITIQUE" -> Incident.GRAVITE_CRITIQUE;
            default -> value;
        };
    }

    private String normalizeStatus(String raw, String fallback) {
        if (!StringUtils.hasText(raw)) {
            return fallback;
        }
        String value = raw.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "OUVERT", "DECLARE" -> Incident.STATUS_OUVERT;
            case "INVESTIGATION", "EN_INVESTIGATION" -> Incident.STATUS_INVESTIGATION;
            case "CLOS", "CLOTURE" -> Incident.STATUS_CLOS;
            default -> value;
        };
    }

    private String normalizeFilter(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.equals("DECLARE") || trimmed.equals("EN_INVESTIGATION") || trimmed.equals("CLOTURE")) {
            return normalizeStatus(trimmed, trimmed);
        }
        if (trimmed.equals("SANS_ARRET") || trimmed.equals("AVEC_ARRET") || trimmed.equals("MORTEL")) {
            return normalizeGravite(trimmed);
        }
        return trimmed.toUpperCase(Locale.ROOT);
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
