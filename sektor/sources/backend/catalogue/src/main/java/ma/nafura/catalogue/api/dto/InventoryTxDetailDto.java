package ma.nafura.catalogue.api.dto;

import java.util.List;
import ma.nafura.catalogue.domain.model.InventoryTx;
import ma.nafura.catalogue.domain.model.InventoryTxLine;

public record InventoryTxDetailDto(InventoryTx tx, List<InventoryTxLine> lines) {}
