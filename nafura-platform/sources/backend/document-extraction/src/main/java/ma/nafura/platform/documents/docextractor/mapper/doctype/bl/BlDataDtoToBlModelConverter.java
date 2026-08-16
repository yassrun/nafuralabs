package ma.nafura.platform.documents.docextractor.mapper.doctype.bl;

import ma.nafura.platform.documents.docextractor.api.response.doctype.bl.BlDataDto;
import ma.nafura.platform.documents.docextractor.domain.model.doctype.bl.BlItem;
import ma.nafura.platform.documents.docextractor.domain.model.doctype.bl.BlModel;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Converter from BlDataDto (JSON DTO) to BlModel (business model).
 */
@Component
public class BlDataDtoToBlModelConverter {
    
    /**
     * Convert BlDataDto to BlModel.
     */
    public BlModel toBlModel(BlDataDto dto) {
        if (dto == null) {
            return null;
        }
        
        BlModel model = new BlModel();
        model.setBlReference(dto.getBlReference());
        model.setDate(dto.getDate());
        model.setIssuer(dto.getIssuer());
        
        // Convert sender
        if (dto.getSender() != null) {
            BlModel.BlSender sender = new BlModel.BlSender();
            sender.setName(dto.getSender().getName());
            sender.setAddress(dto.getSender().getAddress());
            model.setSender(sender);
        }
        
        // Convert receiver
        if (dto.getReceiver() != null) {
            BlModel.BlReceiver receiver = new BlModel.BlReceiver();
            receiver.setName(dto.getReceiver().getName());
            receiver.setAddress(dto.getReceiver().getAddress());
            model.setReceiver(receiver);
        }
        
        // Convert items
        if (dto.getItems() != null) {
            List<BlItem> items = dto.getItems().stream()
                    .map(this::toBlItem)
                    .collect(Collectors.toList());
            model.setItems(items);
        }
        
        return model;
    }
    
    private BlItem toBlItem(BlDataDto.BlItemDto dto) {
        BlItem item = new BlItem();
        item.setItemReference(dto.getItemReference());
        item.setItemDesignation(dto.getItemDesignation());
        item.setQuantity(dto.getQuantity());
        item.setUom(dto.getUom());
        item.setUnitPrice(dto.getUnitPrice());
        item.setTotalPrice(dto.getTotalPrice());
        return item;
    }
}

