package ma.nafura.item.api.controller;

import jakarta.validation.Valid;
import ma.nafura.item.api.controller.base.UnitOfMeasureControllerBase;
import ma.nafura.item.api.dto.UomConversionResultDto;
import ma.nafura.item.api.request.UomConversionRequestDto;
import ma.nafura.item.service.UnitOfMeasureService;
import ma.nafura.item.service.UomConversionService;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for UnitOfMeasure entity.
 * Generated once — safe for manual edits.
 */
@RestController
@RequestMapping("/api/v1/units-of-measure")
@SecuredResource(domain = "item", feature = "item", resource = "unit-of-measure")
public class UnitOfMeasureController extends UnitOfMeasureControllerBase {

    private final UomConversionService conversionService;

    public UnitOfMeasureController(UnitOfMeasureService service, UomConversionService conversionService) {
        super(service);
        this.conversionService = conversionService;
    }

    @PostMapping("/convert")
    @RequirePermission("item.unit-of-measure.read")
    public ResponseEntity<UomConversionResultDto> convert(@Valid @RequestBody UomConversionRequestDto request) {
        return ResponseEntity.ok(conversionService.convert(
                request.getFromUomId(), request.getToUomId(), request.getQuantity()));
    }
}
