package ma.nafura.item.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.item.domain.model.UnitOfMeasure;
import ma.nafura.item.api.request.UnitOfMeasureCreateDto;
import ma.nafura.item.api.request.UnitOfMeasureUpdateDto;
import ma.nafura.item.mapper.UnitOfMeasureMapper;
import ma.nafura.item.repository.UnitOfMeasureRepository;

/**
 * Base service for UnitOfMeasure entity.
 * Auto-generated from unit-of-measure.entity.json — do not edit.
 */
public class UnitOfMeasureServiceBase extends JpaCrudService<UUID, UnitOfMeasure, UnitOfMeasureCreateDto, UnitOfMeasureUpdateDto> {
    protected UnitOfMeasureServiceBase(UnitOfMeasureRepository repository, UnitOfMeasureMapper mapper) {
        super(repository, mapper);
    }
}
