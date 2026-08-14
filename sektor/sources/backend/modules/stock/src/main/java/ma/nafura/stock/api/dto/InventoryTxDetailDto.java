package ma.nafura.stock.api.dto;

import java.util.List;
import ma.nafura.stock.domain.model.InventoryTx;
import ma.nafura.stock.domain.model.InventoryTxLine;

public record InventoryTxDetailDto(InventoryTx tx, List<InventoryTxLine> lines) {}
