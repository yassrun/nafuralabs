package ma.nafura.ventes.service;

import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.ventes.api.dto.OffreConvertResultDto;
import ma.nafura.ventes.api.request.OffreCreateDto;
import ma.nafura.ventes.api.request.OffreLigneInputDto;
import ma.nafura.ventes.api.request.OffreUpdateDto;
import ma.nafura.ventes.domain.model.BonCommandeClient;
import ma.nafura.ventes.domain.model.Offre;
import ma.nafura.ventes.domain.model.OffreLigne;
import ma.nafura.ventes.repository.OffreRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class OffreService {

    private final OffreRepository repository;
    private final OffreSeedService seedService;
    private final BonCommandeClientService bonCommandeClientService;

    public OffreService(
            OffreRepository repository,
            OffreSeedService seedService,
            BonCommandeClientService bonCommandeClientService) {
        this.repository = repository;
        this.seedService = seedService;
        this.bonCommandeClientService = bonCommandeClientService;
    }

    @Transactional(readOnly = true)
    public List<Offre> list(String status, String clientId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<Offre> rows = loadRows(tenantId, status, clientId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(o -> matchesSearch(o, term)).toList();
        }
        rows.forEach(this::attachLigneOffreIds);
        return rows;
    }

    @Transactional(readOnly = true)
    public Offre getById(UUID id) {
        seedService.seedIfEmpty();
        Offre entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Offre commerciale not found"));
        attachLigneOffreIds(entity);
        return entity;
    }

    @Transactional
    public Offre create(OffreCreateDto request) {
        UUID tenantId = tenantId();
        Offre entity = Offre.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .clientId(request.getClientId().trim())
                .clientName(trimOrNull(request.getClientName()))
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .dateEmission(request.getDateEmission())
                .dateValidite(request.getDateValidite())
                .objet(request.getObjet().trim())
                .tvaTaux(request.getTvaTaux())
                .status(resolveStatus(request.getStatus(), Offre.STATUS_BROUILLON))
                .motifRefus(trimOrNull(request.getMotifRefus()))
                .notes(trimOrNull(request.getNotes()))
                .lignes(new ArrayList<>())
                .build();
        applyLignes(entity, request.getLignes(), tenantId);
        OffreTotalsCalculator.applyTotals(entity);
        Offre saved = repository.save(entity);
        attachLigneOffreIds(saved);
        return saved;
    }

    @Transactional
    public Offre update(UUID id, OffreUpdateDto request) {
        Offre entity = getById(id);
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
        if (request.getDateEmission() != null) {
            entity.setDateEmission(request.getDateEmission());
        }
        if (request.getDateValidite() != null) {
            entity.setDateValidite(request.getDateValidite());
        }
        if (request.getObjet() != null) {
            entity.setObjet(request.getObjet().trim());
        }
        if (request.getTvaTaux() != null) {
            entity.setTvaTaux(request.getTvaTaux());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getMotifRefus() != null) {
            entity.setMotifRefus(trimOrNull(request.getMotifRefus()));
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getLignes() != null) {
            entity.getLignes().clear();
            applyLignes(entity, request.getLignes(), tenantId());
            OffreTotalsCalculator.applyTotals(entity);
        }
        Offre saved = repository.save(entity);
        attachLigneOffreIds(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        Offre entity = getById(id);
        repository.delete(entity);
    }

    @Transactional
    public Offre send(UUID id) {
        Offre entity = getById(id);
        if (!Offre.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft offers can be sent");
        }
        entity.setStatus(Offre.STATUS_ENVOYEE);
        return saveEntity(entity);
    }

    @Transactional
    public Offre accept(UUID id) {
        Offre entity = getById(id);
        if (!Offre.STATUS_ENVOYEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only sent offers can be accepted");
        }
        entity.setStatus(Offre.STATUS_ACCEPTEE);
        return saveEntity(entity);
    }

    @Transactional
    public Offre refuse(UUID id, String motifRefus) {
        Offre entity = getById(id);
        if (!Offre.STATUS_ENVOYEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only sent offers can be refused");
        }
        entity.setStatus(Offre.STATUS_REFUSEE);
        entity.setMotifRefus(motifRefus.trim());
        return saveEntity(entity);
    }

    @Transactional
    public OffreConvertResultDto convertToBcc(UUID id) {
        Offre entity = getById(id);
        if (!Offre.STATUS_ACCEPTEE.equals(entity.getStatus())
                && !Offre.STATUS_CONVERTIE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only accepted offers can be converted to BCC");
        }
        BonCommandeClient bcc = bonCommandeClientService.createFromOffre(entity);
        if (!Offre.STATUS_CONVERTIE.equals(entity.getStatus())) {
            entity.setStatus(Offre.STATUS_CONVERTIE);
            entity.setBccId(bcc.getId().toString());
            entity.setBccNumero(bcc.getNumero());
            entity = saveEntity(entity);
        }
        return OffreConvertResultDto.builder().offre(entity).bcc(bcc).build();
    }

    @Transactional
    public Offre cancel(UUID id) {
        Offre entity = getById(id);
        if (!Offre.STATUS_BROUILLON.equals(entity.getStatus())
                && !Offre.STATUS_ENVOYEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft or sent offers can be cancelled");
        }
        entity.setStatus(Offre.STATUS_ANNULEE);
        return saveEntity(entity);
    }

    private Offre saveEntity(Offre entity) {
        entity.setUpdatedAt(OffsetDateTime.now());
        Offre saved = repository.save(entity);
        attachLigneOffreIds(saved);
        return saved;
    }

    private List<Offre> loadRows(UUID tenantId, String status, String clientId) {
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

    private void applyLignes(Offre entity, List<OffreLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        int index = 0;
        for (OffreLigneInputDto input : inputs) {
            index++;
            OffreLigne ligne = OffreLigne.builder()
                    .tenantId(tenantId)
                    .offre(entity)
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
        return "OF-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case Offre.STATUS_BROUILLON,
                    Offre.STATUS_ENVOYEE,
                    Offre.STATUS_ACCEPTEE,
                    Offre.STATUS_REFUSEE,
                    Offre.STATUS_EXPIREE,
                    Offre.STATUS_ANNULEE,
                    Offre.STATUS_CONVERTIE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(Offre o, String term) {
        return contains(o.getNumero(), term)
                || contains(o.getClientName(), term)
                || contains(o.getObjet(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private void attachLigneOffreIds(Offre entity) {
        if (entity.getLignes() == null) {
            return;
        }
        for (OffreLigne ligne : entity.getLignes()) {
            ligne.setOffre(entity);
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
