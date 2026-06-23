package ma.nafura.chantiers.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.api.request.PosteBudgetaireUpdateDto;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.domain.model.PosteBudgetaire;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PosteBudgetaireService {

    private final PosteBudgetaireRepository repository;
    private final ChantierLotRepository lotRepository;
    private final PosteBudgetaireSeedService seedService;

    public PosteBudgetaireService(
            PosteBudgetaireRepository repository,
            ChantierLotRepository lotRepository,
            PosteBudgetaireSeedService seedService) {
        this.repository = repository;
        this.lotRepository = lotRepository;
        this.seedService = seedService;
    }

    @Transactional(readOnly = true)
    public List<PosteBudgetaire> listByLot(String lotId) {
        seedService.seedIfEmpty();
        ChantierLot lot = requireLot(lotId);
        return repository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(tenantId(), lot.getId());
    }

    @Transactional
    public PosteBudgetaire create(String lotId, PosteBudgetaireCreateDto request) {
        requireLot(lotId);
        UUID tenantId = tenantId();
        String code = request.getCode().trim();
        if (repository.findByTenantIdAndLotIdAndCode(tenantId, lotId, code).isPresent()) {
            throw new IllegalArgumentException("Poste code already exists for lot: " + code);
        }

        int ordre = request.getOrdre() != null ? request.getOrdre() : nextOrdre(tenantId, lotId);
        String id = StringUtils.hasText(request.getId())
                ? request.getId().trim()
                : buildPosteId(lotId, code);

        if (repository.findByIdAndTenantId(id, tenantId).isPresent()) {
            throw new IllegalArgumentException("Poste id already exists: " + id);
        }

        PosteBudgetaire entity = PosteBudgetaire.builder()
                .id(id)
                .tenantId(tenantId)
                .lotId(lotId)
                .code(code)
                .designation(request.getDesignation().trim())
                .unite(trimOrNull(request.getUnite()))
                .quantite(request.getQuantite())
                .prixUnitaireHt(request.getPrixUnitaireHt())
                .montantHt(resolveMontantHt(request))
                .ordre(ordre)
                .build();
        return repository.save(entity);
    }

    @Transactional
    public PosteBudgetaire update(String id, PosteBudgetaireUpdateDto request) {
        UUID tenantId = tenantId();
        PosteBudgetaire entity = repository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Poste budgetaire not found: " + id));

        if (StringUtils.hasText(request.getCode())) {
            String code = request.getCode().trim();
            repository.findByTenantIdAndLotIdAndCode(tenantId, entity.getLotId(), code)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException("Poste code already exists for lot: " + code);
                    });
            entity.setCode(code);
        }
        if (StringUtils.hasText(request.getDesignation())) {
            entity.setDesignation(request.getDesignation().trim());
        }
        if (request.getUnite() != null) {
            entity.setUnite(trimOrNull(request.getUnite()));
        }
        if (request.getQuantite() != null) {
            entity.setQuantite(request.getQuantite());
        }
        if (request.getPrixUnitaireHt() != null) {
            entity.setPrixUnitaireHt(request.getPrixUnitaireHt());
        }
        if (request.getMontantHt() != null) {
            entity.setMontantHt(request.getMontantHt());
        } else if (request.getQuantite() != null && request.getPrixUnitaireHt() != null) {
            entity.setMontantHt(request.getQuantite().multiply(request.getPrixUnitaireHt()));
        } else if (entity.getQuantite() != null && entity.getPrixUnitaireHt() != null) {
            entity.setMontantHt(entity.getQuantite().multiply(entity.getPrixUnitaireHt()));
        }
        if (request.getOrdre() != null) {
            entity.setOrdre(request.getOrdre());
        }
        return repository.save(entity);
    }

    private ChantierLot requireLot(String lotId) {
        return lotRepository.findByIdAndTenantId(lotId, tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Lot not found: " + lotId));
    }

    private int nextOrdre(UUID tenantId, String lotId) {
        return repository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(tenantId, lotId).stream()
                        .mapToInt(PosteBudgetaire::getOrdre)
                        .max()
                        .orElse(0)
                + 1;
    }

    private static String buildPosteId(String lotId, String code) {
        String slug = code.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        return lotId + "-poste-" + slug;
    }

    private static BigDecimal resolveMontantHt(PosteBudgetaireCreateDto request) {
        if (request.getMontantHt() != null) {
            return request.getMontantHt();
        }
        if (request.getQuantite() != null && request.getPrixUnitaireHt() != null) {
            return request.getQuantite().multiply(request.getPrixUnitaireHt());
        }
        return null;
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static UUID tenantId() {
        return TenantContext.getTenantId();
    }
}
