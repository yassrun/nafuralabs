package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.etudes.api.request.MetreCreateDto;
import ma.nafura.etudes.api.request.MetreLigneInputDto;
import ma.nafura.etudes.api.request.MetreLigneUpdateDto;
import ma.nafura.etudes.api.request.MetreUpdateDto;
import ma.nafura.etudes.domain.model.Metre;
import ma.nafura.etudes.domain.model.MetreLigne;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.repository.MetreLigneRepository;
import ma.nafura.etudes.repository.MetreRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class MetreService {

    private final MetreRepository repository;
    private final MetreLigneRepository ligneRepository;
    private final OuvrageRepository ouvrageRepository;
    private final MetreSeedService seedService;

    public MetreService(
            MetreRepository repository,
            MetreLigneRepository ligneRepository,
            OuvrageRepository ouvrageRepository,
            MetreSeedService seedService) {
        this.repository = repository;
        this.ligneRepository = ligneRepository;
        this.ouvrageRepository = ouvrageRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<Metre> list(
            String status,
            String metreurId,
            String ville,
            LocalDate dateFrom,
            LocalDate dateTo,
            String search,
            String sortBy,
            String sortDirection) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Metre> rows = loadRows(tenantId, status);
        if (StringUtils.hasText(metreurId)) {
            rows = rows.stream()
                    .filter(m -> metreurId.trim().equals(m.getMetreurId()))
                    .toList();
        }
        if (StringUtils.hasText(ville)) {
            String term = ville.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream()
                    .filter(m -> m.getVille() != null
                            && m.getVille().toLowerCase(Locale.ROOT).contains(term))
                    .toList();
        }
        if (dateFrom != null) {
            rows = rows.stream().filter(m -> !m.getDateMetre().isBefore(dateFrom)).toList();
        }
        if (dateTo != null) {
            rows = rows.stream().filter(m -> !m.getDateMetre().isAfter(dateTo)).toList();
        }
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(m -> matchesSearch(m, term)).toList();
        }
        rows = sortRows(rows, sortBy, sortDirection);
        rows.forEach(this::attachLigneMetreRefs);
        return rows;
    }

    @Transactional(readOnly = true)
    public Metre getById(UUID id) {
        seedService.seedIfEmpty();
        Metre entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Metre not found"));
        attachLigneMetreRefs(entity);
        return entity;
    }

    @Transactional
    public Metre create(MetreCreateDto request) {
        UUID tenantId = tenantId();
        Metre entity = Metre.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .projetNom(request.getProjetNom().trim())
                .ville(trimOrNull(request.getVille()))
                .dateMetre(request.getDateMetre())
                .metreurId(request.getMetreurId().trim())
                .metreurName(trimOrNull(request.getMetreurName()))
                .notes(trimOrNull(request.getNotes()))
                .status(resolveStatus(request.getStatus(), Metre.STATUS_BROUILLON))
                .lignes(new ArrayList<>())
                .build();
        applyLignes(entity, request.getLignes(), tenantId);
        Metre saved = repository.save(entity);
        attachLigneMetreRefs(saved);
        return saved;
    }

    @Transactional
    public Metre update(UUID id, MetreUpdateDto request) {
        Metre entity = getById(id);
        if (request.getProjetNom() != null) {
            entity.setProjetNom(request.getProjetNom().trim());
        }
        if (request.getVille() != null) {
            entity.setVille(trimOrNull(request.getVille()));
        }
        if (request.getDateMetre() != null) {
            entity.setDateMetre(request.getDateMetre());
        }
        if (request.getMetreurId() != null) {
            entity.setMetreurId(request.getMetreurId().trim());
        }
        if (request.getMetreurName() != null) {
            entity.setMetreurName(trimOrNull(request.getMetreurName()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getLignes() != null) {
            entity.getLignes().clear();
            applyLignes(entity, request.getLignes(), tenantId());
        }
        Metre saved = repository.save(entity);
        attachLigneMetreRefs(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        Metre entity = getById(id);
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<MetreLigne> listLignes(UUID metreId) {
        Metre metre = getById(metreId);
        return metre.getLignes().stream().peek(l -> l.setMetre(metre)).toList();
    }

    @Transactional
    public MetreLigne addLigne(UUID metreId, MetreLigneInputDto request) {
        Metre metre = getById(metreId);
        MetreLigne ligne = buildLigne(metre, request, tenantId());
        metre.getLignes().add(ligne);
        repository.save(metre);
        attachLigneMetreRefs(metre);
        return ligne;
    }

    @Transactional
    public MetreLigne updateLigne(UUID ligneId, MetreLigneUpdateDto request) {
        MetreLigne ligne = ligneRepository
                .findByIdAndTenantIdWithMetre(ligneId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Metre ligne not found"));
        Metre metre = getById(ligne.getMetre().getId());
        if (request.getOuvrageId() != null || request.getOuvrageCode() != null) {
            applyOuvrage(ligne, request.getOuvrageId(), request.getOuvrageCode(), tenantId());
        }
        if (request.getDesignationLibre() != null) {
            ligne.setDesignationLibre(trimOrNull(request.getDesignationLibre()));
        }
        if (request.getUnite() != null) {
            ligne.setUnite(request.getUnite().trim());
        }
        if (request.getLotCode() != null) {
            ligne.setLotCode(trimOrNull(request.getLotCode()));
        }
        if (request.getSousLotCode() != null) {
            ligne.setSousLotCode(trimOrNull(request.getSousLotCode()));
        }
        if (request.getLotLibelle() != null) {
            ligne.setLotLibelle(trimOrNull(request.getLotLibelle()));
        }
        if (request.getSousLotLibelle() != null) {
            ligne.setSousLotLibelle(trimOrNull(request.getSousLotLibelle()));
        }
        if (request.getLongueur() != null) {
            ligne.setLongueur(request.getLongueur());
        }
        if (request.getLargeur() != null) {
            ligne.setLargeur(request.getLargeur());
        }
        if (request.getHauteur() != null) {
            ligne.setHauteur(request.getHauteur());
        }
        if (request.getNombre() != null) {
            ligne.setNombre(request.getNombre());
        }
        if (request.getFormule() != null) {
            ligne.setFormule(trimOrNull(request.getFormule()));
        }
        if (request.getQuantiteCalculee() != null) {
            ligne.setQuantiteCalculee(request.getQuantiteCalculee());
        }
        if (request.getNotes() != null) {
            ligne.setNotes(trimOrNull(request.getNotes()));
        }
        ligne.setMetre(metre);
        MetreLigne saved = ligneRepository.save(ligne);
        attachLigneMetreRefs(metre);
        return saved;
    }

    @Transactional
    public void deleteLigne(UUID ligneId) {
        MetreLigne ligne = ligneRepository
                .findByIdAndTenantIdWithMetre(ligneId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Metre ligne not found"));
        Metre metre = getById(ligne.getMetre().getId());
        metre.getLignes().removeIf(l -> l.getId().equals(ligneId));
        repository.save(metre);
    }

    private List<Metre> loadRows(UUID tenantId, String status) {
        if (StringUtils.hasText(status)) {
            return repository.findByTenantIdAndStatusOrderByDateMetreDescCreatedAtDesc(
                    tenantId, status.trim());
        }
        return repository.findByTenantIdOrderByDateMetreDescCreatedAtDesc(tenantId);
    }

    private List<Metre> sortRows(List<Metre> rows, String sortBy, String sortDirection) {
        String field = StringUtils.hasText(sortBy) ? sortBy.trim() : "dateMetre";
        boolean desc = !"asc".equalsIgnoreCase(sortDirection);
        Comparator<Metre> comparator = switch (field) {
            case "numero" -> Comparator.comparing(Metre::getNumero, String.CASE_INSENSITIVE_ORDER);
            case "projetNom" -> Comparator.comparing(Metre::getProjetNom, String.CASE_INSENSITIVE_ORDER);
            case "ville" -> Comparator.comparing(m -> m.getVille() != null ? m.getVille() : "", String.CASE_INSENSITIVE_ORDER);
            case "metreurName" -> Comparator.comparing(
                    m -> m.getMetreurName() != null ? m.getMetreurName() : "", String.CASE_INSENSITIVE_ORDER);
            case "status" -> Comparator.comparing(Metre::getStatus, String.CASE_INSENSITIVE_ORDER);
            case "nbLignes" -> Comparator.comparingInt(Metre::getNbLignes);
            case "quantiteTotaleEstimee" -> Comparator.comparing(Metre::getQuantiteTotaleEstimee);
            default -> Comparator.comparing(Metre::getDateMetre);
        };
        if (desc) {
            comparator = comparator.reversed();
        }
        return rows.stream().sorted(comparator).toList();
    }

    private void applyLignes(Metre entity, List<MetreLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        for (MetreLigneInputDto input : inputs) {
            entity.getLignes().add(buildLigne(entity, input, tenantId));
        }
    }

    private MetreLigne buildLigne(Metre metre, MetreLigneInputDto input, UUID tenantId) {
        MetreLigne ligne = MetreLigne.builder()
                .tenantId(tenantId)
                .metre(metre)
                .designationLibre(trimOrNull(input.getDesignationLibre()))
                .unite(input.getUnite().trim())
                .lotCode(trimOrNull(input.getLotCode()))
                .sousLotCode(trimOrNull(input.getSousLotCode()))
                .lotLibelle(trimOrNull(input.getLotLibelle()))
                .sousLotLibelle(trimOrNull(input.getSousLotLibelle()))
                .longueur(input.getLongueur())
                .largeur(input.getLargeur())
                .hauteur(input.getHauteur())
                .nombre(input.getNombre())
                .formule(trimOrNull(input.getFormule()))
                .quantiteCalculee(input.getQuantiteCalculee())
                .notes(trimOrNull(input.getNotes()))
                .build();
        applyOuvrage(ligne, input.getOuvrageId(), input.getOuvrageCode(), tenantId);
        return ligne;
    }

    private void applyOuvrage(MetreLigne ligne, String ouvrageId, String ouvrageCode, UUID tenantId) {
        if (StringUtils.hasText(ouvrageId)) {
            try {
                UUID ref = UUID.fromString(ouvrageId.trim());
                ligne.setOuvrageRefId(ref);
                ouvrageRepository.findByIdAndTenantId(ref, tenantId).ifPresent(o -> ligne.setOuvrageCode(o.getCode()));
                return;
            } catch (IllegalArgumentException ignored) {
                // fall through
            }
        }
        if (StringUtils.hasText(ouvrageCode)) {
            ligne.setOuvrageCode(ouvrageCode.trim());
            ouvrageRepository
                    .findByTenantIdAndCode(tenantId, ouvrageCode.trim())
                    .map(Ouvrage::getId)
                    .ifPresent(ligne::setOuvrageRefId);
            return;
        }
        ligne.setOuvrageRefId(null);
        ligne.setOuvrageCode(null);
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        String prefix = "MET-" + year + "-";
        long count = repository.countByTenantIdAndNumeroStartingWith(tenantId, prefix);
        return prefix + String.format("%03d", count + 1);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case Metre.STATUS_BROUILLON, Metre.STATUS_TERMINE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(Metre metre, String term) {
        return contains(metre.getNumero(), term)
                || contains(metre.getProjetNom(), term)
                || contains(metre.getVille(), term)
                || contains(metre.getMetreurName(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private void attachLigneMetreRefs(Metre entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (MetreLigne ligne : entity.getLignes()) {
            ligne.setMetre(entity);
        }
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
