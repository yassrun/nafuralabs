package ma.nafura.chantiers.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.CalendrierChantierDto;
import ma.nafura.chantiers.api.dto.CalendrierCreneauDto;
import ma.nafura.chantiers.api.dto.CalendrierExceptionDto;
import ma.nafura.chantiers.api.dto.CalendrierVersionDto;
import ma.nafura.chantiers.api.request.CalendrierCreneauWriteDto;
import ma.nafura.chantiers.api.request.CalendrierExceptionWriteDto;
import ma.nafura.chantiers.api.request.CalendrierVersionWriteDto;
import ma.nafura.chantiers.domain.calendrier.CalendrierChantier;
import ma.nafura.chantiers.domain.calendrier.CalendrierCreneau;
import ma.nafura.chantiers.domain.calendrier.CalendrierException;
import ma.nafura.chantiers.domain.calendrier.CalendrierExceptionCreneau;
import ma.nafura.chantiers.domain.calendrier.CalendrierExceptionType;
import ma.nafura.chantiers.domain.calendrier.CalendrierKind;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator.Creneau;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator.ExceptionJour;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator.Version;
import ma.nafura.chantiers.domain.calendrier.CalendrierVersion;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.chantiers.repository.CalendrierChantierRepository;
import ma.nafura.chantiers.repository.CalendrierCreneauRepository;
import ma.nafura.chantiers.repository.CalendrierExceptionCreneauRepository;
import ma.nafura.chantiers.repository.CalendrierExceptionRepository;
import ma.nafura.chantiers.repository.CalendrierVersionRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Calendrier chantier versionné (SEKTOR-326). Création paresseuse à la première
 * écriture planning — jamais à la conversion. Modifier ≠ recalcul de masse, pas
 * de simulation d'impact (L2). Le réalisé des activités n'est pas réécrit.
 */
@Service
public class CalendrierChantierService {

    static final String ERR_INTROUVABLE = "chantiers.calendrier.introuvable";
    static final String ERR_DERNIERE_VERSION = "chantiers.calendrier.derniere_version";
    static final String ERR_VERSION = "chantiers.calendrier.version_introuvable";

    private final CalendrierChantierRepository calendrierRepository;
    private final CalendrierVersionRepository versionRepository;
    private final CalendrierCreneauRepository creneauRepository;
    private final CalendrierExceptionRepository exceptionRepository;
    private final CalendrierExceptionCreneauRepository exceptionCreneauRepository;
    private final ActiviteChantierRepository activiteRepository;
    private final ChantierService chantierService;
    private final PlanningPolicy planningPolicy;

    public CalendrierChantierService(
            CalendrierChantierRepository calendrierRepository,
            CalendrierVersionRepository versionRepository,
            CalendrierCreneauRepository creneauRepository,
            CalendrierExceptionRepository exceptionRepository,
            CalendrierExceptionCreneauRepository exceptionCreneauRepository,
            ActiviteChantierRepository activiteRepository,
            ChantierService chantierService,
            PlanningPolicy planningPolicy) {
        this.calendrierRepository = calendrierRepository;
        this.versionRepository = versionRepository;
        this.creneauRepository = creneauRepository;
        this.exceptionRepository = exceptionRepository;
        this.exceptionCreneauRepository = exceptionCreneauRepository;
        this.activiteRepository = activiteRepository;
        this.chantierService = chantierService;
        this.planningPolicy = planningPolicy;
    }

    @Transactional(readOnly = true)
    public Optional<CalendrierChantierDto> find(String chantierId) {
        planningPolicy.assertCanRead(chantierId);
        chantierService.getById(chantierId);
        return calendrierRepository
                .findByTenantIdAndChantierId(tenantId(), chantierId)
                .map(this::toDto);
    }

    /**
     * PUT : crée le calendrier s'il n'existe pas, ou ajoute / remplace la version
     * de même date d'effet. Ne touche pas aux activités.
     */
    @Transactional
    public CalendrierChantierDto upsert(String chantierId, CalendrierVersionWriteDto request) {
        planningPolicy.assertCanAdministerCalendar(chantierId);
        chantierService.getById(chantierId);
        CalendrierChantier calendrier = calendrierRepository
                .findByTenantIdAndChantierId(tenantId(), chantierId)
                .orElseGet(() -> persistNouveau(chantierId, CalendrierKind.STANDARD));
        upsertVersion(calendrier, request);
        return toDto(calendrier);
    }

    @Transactional
    public CalendrierChantierDto addVersion(String chantierId, CalendrierVersionWriteDto request) {
        return upsert(chantierId, request);
    }

