package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.api.request.AppelOffreAchatCreateDto;
import ma.nafura.achats.api.request.AppelOffreAchatUpdateDto;
import ma.nafura.achats.api.request.AppelOffreLigneInputDto;
import ma.nafura.achats.api.request.OffreFournisseurInputDto;
import ma.nafura.achats.api.request.OffreFournisseurLigneInputDto;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.achats.domain.model.AppelOffreLigne;
import ma.nafura.achats.api.dto.AppelOffreAttribuerResultDto;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.OffreFournisseur;
import ma.nafura.achats.domain.model.OffreFournisseurLigne;
import ma.nafura.achats.repository.AppelOffreAchatRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class AppelOffreAchatService {

    private final AppelOffreAchatRepository repository;
    private final AppelOffreAchatSeedService seedService;
    private final BonCommandeAchatService bonCommandeAchatService;

    public AppelOffreAchatService(
            AppelOffreAchatRepository repository,
            AppelOffreAchatSeedService seedService,
            BonCommandeAchatService bonCommandeAchatService) {
        this.repository = repository;
        this.seedService = seedService;
        this.bonCommandeAchatService = bonCommandeAchatService;
    }

    @Transactional(readOnly = true)
    public List<AppelOffreAchat> list(String status, String chantierId, String search) {
        seedService.seedIfEmpty();
        UUID tenantId = tenantId();
        List<AppelOffreAchat> rows = loadRows(tenantId, status, chantierId);
        if (StringUtils.hasText(search)) {
            String term = search.trim().toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(a -> matchesSearch(a, term)).toList();
        }
        rows.forEach(this::attachRelations);
        return rows;
    }

    @Transactional(readOnly = true)
    public AppelOffreAchat getById(UUID id) {
        seedService.seedIfEmpty();
        AppelOffreAchat entity = repository
                .findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Appel offre achat not found"));
        attachRelations(entity);
        return entity;
    }

    @Transactional
    public AppelOffreAchat create(AppelOffreAchatCreateDto request) {
        UUID tenantId = tenantId();
        AppelOffreAchat entity = AppelOffreAchat.builder()
                .tenantId(tenantId)
                .numero(nextNumero(tenantId))
                .objet(request.getObjet().trim())
                .chantierId(trimOrNull(request.getChantierId()))
                .chantierCode(trimOrNull(request.getChantierCode()))
                .chantierName(trimOrNull(request.getChantierName()))
                .datePublication(request.getDatePublication())
                .dateLimiteDepot(request.getDateLimiteDepot())
                .status(resolveStatus(request.getStatus(), AppelOffreAchat.STATUS_BROUILLON))
                .fournisseurAttribueId(trimOrNull(request.getFournisseurAttribueId()))
                .fournisseurAttribueName(trimOrNull(request.getFournisseurAttribueName()))
                .bcGenereId(trimOrNull(request.getBcGenereId()))
                .bcGenereNumero(trimOrNull(request.getBcGenereNumero()))
                .totalAttribueHt(request.getTotalAttribueHt())
                .notes(trimOrNull(request.getNotes()))
                .fournisseurInvitesIds(copyInviteIds(request.getFournisseurInvitesIds()))
                .lignes(new ArrayList<>())
                .reponses(new ArrayList<>())
                .build();
        applyLignes(entity, request.getLignes(), tenantId);
        applyReponses(entity, request.getReponses(), tenantId);
        AppelOffreAchat saved = repository.save(entity);
        attachRelations(saved);
        return saved;
    }

    @Transactional
    public AppelOffreAchat update(UUID id, AppelOffreAchatUpdateDto request) {
        AppelOffreAchat entity = getById(id);
        if (request.getObjet() != null) {
            entity.setObjet(request.getObjet().trim());
        }
        if (request.getChantierId() != null) {
            entity.setChantierId(trimOrNull(request.getChantierId()));
        }
        if (request.getChantierCode() != null) {
            entity.setChantierCode(trimOrNull(request.getChantierCode()));
        }
        if (request.getChantierName() != null) {
            entity.setChantierName(trimOrNull(request.getChantierName()));
        }
        if (request.getDatePublication() != null) {
            entity.setDatePublication(request.getDatePublication());
        }
        if (request.getDateLimiteDepot() != null) {
            entity.setDateLimiteDepot(request.getDateLimiteDepot());
        }
        if (request.getStatus() != null) {
            entity.setStatus(resolveStatus(request.getStatus(), entity.getStatus()));
        }
        if (request.getFournisseurAttribueId() != null) {
            entity.setFournisseurAttribueId(trimOrNull(request.getFournisseurAttribueId()));
        }
        if (request.getFournisseurAttribueName() != null) {
            entity.setFournisseurAttribueName(trimOrNull(request.getFournisseurAttribueName()));
        }
        if (request.getBcGenereId() != null) {
            entity.setBcGenereId(trimOrNull(request.getBcGenereId()));
        }
        if (request.getBcGenereNumero() != null) {
            entity.setBcGenereNumero(trimOrNull(request.getBcGenereNumero()));
        }
        if (request.getTotalAttribueHt() != null) {
            entity.setTotalAttribueHt(request.getTotalAttribueHt());
        }
        if (request.getNotes() != null) {
            entity.setNotes(trimOrNull(request.getNotes()));
        }
        if (request.getFournisseurInvitesIds() != null) {
            entity.setFournisseurInvitesIds(copyInviteIds(request.getFournisseurInvitesIds()));
        }
        if (request.getLignes() != null) {
            entity.getLignes().clear();
            applyLignes(entity, request.getLignes(), tenantId());
        }
        if (request.getReponses() != null) {
            entity.getReponses().clear();
            applyReponses(entity, request.getReponses(), tenantId());
        }
        AppelOffreAchat saved = repository.save(entity);
        attachRelations(saved);
        return saved;
    }

    @Transactional
    public void delete(UUID id) {
        AppelOffreAchat entity = getById(id);
        repository.delete(entity);
    }

    private List<AppelOffreAchat> loadRows(UUID tenantId, String status, String chantierId) {
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

    private void applyLignes(AppelOffreAchat entity, List<AppelOffreLigneInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        for (AppelOffreLigneInputDto input : inputs) {
            AppelOffreLigne ligne = AppelOffreLigne.builder()
                    .tenantId(tenantId)
                    .appelOffre(entity)
                    .articleId(input.getArticleId().trim())
                    .articleCode(trimOrNull(input.getArticleCode()))
                    .articleName(trimOrNull(input.getArticleName()))
                    .quantite(input.getQuantite())
                    .uomCode(trimOrNull(input.getUomCode()))
                    .build();
            entity.getLignes().add(ligne);
        }
    }

    private void applyReponses(AppelOffreAchat entity, List<OffreFournisseurInputDto> inputs, UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        Map<UUID, AppelOffreLigne> ligneById = ligneMap(entity);
        for (OffreFournisseurInputDto input : inputs) {
            OffreFournisseur offre = OffreFournisseur.builder()
                    .tenantId(tenantId)
                    .appelOffre(entity)
                    .fournisseurId(input.getFournisseurId().trim())
                    .fournisseurName(trimOrNull(input.getFournisseurName()))
                    .dateReponse(input.getDateReponse())
                    .totalHt(input.getTotalHt() != null ? input.getTotalHt() : BigDecimal.ZERO)
                    .delaiLivraisonJours(input.getDelaiLivraisonJours())
                    .conditionsPaiement(trimOrNull(input.getConditionsPaiement()))
                    .notes(trimOrNull(input.getNotes()))
                    .retenue(Boolean.TRUE.equals(input.getRetenue()))
                    .score(input.getScore())
                    .lignes(new ArrayList<>())
                    .build();
            applyOffreLignes(offre, input.getLignes(), ligneById, tenantId);
            if (offre.getTotalHt() == null || offre.getTotalHt().compareTo(BigDecimal.ZERO) == 0) {
                offre.setTotalHt(computeOffreTotal(offre.getLignes()));
            }
            entity.getReponses().add(offre);
        }
    }

    private void applyOffreLignes(
            OffreFournisseur offre,
            List<OffreFournisseurLigneInputDto> inputs,
            Map<UUID, AppelOffreLigne> ligneById,
            UUID tenantId) {
        if (inputs == null || inputs.isEmpty()) {
            return;
        }
        for (OffreFournisseurLigneInputDto input : inputs) {
            AppelOffreLigne aoLigne = ligneById.get(input.getAoLigneId());
            if (aoLigne == null) {
                throw new IllegalArgumentException("AO ligne not found: " + input.getAoLigneId());
            }
            BigDecimal total = input.getTotalHt();
            if (total == null) {
                total = input.getPrixUnitaireHt().multiply(aoLigne.getQuantite());
            }
            OffreFournisseurLigne ligne = OffreFournisseurLigne.builder()
                    .tenantId(tenantId)
                    .offre(offre)
                    .appelOffreLigne(aoLigne)
                    .prixUnitaireHt(input.getPrixUnitaireHt())
                    .totalHt(total)
                    .delaiSpecifique(input.getDelaiSpecifique())
                    .build();
            offre.getLignes().add(ligne);
        }
    }

    private Map<UUID, AppelOffreLigne> ligneMap(AppelOffreAchat entity) {
        Map<UUID, AppelOffreLigne> map = new HashMap<>();
        for (AppelOffreLigne ligne : entity.getLignes()) {
            if (ligne.getId() != null) {
                map.put(ligne.getId(), ligne);
            }
        }
        return map;
    }

    private BigDecimal computeOffreTotal(List<OffreFournisseurLigne> lignes) {
        return lignes.stream()
                .map(l -> l.getTotalHt() != null ? l.getTotalHt() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    public AppelOffreAchat publish(UUID id) {
        AppelOffreAchat entity = getById(id);
        if (!AppelOffreAchat.STATUS_BROUILLON.equals(entity.getStatus())) {
            throw new IllegalStateException("Only draft appels d'offres can be published");
        }
        entity.setStatus(AppelOffreAchat.STATUS_PUBLIEE);
        if (entity.getDatePublication() == null) {
            entity.setDatePublication(LocalDate.now());
        }
        return saveEntity(entity);
    }

    @Transactional
    public AppelOffreAchat cloreReception(UUID id) {
        AppelOffreAchat entity = getById(id);
        if (!AppelOffreAchat.STATUS_PUBLIEE.equals(entity.getStatus())) {
            throw new IllegalStateException("Only published appels d'offres can be closed for offers");
        }
        entity.setStatus(AppelOffreAchat.STATUS_CLOTUREE);
        return saveEntity(entity);
    }

    @Transactional
    public AppelOffreAttribuerResultDto attribuer(UUID id, String fournisseurId, String fournisseurName) {
        AppelOffreAchat entity = getById(id);
        if (!AppelOffreAchat.STATUS_CLOTUREE.equals(entity.getStatus())
                && !AppelOffreAchat.STATUS_PUBLIEE.equals(entity.getStatus())) {
            throw new IllegalStateException("AO must be published or closed before attribution");
        }
        OffreFournisseur winning = null;
        if (entity.getReponses() != null) {
            winning = entity.getReponses().stream()
                    .filter(o -> fournisseurId.equals(o.getFournisseurId()))
                    .findFirst()
                    .orElse(null);
        }
        BonCommandeAchat bc =
                bonCommandeAchatService.createFromAppelOffre(entity, fournisseurId, fournisseurName, winning);
        entity.setStatus(AppelOffreAchat.STATUS_ATTRIBUEE);
        entity.setFournisseurAttribueId(fournisseurId.trim());
        entity.setFournisseurAttribueName(trimOrNull(fournisseurName));
        entity.setBcGenereId(bc.getId().toString());
        entity.setBcGenereNumero(bc.getNumero());
        if (winning != null) {
            entity.setTotalAttribueHt(winning.getTotalHt());
        } else {
            entity.setTotalAttribueHt(bc.getTotalHt());
        }
        AppelOffreAchat saved = saveEntity(entity);
        return AppelOffreAttribuerResultDto.builder().ao(saved).bc(bc).build();
    }

    private AppelOffreAchat saveEntity(AppelOffreAchat entity) {
        entity.setUpdatedAt(OffsetDateTime.now());
        AppelOffreAchat saved = repository.save(entity);
        attachRelations(saved);
        return saved;
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "AO-" + Year.now().getValue() + "-" + String.format("%04d", count);
    }

    private String resolveStatus(String requested, String fallback) {
        if (!StringUtils.hasText(requested)) {
            return fallback;
        }
        String normalized = requested.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case AppelOffreAchat.STATUS_BROUILLON,
                    AppelOffreAchat.STATUS_PUBLIEE,
                    AppelOffreAchat.STATUS_CLOTUREE,
                    AppelOffreAchat.STATUS_ATTRIBUEE,
                    AppelOffreAchat.STATUS_INFRUCTUEUSE,
                    AppelOffreAchat.STATUS_ANNULEE -> normalized;
            default -> fallback;
        };
    }

    private boolean matchesSearch(AppelOffreAchat a, String term) {
        return contains(a.getNumero(), term)
                || contains(a.getObjet(), term)
                || contains(a.getChantierName(), term);
    }

    private boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }

    private void attachRelations(AppelOffreAchat entity) {
        if (entity.getLignes() != null) {
            for (AppelOffreLigne ligne : entity.getLignes()) {
                ligne.setAppelOffre(entity);
            }
        }
        if (entity.getReponses() != null) {
            for (OffreFournisseur offre : entity.getReponses()) {
                offre.setAppelOffre(entity);
                if (offre.getLignes() != null) {
                    Map<UUID, AppelOffreLigne> aoLineById = new HashMap<>();
                    if (entity.getLignes() != null) {
                        for (AppelOffreLigne aoLigne : entity.getLignes()) {
                            aoLineById.put(aoLigne.getId(), aoLigne);
                        }
                    }
                    for (OffreFournisseurLigne ligne : offre.getLignes()) {
                        ligne.setOffre(offre);
                        if (ligne.getAppelOffreLigne() != null
                                && ligne.getAppelOffreLigne().getId() != null) {
                            AppelOffreLigne resolved =
                                    aoLineById.get(ligne.getAppelOffreLigne().getId());
                            if (resolved != null) {
                                ligne.setAppelOffreLigne(resolved);
                            }
                        }
                    }
                }
            }
        }
    }

    private List<String> copyInviteIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        return new ArrayList<>(ids.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList());
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
