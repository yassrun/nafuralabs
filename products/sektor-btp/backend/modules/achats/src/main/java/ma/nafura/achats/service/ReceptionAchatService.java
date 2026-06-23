package ma.nafura.achats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.api.request.ReceptionAchatCreateDto;
import ma.nafura.achats.api.request.ReceptionAchatLigneInputDto;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.BonCommandeAchatLigne;
import ma.nafura.achats.domain.model.ReceptionAchat;
import ma.nafura.achats.domain.model.ReceptionAchatLigne;
import ma.nafura.achats.repository.ReceptionAchatRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ReceptionAchatService {

    private final ReceptionAchatRepository repository;
    private final BonCommandeAchatService bonCommandeService;
    private final ReceptionStockMovementService receptionStockMovementService;

    public ReceptionAchatService(
            ReceptionAchatRepository repository,
            BonCommandeAchatService bonCommandeService,
            ReceptionStockMovementService receptionStockMovementService) {
        this.repository = repository;
        this.bonCommandeService = bonCommandeService;
        this.receptionStockMovementService = receptionStockMovementService;
    }

    @Transactional(readOnly = true)
    public List<ReceptionAchat> listByBonCommande(UUID bonCommandeId) {
        return repository.findByTenantIdAndBonCommandeAchatIdOrderByCreatedAtDesc(
                tenantId(), bonCommandeId);
    }

    @Transactional
    public ReceptionAchat create(UUID bonCommandeId, ReceptionAchatCreateDto request) {
        BonCommandeAchat bc = bonCommandeService.getById(bonCommandeId);
        String status = bc.getStatus();
        if (!BonCommandeAchat.STATUS_ENVOYE.equals(status)
                && !BonCommandeAchat.STATUS_ACCUSE_RECEPTION.equals(status)
                && !BonCommandeAchat.STATUS_PARTIELLEMENT_LIVRE.equals(status)) {
            throw new IllegalStateException("Purchase order must be sent before reception");
        }

        UUID tenantId = tenantId();
        Map<UUID, BonCommandeAchatLigne> ligneById = new HashMap<>();
        for (BonCommandeAchatLigne ligne : bc.getLignes()) {
            ligneById.put(ligne.getId(), ligne);
        }

        ReceptionAchat reception = ReceptionAchat.builder()
                .tenantId(tenantId)
                .bonCommandeAchatId(bc.getId())
                .numero(nextNumero(tenantId))
                .dateReception(
                        request.getDateReception() != null ? request.getDateReception() : LocalDate.now())
                .blNumero(trimOrNull(request.getBlNumero()))
                .status(ReceptionAchat.STATUS_VALIDE)
                .notes(trimOrNull(request.getNotes()))
                .lignes(new java.util.ArrayList<>())
                .build();

        for (ReceptionAchatLigneInputDto input : request.getLignes()) {
            BonCommandeAchatLigne bcLigne = ligneById.get(input.getBonCommandeLigneId());
            if (bcLigne == null) {
                throw new IllegalArgumentException("BC line not found: " + input.getBonCommandeLigneId());
            }
            BigDecimal qty = input.getQuantiteRecue();
            BigDecimal remaining = bcLigne.getQuantite().subtract(bcLigne.getQuantiteLivree());
            if (qty.compareTo(remaining) > 0) {
                throw new IllegalStateException(
                        "Received quantity exceeds remaining for line " + bcLigne.getId());
            }
            bcLigne.setQuantiteLivree(bcLigne.getQuantiteLivree().add(qty));
            ReceptionAchatLigne recLigne = ReceptionAchatLigne.builder()
                    .tenantId(tenantId)
                    .reception(reception)
                    .bonCommandeLigneId(bcLigne.getId())
                    .articleId(input.getArticleId().trim())
                    .quantiteRecue(qty)
                    .build();
            reception.getLignes().add(recLigne);
        }

        recomputeBcDelivery(bc);
        repository.save(reception);
        bonCommandeService.saveAfterReception(bc);
        receptionStockMovementService.createAndValidateReception(
                reception, bc, request.getDestLocationId(), ligneById);
        return reception;
    }

    private void recomputeBcDelivery(BonCommandeAchat bc) {
        BigDecimal totalLivre = BigDecimal.ZERO;
        boolean allDelivered = true;
        boolean anyDelivered = false;
        for (BonCommandeAchatLigne ligne : bc.getLignes()) {
            BigDecimal lineDelivered =
                    ligne.getPrixUnitaireHt().multiply(ligne.getQuantiteLivree()).setScale(4, RoundingMode.HALF_UP);
            totalLivre = totalLivre.add(lineDelivered);
            if (ligne.getQuantiteLivree().compareTo(ligne.getQuantite()) < 0) {
                allDelivered = false;
            }
            if (ligne.getQuantiteLivree().compareTo(BigDecimal.ZERO) > 0) {
                anyDelivered = true;
            }
        }
        bc.setTotalLivreHt(totalLivre);
        if (allDelivered && anyDelivered) {
            bc.setStatus(BonCommandeAchat.STATUS_LIVRE);
        } else if (anyDelivered) {
            bc.setStatus(BonCommandeAchat.STATUS_PARTIELLEMENT_LIVRE);
        }
    }

    private String nextNumero(UUID tenantId) {
        long count = repository.countByTenantId(tenantId) + 1;
        return "REC-" + Year.now().getValue() + "-" + String.format("%05d", count);
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