    @Transactional
    public void deleteVersion(String chantierId, String versionId) {
        planningPolicy.assertCanAdministerCalendar(chantierId);
        chantierService.getById(chantierId);
        CalendrierChantier calendrier = calendrierRepository
                .findByTenantIdAndChantierId(tenantId(), chantierId)
                .orElseThrow(() -> new IllegalArgumentException(ERR_INTROUVABLE));
        List<CalendrierVersion> versions =
                versionRepository.findByTenantIdAndCalendrierIdOrderByDateEffetAsc(tenantId(), calendrier.getId());
        CalendrierVersion target = versions.stream()
                .filter(v -> versionId.equals(v.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(ERR_VERSION + ": " + versionId));
        if (versions.size() <= 1) {
            throw new IllegalArgumentException(ERR_DERNIERE_VERSION);
        }
        clearVersionChildren(target.getId());
        versionRepository.delete(target);
    }

    /**
     * Début + minutes ouvrées → fin visible (fin incluse). Crée le calendrier
     * paresseusement si besoin (STANDARD si chantier sans activité, HISTORIQUE
     * 7 j sinon — dates visibles migrées, pas un lundi–vendredi présumé).
     */
    @Transactional
    public LocalDate deriveInclusiveFin(String chantierId, LocalDate debut, int dureeMinutes) {
        CalendrierChantier calendrier = ensure(chantierId);
        return toCalculator(calendrier).deriveInclusiveFin(debut, dureeMinutes);
    }

    /** Read-only preview, using the same calculator and lazy-default rules as a write. */
    @Transactional(readOnly = true)
    public LocalDate previewFin(String chantierId, LocalDate debut, int dureeMinutes,
            ma.nafura.chantiers.domain.calendrier.CalendrierActivite specific) {
        planningPolicy.assertCanRead(chantierId);
        chantierService.getById(chantierId);
        if (dureeMinutes <= 0) throw new IllegalArgumentException("chantiers.activite.duree_invalide");
        if (specific != null) return specific.calculator().deriveInclusiveFin(debut, dureeMinutes);
        return calculatorFor(chantierId).deriveInclusiveFin(debut, dureeMinutes);
    }

    @Transactional(readOnly = true)
    public CalendrierOuvreCalculator calculatorFor(String chantierId) {
        planningPolicy.assertCanRead(chantierId);
        chantierService.getById(chantierId);
        return calculatorForResourceAggregation(chantierId);
    }

    /** Internal capacity calculation only: caller scopes the employees to an authorized chantier.
     * Other chantier identities and calendar details must not be returned to that caller. */
    CalendrierOuvreCalculator calculatorForResourceAggregation(String chantierId) {
        return calendrierRepository.findByTenantIdAndChantierId(tenantId(), chantierId)
                .map(this::toCalculator)
                .orElseGet(() -> activiteRepository.countByTenantIdAndChantierId(tenantId(), chantierId) > 0
                        ? CalendrierOuvreCalculator.historique(CalendrierOuvreCalculator.FUSEAU_DEFAUT)
                        : CalendrierOuvreCalculator.standard(CalendrierOuvreCalculator.FUSEAU_DEFAUT));
    }

    @Transactional
    public CalendrierChantier ensure(String chantierId) {
        chantierService.getById(chantierId);
        return calendrierRepository
                .findByTenantIdAndChantierId(tenantId(), chantierId)
                .orElseGet(() -> {
                    long existantes = activiteRepository.countByTenantIdAndChantierId(tenantId(), chantierId);
                    CalendrierKind kind = existantes > 0 ? CalendrierKind.HISTORIQUE : CalendrierKind.STANDARD;
                    CalendrierChantier created = persistNouveau(chantierId, kind);
                    persistDefaultVersion(created, kind);
                    return created;
                });
    }

    private CalendrierChantier persistNouveau(String chantierId, CalendrierKind kind) {
        CalendrierChantier entity = CalendrierChantier.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(tenantId())
                .chantierId(chantierId)
                .kind(kind)
                .build();
        return calendrierRepository.save(entity);
    }

    private void persistDefaultVersion(CalendrierChantier calendrier, CalendrierKind kind) {
        List<Creneau> slots = kind == CalendrierKind.HISTORIQUE
                ? CalendrierOuvreCalculator.semaineHistoriqueSeptJours()
                : CalendrierOuvreCalculator.semaineStandardLundiVendredi();
        CalendrierVersionWriteDto dto = new CalendrierVersionWriteDto();
        dto.setDateEffet(LocalDate.of(1900, 1, 1));
        dto.setFuseauIana(CalendrierOuvreCalculator.FUSEAU_DEFAUT);
        dto.setCreneaux(slots.stream().map(CalendrierChantierService::toWrite).toList());
        dto.setExceptions(List.of());
        upsertVersion(calendrier, dto);
    }

    private void upsertVersion(CalendrierChantier calendrier, CalendrierVersionWriteDto request) {
        ZoneId zone = CalendrierOuvreCalculator.zoneOrThrow(request.getFuseauIana());
        List<Creneau> creneaux = toDomainCreneaux(request.getCreneaux(), true);
        List<ExceptionJour> exceptions = toDomainExceptions(request.getExceptions());
        LocalDate dateEffet = request.getDateEffet() != null ? request.getDateEffet() : LocalDate.now();
        CalendrierOuvreCalculator.validerVersion(new Version(dateEffet, zone, creneaux, exceptions));

        CalendrierVersion version = versionRepository
                .findByCalendrierIdAndDateEffet(calendrier.getId(), dateEffet)
                .orElseGet(() -> versionRepository.save(CalendrierVersion.builder()
                        .id(UUID.randomUUID().toString())
                        .tenantId(tenantId())
                        .calendrierId(calendrier.getId())
                        .dateEffet(dateEffet)
                        .fuseauIana(zone.getId())
                        .build()));
        version.setFuseauIana(zone.getId());
        versionRepository.save(version);
        replaceChildren(version.getId(), creneaux, exceptions);
    }

    private void replaceChildren(String versionId, List<Creneau> creneaux, List<ExceptionJour> exceptions) {
        UUID tenantId = tenantId();
        clearVersionChildren(versionId);
        for (Creneau c : creneaux) {
            creneauRepository.save(CalendrierCreneau.builder()
                    .id(UUID.randomUUID().toString())
                    .tenantId(tenantId)
                    .versionId(versionId)
                    .jourSemaine(c.jourSemaine())
                    .heureDebut(c.debut())
                    .heureFin(c.fin())
                    .lendemain(c.lendemain())
                    .build());
        }
        if (exceptions == null) {
            return;
        }
        for (ExceptionJour ex : exceptions) {
            CalendrierException saved = exceptionRepository.save(CalendrierException.builder()
                    .id(UUID.randomUUID().toString())
                    .tenantId(tenantId)
                    .versionId(versionId)
                    .dateLocale(ex.date())
                    .type(ex.type())
                    .build());
            if (ex.ouverture() == null) {
                continue;
            }
            for (Creneau c : ex.ouverture()) {
                exceptionCreneauRepository.save(CalendrierExceptionCreneau.builder()
                        .id(UUID.randomUUID().toString())
                        .tenantId(tenantId)
                        .exceptionId(saved.getId())
                        .heureDebut(c.debut())
                        .heureFin(c.fin())
                        .lendemain(c.lendemain())
                        .build());
            }
        }
    }

    private void clearVersionChildren(String versionId) {
        UUID tenantId = tenantId();
        for (CalendrierException ex : exceptionRepository.findByTenantIdAndVersionId(tenantId, versionId)) {
            exceptionCreneauRepository.deleteByExceptionId(ex.getId());
        }
        exceptionRepository.deleteByVersionId(versionId);
        creneauRepository.deleteByVersionId(versionId);
    }

    private CalendrierOuvreCalculator toCalculator(CalendrierChantier calendrier) {
        UUID tenantId = tenantId();
        List<CalendrierVersion> versions =
                versionRepository.findByTenantIdAndCalendrierIdOrderByDateEffetAsc(tenantId, calendrier.getId());
        List<Version> snapshots = new ArrayList<>();
        for (CalendrierVersion v : versions) {
            List<Creneau> creneaux = creneauRepository.findByTenantIdAndVersionId(tenantId, v.getId()).stream()
                    .map(c -> new Creneau(c.getJourSemaine(), c.getHeureDebut(), c.getHeureFin(), c.isLendemain()))
                    .toList();
            List<ExceptionJour> exceptions = new ArrayList<>();
            for (CalendrierException ex : exceptionRepository.findByTenantIdAndVersionId(tenantId, v.getId())) {
                List<Creneau> ouverture = exceptionCreneauRepository
                        .findByTenantIdAndExceptionId(tenantId, ex.getId())
                        .stream()
                        .map(c -> new Creneau(1, c.getHeureDebut(), c.getHeureFin(), c.isLendemain()))
                        .toList();
                exceptions.add(new ExceptionJour(ex.getDateLocale(), ex.getType(), ouverture));
            }
            snapshots.add(new Version(
                    v.getDateEffet(), CalendrierOuvreCalculator.zoneOrThrow(v.getFuseauIana()), creneaux, exceptions));
        }
        return new CalendrierOuvreCalculator(snapshots);
    }

    private CalendrierChantierDto toDto(CalendrierChantier calendrier) {
        UUID tenantId = tenantId();
        List<CalendrierVersionDto> versions = new ArrayList<>();
        for (CalendrierVersion v :
                versionRepository.findByTenantIdAndCalendrierIdOrderByDateEffetAsc(tenantId, calendrier.getId())) {
            versions.add(toVersionDto(v));
        }
        return CalendrierChantierDto.builder()
                .id(calendrier.getId())
                .chantierId(calendrier.getChantierId())
                .kind(calendrier.getKind().name())
                .versions(versions)
                .build();
    }

    private CalendrierVersionDto toVersionDto(CalendrierVersion v) {
        UUID tenantId = tenantId();
        List<CalendrierCreneauDto> creneaux = creneauRepository.findByTenantIdAndVersionId(tenantId, v.getId()).stream()
                .map(c -> CalendrierCreneauDto.builder()
                        .jourSemaine(c.getJourSemaine())
                        .heureDebut(c.getHeureDebut())
                        .heureFin(c.getHeureFin())
                        .lendemain(c.isLendemain())
                        .build())
                .toList();
        List<CalendrierExceptionDto> exceptions = new ArrayList<>();
        for (CalendrierException ex : exceptionRepository.findByTenantIdAndVersionId(tenantId, v.getId())) {
            List<CalendrierCreneauDto> ouv = exceptionCreneauRepository
                    .findByTenantIdAndExceptionId(tenantId, ex.getId())
                    .stream()
                    .map(c -> CalendrierCreneauDto.builder()
                            .heureDebut(c.getHeureDebut())
                            .heureFin(c.getHeureFin())
                            .lendemain(c.isLendemain())
                            .build())
                    .toList();
            exceptions.add(CalendrierExceptionDto.builder()
                    .id(ex.getId())
                    .dateLocale(ex.getDateLocale())
                    .type(ex.getType().name())
                    .creneaux(ouv)
                    .build());
        }
        return CalendrierVersionDto.builder()
                .id(v.getId())
                .dateEffet(v.getDateEffet())
                .fuseauIana(v.getFuseauIana())
                .creneaux(creneaux)
                .exceptions(exceptions)
                .build();
    }

    private static List<Creneau> toDomainCreneaux(List<CalendrierCreneauWriteDto> raw, boolean semaine) {
        if (raw == null || raw.isEmpty()) {
            throw new IllegalArgumentException(CalendrierOuvreCalculator.ERR_SANS_PLAGE);
        }
        List<Creneau> result = new ArrayList<>();
        for (CalendrierCreneauWriteDto dto : raw) {
            int jour = dto.getJourSemaine() != null ? dto.getJourSemaine() : 1;
            if (semaine && dto.getJourSemaine() == null) {
                throw new IllegalArgumentException(CalendrierOuvreCalculator.ERR_JOUR_SEMAINE);
            }
            boolean lendemain = Boolean.TRUE.equals(dto.getLendemain())
                    || inferLendemain(dto.getHeureDebut(), dto.getHeureFin(), dto.getLendemain());
            result.add(new Creneau(jour, dto.getHeureDebut(), dto.getHeureFin(), lendemain));
        }
        return result;
    }

    private static List<ExceptionJour> toDomainExceptions(List<CalendrierExceptionWriteDto> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        List<ExceptionJour> result = new ArrayList<>();
        for (CalendrierExceptionWriteDto dto : raw) {
            CalendrierExceptionType type;
            try {
                type = CalendrierExceptionType.valueOf(dto.getType().trim().toUpperCase());
            } catch (RuntimeException ex) {
                throw new IllegalArgumentException("chantiers.calendrier.exception_type_invalide: " + dto.getType());
            }
            List<Creneau> ouv = List.of();
            if (dto.getCreneaux() != null && !dto.getCreneaux().isEmpty()) {
                ouv = toDomainCreneaux(dto.getCreneaux(), false);
            }
            result.add(new ExceptionJour(dto.getDateLocale(), type, ouv));
        }
        return result;
    }

    /**
     * Si lendemain n'est pas posé et heureFin ≤ heureDebut, c'est un shift nuit stockable.
     */
    private static boolean inferLendemain(LocalTime debut, LocalTime fin, Boolean explicit) {
        if (explicit != null) {
            return explicit;
        }
        return debut != null && fin != null && !fin.isAfter(debut);
    }

    private static CalendrierCreneauWriteDto toWrite(Creneau c) {
        CalendrierCreneauWriteDto dto = new CalendrierCreneauWriteDto();
        dto.setJourSemaine(c.jourSemaine());
        dto.setHeureDebut(c.debut());
        dto.setHeureFin(c.fin());
        dto.setLendemain(c.lendemain());
        return dto;
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
