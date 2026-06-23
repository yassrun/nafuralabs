package ma.nafura.ventes.service;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.ventes.api.request.BonCommandeClientCreateDto;
import ma.nafura.ventes.api.request.BonCommandeClientLigneInputDto;
import ma.nafura.ventes.api.request.BonCommandeClientUpdateDto;
import ma.nafura.ventes.domain.model.BonCommandeClient;
import ma.nafura.ventes.domain.model.BonCommandeClientLigne;
import ma.nafura.ventes.domain.model.Offre;
import ma.nafura.ventes.domain.model.OffreLigne;
import ma.nafura.ventes.repository.BonCommandeClientRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class BonCommandeClientService {

    private final BonCommandeClientRepository repository;
    private final BonCommandeClientSeedService seedService;

    public BonCommandeClientService(
            BonCommandeClientRepository repository, BonCommandeClientSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<BonCommandeClient> list(String status, String clientId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<BonCommandeClient> rows = loadRows(tenantId, status, clientId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(b -> matchesSearch(b, term)).toList();
        }
        rows.forEach(this::attachLigneBccIds);
        return rows;
    }

    @Transactional(readOnly = true)
    public BonCommandeClient getById(UUID id) {
        seedService.seedIfEmpty();
        BonCommandeClient entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Bon de commande client not found"));
        attachLigneBccIds(entity);
        return entity;
    }

    @Transactional
    public BonCommandeClient create(BonCommandeClientCreateDto request) {
        UUID tenantId = tenantId();
        BonCommandeClient entity = BonCommandeClient.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .numeroClient(request.getNumeroClient().trim())
                .clientId(request.getClientId().trim())
                .clientName(trimOrNull(request.getClientName()))
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .dateReception(request.getDateReception())
                .dateFinPrevue(request.getDateFinPrevue())
                .tvaTaux(request.getTvaTaux())
                .status(resolveStatus(request.getStatus(), BonCommandeClient.STATUS_RECU))
                .notes(trimOrNull(request.getNotes()))
                .lignes(new ArrayList<>())
                .build();
        applyLignes(entity, request.getLignes(), tenantId);
        BccTotalsCalculator.applyTotals(entity);
        BonCommandeClient saved = repository.save(entity);
        attachLigneBccIds(saved);
        return saved;
    }

    @Transactional
    public BonCommandeClient update(UUID id, BonCommandeClientUpdateDto request) {
        BonCommandeClient entity = getById(id);
        if (request.getNumeroClient() != null) {
            entity.setNumeroClient(request.getNumeroClient().trim());
        }
        if (request.getClientId() != null) {
            entity.setClientId(request.getClientId().trim());
        }
        if (request.getClientName() != null) {
            entity.setClientName(trimOrNull(request.getClientName()));
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getDateReception() != null) {
            entity.setDateReception(request.getDateReception());
        }
        if (request.getDateFinPrevue() != null) {
            entity.setDateFinPrevue(request.getDateFinPrevue());
        }
        if (request.getTvaTaux() != null) {
            entity.setTvaTaux(request.getTvaTaux());
        }
        if (request.getMontantFactureHt() != null) {
            entity.setMontantFactureHt(request.getMontantFactureHt());
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
            BccTotalsCalculator.applyTotals(entity);
        }
        BonCommandeClient saved = repository.save(entity);
        attachLigneBccIds(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        BonCommandeClient entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public BonCommandeClient confirm(UUID id) {
        BonCommandeClient entity = getById(id);
        if (!BonCommandeClient.STATUS_RECU.equals(entity.getStatus())) {
            throw new IllegalStateException("Only RECU BCC can be confirmed");
        }
        entity.setStatus(BonCommandeClient.STATUS_EN_COURS);
        BonCommandeClient saved = repository.save(entity);
        attachLigneBccIds(saved);
        return saved;
    }

    @Transactional
    public BonCommandeClient createFromOffre(Offre offre) {
        if (StringUtils.hasText(offre.getBccId())) {
            return getById(UUID.fromString(offre.getBccId()));
        }
        UUID tenantId = tenantId();
        BonCommandeClient entity = BonCommandeClient.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .numeroClient(offre.getNumero())
                .clientId(offre.getClientId())
                .clientName(offre.getClientName())
                .chantierId(offre.getChantierId())
                .chantierCode(offre.getChantierCode())
                .dateReception(LocalDate.now())
                .tvaTaux(offre.getTvaTaux())
                .status(BonCommandeClient.STATUS_RECU)
                .lignes(new ArrayList<>())
                .build();
        if (offre.getLignes() != null) {
            for (OffreLigne offreLigne : offre.getLignes()) {
                BonCommandeClientLigne ligne = BonCommandeClientLigne.builder()
                        .tenantId(tenantId)
                        .bcc(entity)
                        .ordre(offreLigne.getOrdre())
                        .designation(offreLigne.getDesignation())
                        .unite(offreLigne.getUnite())
                        .quantite(offreLigne.getQuantite())
                        .prixUnitaireHt(offreLigne.getPrixUnitaireHt())
                        .totalHt(offreLigne.getTotalHt())
                        .build();
                entity.getLignes().add(ligne);
            }
        }
        BccTotalsCalculator.applyTotals(entity);
        BonCommandeClient saved = repository.save(entity);
        attachLigneBccIds(saved);
        return saved;
    }

    @Transactional
    public BonCommandeClient convertToFacture(UUID id) {
        BonCommandeClient entity = getById(id);
        if (!BonCommandeClient.STATUS_EN_COURS.equals(entity.getStatus())
                && !BonCommandeClient.STATUS_PARTIELLEMENT_FACTURE.equals(entity.getStatus())) {
            throw new IllegalStateException("BCC must be EN_COURS or PARTIELLEMENT_FACTURE to convert");
        }
        entity.setStatus(BonCommandeClient.STATUS_FACTURE);
        entity.setMontantFactureHt(entity.getMontantHt());
        BonCommandeClient saved = repository.save(entity);
        attachLigneBccIds(saved);
        return saved;
    }

    private List<BonCommandeClient> loadRows(UUID tenantId, String status, String clientId) {
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

    private void applyLignes(
            BonCommandeClient entity, List<BonCommandeClientLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        int index = 0;
        for (BonCommandeClientLigneInputDto input : inputs) {
            index++;
            BonCommandeClientLigne ligne = BonCommandeClientLigne.builder()
                    .tenantId(tenantId)
                    .bcc(entity)
                    .ordre(input.getOrdre() != null ? input.getOrdre() : index)
                    .designation(input.getDesignation().trim())
                    .unite(trimOrNull(input.getUnite()))
                    .quantite(input.getQuantite())
                    .prixUnitaireHt(input.getPrixUnitaireHt())
                    .totalHt(input.getTotalHt())
                    .build();
            entity.getLignes().add(ligne);
        }
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "CMD-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case BonCommandeClient.STATUS_RECU,
                    BonCommandeClient.STATUS_EN_COURS,
                    BonCommandeClient.STATUS_PARTIELLEMENT_FACTURE,
                    BonCommandeClient.STATUS_FACTURE,
                    BonCommandeClient.STATUS_CLOTURE,
                    BonCommandeClient.STATUS_ANNULE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(BonCommandeClient b, String term) {
        return contains(b.getNumero(), term)
                || contains(b.getNumeroClient(), term)
                || contains(b.getClientName(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private void attachLigneBccIds(BonCommandeClient entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (BonCommandeClientLigne ligne : entity.getLignes()) {
            ligne.setBcc(entity);
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
