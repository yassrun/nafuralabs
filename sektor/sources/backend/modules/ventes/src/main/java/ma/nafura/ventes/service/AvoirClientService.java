package ma.nafura.ventes.service;

import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.ventes.api.request.AvoirClientCreateDto;
import ma.nafura.ventes.api.request.AvoirClientLigneInputDto;
import ma.nafura.ventes.api.request.AvoirClientUpdateDto;
import ma.nafura.ventes.domain.model.AvoirClient;
import ma.nafura.ventes.domain.model.AvoirClientLigne;
import ma.nafura.ventes.repository.AvoirClientRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AvoirClientService {

    private final AvoirClientRepository repository;
    private final AvoirClientSeedService seedService;

    public AvoirClientService(AvoirClientRepository repository, AvoirClientSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<AvoirClient> list(String status, String clientId, String factureOriginaleId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<AvoirClient> rows = loadRows(tenantId, status, clientId, factureOriginaleId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(a -> matchesSearch(a, term)).toList();
        }
        rows.forEach(this::attachLigneAvoirIds);
        return rows;
    }

    @Transactional(readOnly = true)
    public List<AvoirClient> listByFacture(String factureOriginaleId) {
        seedService.seedIfEmpty();
        List<AvoirClient> rows =
                repository.findByTenantIdAndFactureOriginaleIdOrderByCreatedAtDesc(
                        tenantId(), factureOriginaleId.trim());
        rows.forEach(this::attachLigneAvoirIds);
        return rows;
    }

    @Transactional(readOnly = true)
    public AvoirClient getById(UUID id) {
        seedService.seedIfEmpty();
        AvoirClient entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Avoir client not found"));
        attachLigneAvoirIds(entity);
        return entity;
    }

    @Transactional
    public AvoirClient create(AvoirClientCreateDto request) {
        UUID tenantId = tenantId();
        AvoirClient entity = AvoirClient.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .factureOriginaleId(request.getFactureOriginaleId().trim())
                .factureOriginaleNumero(trimOrNull(request.getFactureOriginaleNumero()))
                .clientId(request.getClientId().trim())
                .clientName(trimOrNull(request.getClientName()))
                .dateEmission(request.getDateEmission())
                .motif(request.getMotif().trim())
                .tvaTaux(request.getTvaTaux())
                .status(resolveStatus(request.getStatus(), AvoirClient.STATUS_BROUILLON))
                .notes(trimOrNull(request.getNotes()))
                .lignes(new ArrayList<>())
                .build();
        applyLignes(entity, request.getLignes(), tenantId);
        AvoirClientTotalsCalculator.applyTotals(entity);
        AvoirClient saved = repository.save(entity);
        attachLigneAvoirIds(saved);
        return saved;
    }

    @Transactional
    public AvoirClient update(UUID id, AvoirClientUpdateDto request) {
        AvoirClient entity = getById(id);
        if (request.getFactureOriginaleId() != null) {
            entity.setFactureOriginaleId(request.getFactureOriginaleId().trim());
        }
        if (request.getFactureOriginaleNumero() != null) {
            entity.setFactureOriginaleNumero(trimOrNull(request.getFactureOriginaleNumero()));
        }
        if (request.getClientId() != null) {
            entity.setClientId(request.getClientId().trim());
        }
        if (request.getClientName() != null) {
            entity.setClientName(trimOrNull(request.getClientName()));
        }
        if (request.getDateEmission() != null) {
            entity.setDateEmission(request.getDateEmission());
        }
        if (request.getMotif() != null) {
            entity.setMotif(request.getMotif().trim());
        }
        if (request.getTvaTaux() != null) {
            entity.setTvaTaux(request.getTvaTaux());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getLignes() != null) {
            entity.getLignes().clear();
            applyLignes(entity, request.getLignes(), tenantId());
            AvoirClientTotalsCalculator.applyTotals(entity);
        }
        AvoirClient saved = repository.save(entity);
        attachLigneAvoirIds(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        AvoirClient entity = getById(id);
        repository.delete(entity);
    }

    private List<AvoirClient> loadRows(
            UUID tenantId, String status, String clientId, String factureOriginaleId) {
        if (StringUtils.hasText(factureOriginaleId)) {
            return repository.findByTenantIdAndFactureOriginaleIdOrderByCreatedAtDesc(
                    tenantId, factureOriginaleId.trim());
        }
        boolean hasStatus = StringUtils.hasText(status);
        boolean hasClient = StringUtils.hasText(clientId);
        if (hasStatus && hasClient) {
            return repository.findByTenantIdAndStatusAndClientIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), clientId.trim());
        }
        if (hasStatus) {
            return repository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.trim());
        }
        if (hasClient) {
            return repository.findByTenantIdAndClientIdOrderByCreatedAtDesc(tenantId, clientId.trim());
        }
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    private void applyLignes(AvoirClient entity, List<AvoirClientLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        int index = 0;
        for (AvoirClientLigneInputDto input : inputs) {
            index++;
            AvoirClientLigne ligne = AvoirClientLigne.builder()
                    .tenantId(tenantId)
                    .avoir(entity)
                    .ordre(input.getOrdre() != null ? input.getOrdre() : index)
                    .designation(input.getDesignation().trim())
                    .totalHt(input.getTotalHt())
                    .build();
            entity.getLignes().add(ligne);
        }
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "AVO-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case AvoirClient.STATUS_BROUILLON,
                    AvoirClient.STATUS_EMIS,
                    AvoirClient.STATUS_IMPUTE,
                    AvoirClient.STATUS_REMBOURSE,
                    AvoirClient.STATUS_ANNULE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(AvoirClient a, String term) {
        return contains(a.getNumero(), term)
                || contains(a.getClientName(), term)
                || contains(a.getFactureOriginaleNumero(), term)
                || contains(a.getMotif(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private void attachLigneAvoirIds(AvoirClient entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (AvoirClientLigne ligne : entity.getLignes()) {
            ligne.setAvoir(entity);
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
