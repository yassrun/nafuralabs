package ma.nafura.rh.service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.event.ErpNotificationPublisher;
import ma.nafura.rh.api.request.CongeCreateDto;
import ma.nafura.rh.api.request.CongeUpdateDto;
import ma.nafura.rh.domain.model.Conge;
import ma.nafura.rh.domain.model.CongeSolde;
import ma.nafura.rh.domain.model.Employe;
import ma.nafura.rh.repository.CongeRepository;
import ma.nafura.rh.repository.CongeSoldeRepository;
import ma.nafura.rh.repository.EmployeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class CongeService {

    private static final Pattern CONGE_ID_SUFFIX = Pattern.compile("^cng-(\\d+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern CONGE_NUMERO_SUFFIX = Pattern.compile("^CNG-(\\d{4})-(\\d+)$", Pattern.CASE_INSENSITIVE);

    private final CongeRepository repository;
    private final CongeSoldeRepository soldeRepository;
    private final EmployeRepository employeRepository;
    private final CongeSeedService seedService;
    private final ErpNotificationPublisher erpNotificationPublisher;

    public CongeService(
            CongeRepository repository,
            CongeSoldeRepository soldeRepository,
            EmployeRepository employeRepository,
            CongeSeedService seedService,
            ErpNotificationPublisher erpNotificationPublisher) {
        this.repository = repository;
        this.soldeRepository = soldeRepository;
        this.employeRepository = employeRepository;
        this.seedService = seedService;
        this.erpNotificationPublisher = erpNotificationPublisher;
    }

    @Transactional(readOnly = true)
    public List<Conge> list(String status, String type, String employeId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Conge> rows = loadRows(tenantId, status, type, employeId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(c -> matchesSearch(c, term)).toList();
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public Conge getById(String id) {
        seedService.seedIfEmpty();
        return resolve(id).orElseThrow(() -> new IllegalArgumentException("Conge not found"));
    }

    @Transactional
    public Conge create(CongeCreateDto request) {
        UUID tenantId = tenantId();
        Employe employe = requireEmploye(request.getEmployeId());

        String id = StringUtils.hasText(request.getId()) ? request.getId().trim() : nextCongeId(tenantId);
        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Conge id already exists: " + id);
        }

        LocalDate dateDebut = request.getDateDebut();
        LocalDate dateFin = request.getDateFin();
        validateDates(dateDebut, dateFin);

        BigDecimal nombreJours = resolveNombreJours(request.getNombreJours(), dateDebut, dateFin);
        Conge entity = Conge.builder()
                .id(id)
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .employeId(employe.getId())
                .employeNom(resolveEmployeNom(request.getEmployeNom(), employe))
                .type(request.getType().trim())
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .nombreJours(nombreJours)
                .status(resolveStatus(request.getStatus(), Conge.STATUS_BROUILLON))
                .motif(trimOrNull(request.getMotif()))
                .notes(trimOrNull(request.getNotes()))
                .build();
        ensureSolde(tenantId, employe.getId());
        return repository.save(entity);
    }

    @Transactional
    public Conge update(String id, CongeUpdateDto request) {
        Conge entity = getById(id);
        boolean draft = Conge.STATUS_BROUILLON.equals(entity.getStatus());
        if (!draft && hasNonStatusChanges(request)) {
            throw new IllegalStateException("Only draft conges can be updated");
        }

        if (request.getEmployeId() != null) {
            Employe employe = requireEmploye(request.getEmployeId());
            entity.setEmployeId(employe.getId());
            entity.setEmployeNom(resolveEmployeNom(request.getEmployeNom(), employe));
            ensureSolde(tenantId(), employe.getId());
        } else if (request.getEmployeNom() != null) {
            entity.setEmployeNom(trimOrNull(request.getEmployeNom()));
        }
        if (request.getType() != null) {
            entity.setType(request.getType().trim());
        }
        if (request.getDateDebut() != null) {
            entity.setDateDebut(request.getDateDebut());
        }
        if (request.getDateFin() != null) {
            entity.setDateFin(request.getDateFin());
        }
        validateDates(entity.getDateDebut(), entity.getDateFin());
        if (request.getNombreJours() != null) {
            entity.setNombreJours(request.getNombreJours());
        } else if (request.getDateDebut() != null || request.getDateFin() != null) {
            entity.setNombreJours(computeJoursOuvres(entity.getDateDebut(), entity.getDateFin()));
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getMotif() != null) {
            entity.setMotif(trimOrNull(request.getMotif()));
        }
        if (request.getMotifRefus() != null) {
            entity.setMotifRefus(trimOrNull(request.getMotifRefus()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        Conge entity = getById(id);
        if (!Conge.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft conges can be deleted");
        }
        repository.delete(entity);
    }

    @Transactional
    public Conge submit(String id) {
        Conge entity = getById(id);
        if (!Conge.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft conges can be submitted");
        }
        entity.setStatus(Conge.STATUS_DEMANDE);
        entity.setMotifRefus(null);
        Conge saved = repository.save(entity);
        publishCongeEvent(saved, "SOUMIS", "Demande de congé : " + saved.getNumero(), saved.getEmployeNom(), "MANAGER", "DAF");
        return saved;
    }

    @Transactional
    public Conge approve(String id) {
        Conge entity = getById(id);
        if (!Conge.STATUS_DEMANDE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only submitted conges can be approved");
        }
        entity.setStatus(Conge.STATUS_APPROUVE);
        entity.setMotifRefus(null);
        Conge saved = repository.save(entity);
        publishCongeEvent(
                saved,
                "APPROUVE",
                "Congé approuvé : " + saved.getNumero(),
                saved.getEmployeNom() + " — " + saved.getType(),
                "MANAGER",
                "COMPTABLE");
        return saved;
    }

    @Transactional
    public Conge reject(String id, String motifRefus) {
        Conge entity = getById(id);
        if (!Conge.STATUS_DEMANDE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only submitted conges can be rejected");
        }
        if (!StringUtils.hasText(motifRefus)) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        entity.setStatus(Conge.STATUS_REFUSE);
        entity.setMotifRefus(motifRefus.trim());
        Conge saved = repository.save(entity);
        publishCongeEvent(
                saved,
                "REFUSE",
                "Congé refusé : " + saved.getNumero(),
                motifRefus.trim(),
                "MANAGER",
                "CONDUCTEUR_TRAVAUX");
        return saved;
    }

    private List<Conge> loadRows(UUID tenantId, String status, String type, String employeId) {
        String normalizedStatus = normalizeFilter(status);
        String normalizedType = normalizeFilter(type);
        String normalizedEmployeId = normalizeFilter(employeId);

        if (normalizedStatus != null && normalizedType != null && normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdAndStatusOrderByDateDebutDescNumeroDesc(
                            tenantId, normalizedEmployeId, normalizedStatus)
                    .stream()
                    .filter(c -> normalizedType.equals(c.getType()))
                    .toList();
        }
        if (normalizedStatus != null && normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdAndStatusOrderByDateDebutDescNumeroDesc(
                    tenantId, normalizedEmployeId, normalizedStatus);
        }
        if (normalizedType != null && normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdAndTypeOrderByDateDebutDescNumeroDesc(
                    tenantId, normalizedEmployeId, normalizedType);
        }
        if (normalizedStatus != null && normalizedType != null) {
            return repository.findByTenantIdAndStatusOrderByDateDebutDescNumeroDesc(tenantId, normalizedStatus)
                    .stream()
                    .filter(c -> normalizedType.equals(c.getType()))
                    .toList();
        }
        if (normalizedStatus != null) {
            return repository.findByTenantIdAndStatusOrderByDateDebutDescNumeroDesc(tenantId, normalizedStatus);
        }
        if (normalizedType != null) {
            return repository.findByTenantIdAndTypeOrderByDateDebutDescNumeroDesc(tenantId, normalizedType);
        }
        if (normalizedEmployeId != null) {
            return repository.findByTenantIdAndEmployeIdOrderByDateDebutDescNumeroDesc(tenantId, normalizedEmployeId);
        }
        return repository.findByTenantIdOrderByDateDebutDescNumeroDesc(tenantId);
    }

    private boolean matchesSearch(Conge conge, String term) {
        return contains(conge.getNumero(), term)
                || contains(conge.getEmployeNom(), term)
                || contains(conge.getEmployeId(), term)
                || contains(conge.getMotif(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private Optional<Conge> resolve(String rawId) {
        String id = rawId != null ? rawId.trim() : "";
        if (!StringUtils.hasText(id)) {
            return Optional.empty();
        }
        UUID tenantId = tenantId();
        Optional<Conge> byId = repository.findByIdAndTenantId(id, tenantId);
        if (byId.isPresent()) {
            return byId;
        }
        return repository.findByTenantIdOrderByDateDebutDescNumeroDesc(tenantId).stream()
                .filter(c -> id.equalsIgnoreCase(c.getNumero()))
                .findFirst();
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

    private void ensureSolde(UUID tenantId, String employeId) {
        if (soldeRepository.findByTenantIdAndEmployeId(tenantId, employeId).isPresent()) {
            return;
        }
        soldeRepository.save(CongeSolde.builder()
                .id("solde-" + employeId)
                .tenantId(tenantId)
                .employeId(employeId)
                .soldeJours(new BigDecimal("18.00"))
                .crediteAnnuel(new BigDecimal("18.00"))
                .prisAnnuel(BigDecimal.ZERO)
                .build());
    }

    private void validateDates(LocalDate dateDebut, LocalDate dateFin) {
        if (dateDebut == null || dateFin == null) {
            throw new IllegalArgumentException("Start and end dates are required");
        }
        if (dateFin.isBefore(dateDebut)) {
            throw new IllegalArgumentException("End date must be on or after start date");
        }
    }

    private BigDecimal resolveNombreJours(BigDecimal requested, LocalDate dateDebut, LocalDate dateFin) {
        if (requested != null) {
            return requested;
        }
        return computeJoursOuvres(dateDebut, dateFin);
    }

    private BigDecimal computeJoursOuvres(LocalDate dateDebut, LocalDate dateFin) {
        int count = 0;
        LocalDate cursor = dateDebut;
        while (!cursor.isAfter(dateFin)) {
            DayOfWeek day = cursor.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                count++;
            }
            cursor = cursor.plusDays(1);
        }
        return BigDecimal.valueOf(count);
    }

    private String nextCongeId(UUID tenantId) {
        int max = 0;
        for (Conge conge : repository.findByTenantIdOrderByDateDebutDescNumeroDesc(tenantId)) {
            Matcher matcher = CONGE_ID_SUFFIX.matcher(conge.getId());
            if (matcher.matches()) {
                max = Math.max(max, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format(Locale.ROOT, "cng-%03d", max + 1);
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        int max = 0;
        for (Conge conge : repository.findByTenantIdOrderByDateDebutDescNumeroDesc(tenantId)) {
            Matcher matcher = CONGE_NUMERO_SUFFIX.matcher(conge.getNumero());
            if (matcher.matches() && Integer.parseInt(matcher.group(1)) == year) {
                max = Math.max(max, Integer.parseInt(matcher.group(2)));
            }
        }
        return String.format(Locale.ROOT, "CNG-%d-%04d", year, max + 1);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case Conge.STATUS_BROUILLON,
                    Conge.STATUS_DEMANDE,
                    Conge.STATUS_APPROUVE,
                    Conge.STATUS_REFUSE,
                    Conge.STATUS_EN_COURS,
                    Conge.STATUS_SOLDE -> normalized;
            default -> fallback;
        };
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

    private boolean hasNonStatusChanges(CongeUpdateDto request) {
        return request.getEmployeId() != null
                || request.getEmployeNom() != null
                || request.getType() != null
                || request.getDateDebut() != null
                || request.getDateFin() != null
                || request.getNombreJours() != null
                || request.getMotif() != null
                || request.getMotifRefus() != null
                || request.getNotes() != null;
    }

    private UUID tenantId() {
        return TenantContext.getTenantId();
    }

    private void publishCongeEvent(Conge conge, String transition, String title, String body, String... roles) {
        erpNotificationPublisher.notifyRoles(
                tenantId(),
                "CONGE",
                conge.getId(),
                conge.getNumero(),
                transition,
                title,
                body,
                "/rh/conges/" + conge.getId(),
                roles);
    }
}
