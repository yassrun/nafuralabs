package ma.nafura.etudes.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.etudes.api.dto.ConvertToChantierResultDto;
import ma.nafura.etudes.api.request.AppelOffreClientCreateDto;
import ma.nafura.etudes.api.request.AppelOffreClientMarquerPerduDto;
import ma.nafura.etudes.api.request.AppelOffreClientUpdateDto;
import ma.nafura.etudes.domain.model.AppelOffreClient;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AppelOffreClientService {

    private final AppelOffreClientRepository repository;
    private final AppelOffreClientSeedService seedService;
    private final AppelOffreClientEmbeddedBuilder embeddedBuilder;

    public AppelOffreClientService(
            AppelOffreClientRepository repository,
            AppelOffreClientSeedService seedService,
            AppelOffreClientEmbeddedBuilder embeddedBuilder) {
        this.repository = repository;
        this.seedService = seedService;
        this.embeddedBuilder = embeddedBuilder;
    }

    @Transactional(readOnly = true)
    public List<AppelOffreClient> list(
            String status,
            String type,
            String donneurOrdre,
            LocalDate dateFrom,
            LocalDate dateTo,
            String search,
            String sortBy,
            String sortDirection) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<AppelOffreClient> rows = loadRows(tenantId, status);
        if (StringUtils.hasText(type)) {
            String normalized = type.trim().toUpperCase(Locale.ROOT);
            rows = rows.stream().filter(a -> normalized.equals(a.getType())).toList();
        }
        if (StringUtils.hasText(donneurOrdre)) {
            String term = donneurOrdre.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream()
                    .filter(a -> a.getDonneurOrdre() != null
                            && a.getDonneurOrdre().toLowerCase(Locale.ROOT).contains(term))
                    .toList();
        }
        if (dateFrom != null) {
            rows = rows.stream().filter(a -> !a.getDateLimiteDepot().isBefore(dateFrom)).toList();
        }
        if (dateTo != null) {
            rows = rows.stream().filter(a -> !a.getDateLimiteDepot().isAfter(dateTo)).toList();
        }
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(a -> matchesSearch(a, term)).toList();
        }
        rows = sortRows(rows, sortBy, sortDirection);
        rows.forEach(embeddedBuilder::syncEmbeddedIds);
        return rows;
    }

    @Transactional(readOnly = true)
    public AppelOffreClient getById(UUID id) {
        seedService.seedIfEmpty();
        AppelOffreClient entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("AppelOffreClient not found"));
        embeddedBuilder.syncEmbeddedIds(entity);
        return entity;
    }

    @Transactional
    public AppelOffreClient create(AppelOffreClientCreateDto request) {
        UUID tenantId = tenantId();
        String status = resolveStatus(request.getStatus(), AppelOffreClient.STATUS_A_ETUDIER);
        AppelOffreClient entity = AppelOffreClient.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .reference(request.getReference().trim())
                .objet(request.getObjet().trim())
                .donneurOrdre(request.getDonneurOrdre().trim())
                .type(resolveType(request.getType()))
                .dateLimiteDepot(request.getDateLimiteDepot())
                .dateOuverturePlis(request.getDateOuverturePlis())
                .cautionProvisoire(request.getCautionProvisoire())
                .cautionDefinitive(request.getCautionDefinitive())
                .cautionRetenueGarantie(request.getCautionRetenueGarantie())
                .estimationMoaHt(request.getEstimationMoaHt())
                .ville(trimOrNull(request.getVille()))
                .delaiExecutionJours(request.getDelaiExecutionJours())
                .status(status)
                .devisId(trimOrNull(request.getDevisId()))
                .devisNumero(trimOrNull(request.getDevisNumero()))
                .metreId(trimOrNull(request.getMetreId()))
                .metreNumero(trimOrNull(request.getMetreNumero()))
                .resultatRangNotre(request.getResultatRangNotre())
                .resultatNbPlis(request.getResultatNbPlis())
                .resultatAttributaire(trimOrNull(request.getResultatAttributaire()))
                .resultatMontantHt(request.getResultatMontantHt())
                .notes(trimOrNull(request.getNotes()))
                .build();
        AppelOffreClient saved = repository.save(entity);
        saved.setDocuments(embeddedBuilder.buildDocuments(saved));
        saved.setChecklist(embeddedBuilder.buildChecklist(saved));
        saved = repository.save(saved);
        embeddedBuilder.syncEmbeddedIds(saved);
        return saved;
    }

    @Transactional
    public AppelOffreClient update(UUID id, AppelOffreClientUpdateDto request) {
        AppelOffreClient entity = getById(id);
        if (request.getReference() != null) {
            entity.setReference(request.getReference().trim());
        }
        if (request.getObjet() != null) {
            entity.setObjet(request.getObjet().trim());
        }
        if (request.getDonneurOrdre() != null) {
            entity.setDonneurOrdre(request.getDonneurOrdre().trim());
        }
        if (request.getType() != null) {
            entity.setType(resolveType(request.getType()));
        }
        if (request.getDateLimiteDepot() != null) {
            entity.setDateLimiteDepot(request.getDateLimiteDepot());
        }
        if (request.getDateOuverturePlis() != null) {
            entity.setDateOuverturePlis(request.getDateOuverturePlis());
        }
        if (request.getCautionProvisoire() != null) {
            entity.setCautionProvisoire(request.getCautionProvisoire());
        }
        if (request.getCautionDefinitive() != null) {
            entity.setCautionDefinitive(request.getCautionDefinitive());
        }
        if (request.getCautionRetenueGarantie() != null) {
            entity.setCautionRetenueGarantie(request.getCautionRetenueGarantie());
        }
        if (request.getEstimationMoaHt() != null) {
            entity.setEstimationMoaHt(request.getEstimationMoaHt());
        }
        if (request.getVille() != null) {
            entity.setVille(trimOrNull(request.getVille()));
        }
        if (request.getDelaiExecutionJours() != null) {
            entity.setDelaiExecutionJours(request.getDelaiExecutionJours());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getDevisId() != null) {
            entity.setDevisId(trimOrNull(request.getDevisId()));
        }
        if (request.getDevisNumero() != null) {
            entity.setDevisNumero(trimOrNull(request.getDevisNumero()));
        }
        if (request.getMetreId() != null) {
            entity.setMetreId(trimOrNull(request.getMetreId()));
        }
        if (request.getMetreNumero() != null) {
            entity.setMetreNumero(trimOrNull(request.getMetreNumero()));
        }
        if (request.getResultatRangNotre() != null) {
            entity.setResultatRangNotre(request.getResultatRangNotre());
        }
        if (request.getResultatNbPlis() != null) {
            entity.setResultatNbPlis(request.getResultatNbPlis());
        }
        if (request.getResultatAttributaire() != null) {
            entity.setResultatAttributaire(trimOrNull(request.getResultatAttributaire()));
        }
        if (request.getResultatMontantHt() != null) {
            entity.setResultatMontantHt(request.getResultatMontantHt());
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        AppelOffreClient saved = repository.save(entity);
        embeddedBuilder.syncEmbeddedIds(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        AppelOffreClient entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public AppelOffreClient prepare(UUID id) {
        return transition(id, AppelOffreClient.STATUS_A_ETUDIER, AppelOffreClient.STATUS_EN_PREPARATION);
    }

    @Transactional
    public AppelOffreClient submit(UUID id) {
        return transition(id, AppelOffreClient.STATUS_EN_PREPARATION, AppelOffreClient.STATUS_SOUMIS);
    }

    @Transactional
    public AppelOffreClient marquerGagne(UUID id) {
        AppelOffreClient entity = getById(id);
        assertStatus(entity, AppelOffreClient.STATUS_SOUMIS, "marquer-gagne");
        entity.setStatus(AppelOffreClient.STATUS_ATTRIBUE);
        if (entity.getResultatAttributaire() == null) {
            entity.setResultatAttributaire("SEYRURA BTP SARL");
        }
        if (entity.getResultatRangNotre() == null) {
            entity.setResultatRangNotre(1);
        }
        refreshEmbedded(entity);
        AppelOffreClient saved = repository.save(entity);
        embeddedBuilder.syncEmbeddedIds(saved);
        return saved;
    }

    @Transactional
    public AppelOffreClient marquerPerdu(UUID id, AppelOffreClientMarquerPerduDto body) {
        AppelOffreClient entity = getById(id);
        assertStatus(entity, AppelOffreClient.STATUS_SOUMIS, "marquer-perdu");
        entity.setStatus(AppelOffreClient.STATUS_PERDU);
        if (body != null) {
            if (body.getResultatAttributaire() != null) {
                entity.setResultatAttributaire(trimOrNull(body.getResultatAttributaire()));
            }
            if (body.getResultatMontantHt() != null) {
                entity.setResultatMontantHt(body.getResultatMontantHt());
            }
            if (body.getResultatRangNotre() != null) {
                entity.setResultatRangNotre(body.getResultatRangNotre());
            }
            if (body.getResultatNbPlis() != null) {
                entity.setResultatNbPlis(body.getResultatNbPlis());
            }
            if (body.getNotes() != null) {
                entity.setNotes(trimOrNull(body.getNotes()));
            }
        }
        refreshEmbedded(entity);
        AppelOffreClient saved = repository.save(entity);
        embeddedBuilder.syncEmbeddedIds(saved);
        return saved;
    }

    @Transactional
    public AppelOffreClient infructueux(UUID id) {
        return transition(id, AppelOffreClient.STATUS_SOUMIS, AppelOffreClient.STATUS_INFRUCTUEUX);
    }

    @Transactional
    public AppelOffreClient cancel(UUID id) {
        AppelOffreClient entity = getById(id);
        if (!AppelOffreClient.STATUS_A_ETUDIER.equals(entity.getStatus())
                && !AppelOffreClient.STATUS_EN_PREPARATION.equals(entity.getStatus())) {
            throw new IllegalStateException("Cannot cancel AOC from status " + entity.getStatus());
        }
        entity.setStatus(AppelOffreClient.STATUS_ANNULE);
        AppelOffreClient saved = repository.save(entity);
        embeddedBuilder.syncEmbeddedIds(saved);
        return saved;
    }

    @Transactional
    public ConvertToChantierResultDto convertToChantier(UUID id) {
        AppelOffreClient entity = getById(id);
        if (!AppelOffreClient.STATUS_ATTRIBUE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only ATTRIBUE AOC can be converted to chantier");
        }
        if (!StringUtils.hasText(entity.getChantierGenereId())) {
            entity.setChantierGenereId(nextChantierStubId());
            entity = repository.save(entity);
        }
        embeddedBuilder.syncEmbeddedIds(entity);
        return ConvertToChantierResultDto.builder()
                .chantierId(entity.getChantierGenereId())
                .aoc(entity)
                .build();
    }

    private AppelOffreClient transition(UUID id, String expectedFrom, String targetStatus) {
        AppelOffreClient entity = getById(id);
        assertStatus(entity, expectedFrom, targetStatus);
        entity.setStatus(targetStatus);
        refreshEmbedded(entity);
        AppelOffreClient saved = repository.save(entity);
        embeddedBuilder.syncEmbeddedIds(saved);
        return saved;
    }

    private void assertStatus(AppelOffreClient entity, String expectedFrom, String action) {
        if (!expectedFrom.equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Cannot " + action + " AOC from status " + entity.getStatus());
        }
    }

    private List<AppelOffreClient> loadRows(UUID tenantId, String status) {
        if (StringUtils.hasText(status)) {
            return repository.findByTenantIdAndStatusOrderByDateLimiteDepotDescCreatedAtDesc(
                    tenantId, status.trim());
        }
        return repository.findByTenantIdOrderByDateLimiteDepotDescCreatedAtDesc(tenantId);
    }

    private List<AppelOffreClient> sortRows(List<AppelOffreClient> rows, String sortBy, String sortDirection) {
        String field = StringUtils.hasText(sortBy) ? sortBy.trim() : "dateLimiteDepot";
        boolean desc = !"asc".equalsIgnoreCase(sortDirection);
        Comparator<AppelOffreClient> comparator = switch (field) {
            case "numero" -> Comparator.comparing(AppelOffreClient::getNumero, String.CASE_INSENSITIVE_ORDER);
            case "reference" -> Comparator.comparing(AppelOffreClient::getReference, String.CASE_INSENSITIVE_ORDER);
            case "objet" -> Comparator.comparing(AppelOffreClient::getObjet, String.CASE_INSENSITIVE_ORDER);
            case "donneurOrdre" -> Comparator.comparing(
                    AppelOffreClient::getDonneurOrdre, String.CASE_INSENSITIVE_ORDER);
            case "ville" -> Comparator.comparing(
                    a -> a.getVille() != null ? a.getVille() : "", String.CASE_INSENSITIVE_ORDER);
            case "status" -> Comparator.comparing(AppelOffreClient::getStatus, String.CASE_INSENSITIVE_ORDER);
            case "delaiRestant" -> Comparator.comparingInt(AppelOffreClient::getDelaiRestant);
            default -> Comparator.comparing(AppelOffreClient::getDateLimiteDepot);
        };
        if (desc) {
            comparator = comparator.reversed();
        }
        return rows.stream().sorted(comparator).toList();
    }

    private void refreshEmbedded(AppelOffreClient entity) {
        entity.setDocuments(embeddedBuilder.buildDocuments(entity));
        entity.setChecklist(embeddedBuilder.buildChecklist(entity));
    }

    private String nextNumero(UUID tenantId) {
        int year = Year.now().getValue();
        String prefix = "AOC-" + year + "-";
        long count = repository.countByTenantIdAndNumeroStartingWith(tenantId, prefix);
        return prefix + String.format("%04d", count + 1);
    }

    private String nextChantierStubId() {
        int year = Year.now().getValue();
        return "CH-" + year + "-" + String.format("%03d", Math.abs(UUID.randomUUID().hashCode()) % 900 + 100);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case AppelOffreClient.STATUS_A_ETUDIER,
                    AppelOffreClient.STATUS_EN_PREPARATION,
                    AppelOffreClient.STATUS_SOUMIS,
                    AppelOffreClient.STATUS_ATTRIBUE,
                    AppelOffreClient.STATUS_PERDU,
                    AppelOffreClient.STATUS_INFRUCTUEUX,
                    AppelOffreClient.STATUS_ANNULE -> normalized;
            default -> fallback;
        };
    }

    private String resolveType(String requested) {
        if (!StringUtils.hasText(requested)) {
            return AppelOffreClient.TYPE_PUBLIC;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case AppelOffreClient.TYPE_PUBLIC, AppelOffreClient.TYPE_PRIVE -> normalized;
            default -> AppelOffreClient.TYPE_PUBLIC;
        };
    }

    private boolean matchesSearch(AppelOffreClient entity, String term) {
        return contains(entity.getNumero(), term)
                || contains(entity.getReference(), term)
                || contains(entity.getObjet(), term)
                || contains(entity.getDonneurOrdre(), term)
                || contains(entity.getVille(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
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
