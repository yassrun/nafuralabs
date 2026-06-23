package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.achats.api.request.DemandeAchatCreateDto;
import ma.nafura.achats.api.request.DemandeAchatLigneInputDto;
import ma.nafura.achats.api.request.DemandeAchatUpdateDto;
import ma.nafura.achats.domain.model.DemandeAchat;
import ma.nafura.achats.domain.model.DemandeAchatLigne;
import ma.nafura.achats.repository.DemandeAchatRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DemandeAchatService {

    private final DemandeAchatRepository repository;
    private final DemandeAchatSeedService seedService;

    public DemandeAchatService(DemandeAchatRepository repository, DemandeAchatSeedService seedService) {
        this.repository = repository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<DemandeAchat> list(String status, String chantierId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<DemandeAchat> rows = loadRows(tenantId, status, chantierId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream()
                    .filter(d -> matchesSearch(d, term))
                    .toList();
        }
        rows.forEach(this::attachLigneDaIds);
        return rows;
    }

    @Transactional(readOnly = true)
    public DemandeAchat getById(UUID id) {
        seedService.seedIfEmpty();
        DemandeAchat entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Demande achat not found"));
        attachLigneDaIds(entity);
        return entity;
    }

    @Transactional
    public DemandeAchat create(DemandeAchatCreateDto request) {
        UUID tenantId = tenantId();
        DemandeAchat entity = DemandeAchat.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .chantierName(trimOrNull(request.getChantierName()))
                .dateBesoin(request.getDateBesoin())
                .demandeurId(request.getDemandeurId().trim())
                .demandeurName(trimOrNull(request.getDemandeurName()))
                .motif(trimOrNull(request.getMotif()))
                .status(resolveStatus(request.getStatus(), DemandeAchat.STATUS_BROUILLON))
                .approbateurId(trimOrNull(request.getApprobateurId()))
                .approbateurName(trimOrNull(request.getApprobateurName()))
                .approbationDate(request.getApprobationDate())
                .motifRejet(trimOrNull(request.getMotifRejet()))
                .bcId(trimOrNull(request.getBcId()))
                .bcNumero(trimOrNull(request.getBcNumero()))
                .notes(trimOrNull(request.getNotes()))
                .lignes(new ArrayList<>())
                .build();
        applyLignes(entity, request.getLignes(), tenantId);
        entity.setTotalEstimeHt(computeTotal(entity.getLignes()));
        DemandeAchat saved = repository.save(entity);
        attachLigneDaIds(saved);
        return saved;
    }

    @Transactional
    public DemandeAchat update(UUID id, DemandeAchatUpdateDto request) {
        DemandeAchat entity = getById(id);
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getChantierName() != null) {
            entity.setChantierName(trimOrNull(request.getChantierName()));
        }
        if (request.getDateBesoin() != null) {
            entity.setDateBesoin(request.getDateBesoin());
        }
        if (request.getDemandeurId() != null) {
            entity.setDemandeurId(request.getDemandeurId().trim());
        }
        if (request.getDemandeurName() != null) {
            entity.setDemandeurName(trimOrNull(request.getDemandeurName()));
        }
        if (request.getMotif() != null) {
            entity.setMotif(trimOrNull(request.getMotif()));
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getApprobateurId() != null) {
            entity.setApprobateurId(trimOrNull(request.getApprobateurId()));
        }
        if (request.getApprobateurName() != null) {
            entity.setApprobateurName(trimOrNull(request.getApprobateurName()));
        }
        if (request.getApprobationDate() != null) {
            entity.setApprobationDate(request.getApprobationDate());
        }
        if (request.getMotifRejet() != null) {
            entity.setMotifRejet(trimOrNull(request.getMotifRejet()));
        }
        if (request.getBcId() != null) {
            entity.setBcId(trimOrNull(request.getBcId()));
        }
        if (request.getBcNumero() != null) {
            entity.setBcNumero(trimOrNull(request.getBcNumero()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getLignes() != null) {
            entity.getLignes().clear();
            applyLignes(entity, request.getLignes(), tenantId());
            entity.setTotalEstimeHt(computeTotal(entity.getLignes()));
        }
        DemandeAchat saved = repository.save(entity);
        attachLigneDaIds(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        DemandeAchat entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public DemandeAchat submit(UUID id) {
        DemandeAchat entity = getById(id);
        if (!DemandeAchat.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft demandes can be submitted");
        }
        entity.setStatus(DemandeAchat.STATUS_SOUMISE);
        return saveWithLines(entity);
    }

    @Transactional
    public DemandeAchat approve(UUID id, String approbateurId, String approbateurName) {
        DemandeAchat entity = getById(id);
        if (!DemandeAchat.STATUS_SOUMISE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only submitted demandes can be approved");
        }
        entity.setStatus(DemandeAchat.STATUS_APPROUVEE);
        if (StringUtils.hasText(approbateurId)) {
            entity.setApprobateurId(approbateurId.trim());
        }
        if (StringUtils.hasText(approbateurName)) {
            entity.setApprobateurName(approbateurName.trim());
        }
        entity.setApprobationDate(LocalDate.now());
        entity.setMotifRejet(null);
        return saveWithLines(entity);
    }

    @Transactional
    public DemandeAchat reject(UUID id, String motifRejet) {
        DemandeAchat entity = getById(id);
        if (!DemandeAchat.STATUS_SOUMISE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only submitted demandes can be rejected");
        }
        if (!StringUtils.hasText(motifRejet)) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        entity.setStatus(DemandeAchat.STATUS_REJETEE);
        entity.setMotifRejet(motifRejet.trim());
        entity.setApprobationDate(null);
        return saveWithLines(entity);
    }

    @Transactional
    public DemandeAchat convertToAo(UUID id) {
        DemandeAchat entity = getById(id);
        if (!DemandeAchat.STATUS_APPROUVEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only approved demandes can be converted");
        }
        entity.setStatus(DemandeAchat.STATUS_CONVERTIE);
        return saveWithLines(entity);
    }

    private DemandeAchat saveWithLines(DemandeAchat entity) {
        entity.setUpdatedAt(OffsetDateTime.now());
        DemandeAchat saved = repository.save(entity);
        attachLigneDaIds(saved);
        return saved;
    }

    private List<DemandeAchat> loadRows(UUID tenantId, String status, String chantierId) {
        boolean hasStatus = StringUtils.hasText(status);
        boolean hasChantier = StringUtils.hasText(chantierId);
        if (hasStatus && hasChantier) {
            return repository.findByTenantIdAndStatusAndChantierIdOrderByCreatedAtDesc(
                    tenantId, status.trim(), chantierId.trim());
        }
        if (hasStatus) {
            return repository.findByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, status.trim());
        }
        if (hasChantier) {
            return repository.findByTenantIdAndChantierIdOrderByCreatedAtDesc(tenantId, chantierId.trim());
        }
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    private void applyLignes(DemandeAchat entity, List<DemandeAchatLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        for (DemandeAchatLigneInputDto input : inputs) {
            BigDecimal qty = input.getQuantite();
            BigDecimal unitPrice = input.getPrixEstimeHt();
            BigDecimal lineTotal = input.getTotalEstimeHt();
            if (lineTotal == null && unitPrice != null) {
                lineTotal = unitPrice.multiply(qty);
            }
            DemandeAchatLigne ligne = DemandeAchatLigne.builder()
                    .tenantId(tenantId)
                    .demande(entity)
                    .articleId(input.getArticleId().trim())
                    .articleCode(trimOrNull(input.getArticleCode()))
                    .articleName(trimOrNull(input.getArticleName()))
                    .quantite(qty)
                    .uomCode(trimOrNull(input.getUomCode()))
                    .prixEstimeHt(unitPrice)
                    .totalEstimeHt(lineTotal)
                    .notes(trimOrNull(input.getNotes()))
                    .build();
            entity.getLignes().add(ligne);
        }
    }

    private BigDecimal computeTotal(List<DemandeAchatLigne> lignes) {
        return lignes.stream()
                .map(l -> l.getTotalEstimeHt() != null ? l.getTotalEstimeHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "DA-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case DemandeAchat.STATUS_BROUILLON,
                    DemandeAchat.STATUS_SOUMISE,
                    DemandeAchat.STATUS_APPROUVEE,
                    DemandeAchat.STATUS_REJETEE,
                    DemandeAchat.STATUS_CONVERTIE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(DemandeAchat d, String term) {
        return contains(d.getNumero(), term)
                || contains(d.getChantierName(), term)
                || contains(d.getDemandeurName(), term)
                || contains(d.getMotif(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private void attachLigneDaIds(DemandeAchat entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (DemandeAchatLigne ligne : entity.getLignes()) {
            ligne.setDemande(entity);
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
