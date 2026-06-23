package ma.nafura.achats.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.domain.model.BonCommandeAchat;
import ma.nafura.achats.domain.model.BonCommandeAchatLigne;
import ma.nafura.achats.domain.model.ReceptionAchat;
import ma.nafura.achats.domain.model.ReceptionAchatLigne;
import ma.nafura.stock.api.dto.InventoryTxDetailDto;
import ma.nafura.stock.api.request.InventoryTxLineInputDto;
import ma.nafura.stock.api.request.InventoryTxWithLinesCreateDto;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.service.InventoryTxService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ReceptionStockMovementService {

    private final InventoryTxService inventoryTxService;

    public ReceptionStockMovementService(InventoryTxService inventoryTxService) {
        this.inventoryTxService = inventoryTxService;
    }

    public InventoryTx createAndValidateReception(
            ReceptionAchat reception,
            BonCommandeAchat bonCommande,
            UUID destLocationId,
            Map<UUID, BonCommandeAchatLigne> ligneById) {
        InventoryTxWithLinesCreateDto request = new InventoryTxWithLinesCreateDto();
        request.setTxType("RECEPTION");
        request.setTxNumber("STK-" + reception.getNumero());
        request.setTxDate(reception.getDateReception());
        request.setReference(
                StringUtils.hasText(reception.getBlNumero()) ? reception.getBlNumero() : reception.getNumero());
        request.setNotes("Réception achat " + reception.getNumero() + " — BC " + bonCommande.getNumero());
        request.setDestLocationId(destLocationId);
        request.setWarehouseId(destLocationId);
        request.setBcId(bonCommande.getId());
        request.setChantierBudgetId(trimOrNull(bonCommande.getChantierId()));
        request.setFournisseurId(parseUuidOrNull(bonCommande.getFournisseurId()));
        request.setLines(buildLines(reception, ligneById));

        InventoryTxDetailDto created = inventoryTxService.createWithLines(request);
        return inventoryTxService.validate(created.tx().getId());
    }

    private List<InventoryTxLineInputDto> buildLines(
            ReceptionAchat reception, Map<UUID, BonCommandeAchatLigne> ligneById) {
        List<InventoryTxLineInputDto> lines = new ArrayList<>();
        int lineNumber = 0;
        for (ReceptionAchatLigne recLigne : reception.getLignes()) {
            BonCommandeAchatLigne bcLigne = ligneById.get(recLigne.getBonCommandeLigneId());
            InventoryTxLineInputDto line = new InventoryTxLineInputDto();
            line.setLineNumber(++lineNumber);
            line.setItemId(parseItemId(recLigne.getArticleId()));
            line.setQuantity(recLigne.getQuantiteRecue());
            if (bcLigne != null) {
                line.setUnitPrice(bcLigne.getPrixUnitaireHt());
            }
            lines.add(line);
        }
        return lines;
    }

    private static UUID parseItemId(String articleId) {
        if (!StringUtils.hasText(articleId)) {
            throw new IllegalArgumentException("articleId is required for stock movement line");
        }
        try {
            return UUID.fromString(articleId.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("articleId must be a valid UUID: " + articleId);
        }
    }

    private static UUID parseUuidOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static String trimOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }
}
