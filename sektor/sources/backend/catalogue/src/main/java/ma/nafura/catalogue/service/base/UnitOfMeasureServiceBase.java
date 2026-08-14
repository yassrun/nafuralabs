package ma.nafura.catalogue.service.base;

import java.util.UUID;
import ma.nafura.platform.framework.service.crud.JpaCrudService;
import ma.nafura.catalogue.domain.model.UnitOfMeasure;
import ma.nafura.catalogue.api.request.UnitOfMeasureCreateDto;
import ma.nafura.catalogue.api.request.UnitOfMeasureUpdateDto;
import ma.nafura.catalogue.mapper.UnitOfMeasureMapper;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;

/**
 * Base service for UnitOfMeasure entity.
 * Auto-generated from unit-of-measure.entity.json — do not edit.
 */
public class UnitOfMeasureServiceBase extends JpaCrudService<UUID, UnitOfMeasure, UnitOfMeasureCreateDto, UnitOfMeasureUpdateDto> {
    protected UnitOfMeasureServiceBase(UnitOfMeasureRepository repository, UnitOfMeasureMapper mapper) {
        super(repository, mapper);
    }
}
