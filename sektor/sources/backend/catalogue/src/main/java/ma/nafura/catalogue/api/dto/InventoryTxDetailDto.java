package ma.nafura.catalogue.api.dto;

import java.util.List;
import ma.nafura.catalogue.domain.stock.InventoryTx;
import ma.nafura.catalogue.domain.stock.InventoryTxLine;

public record InventoryTxDetailDto(InventoryTx tx, List<InventoryTxLine> lines) {}
