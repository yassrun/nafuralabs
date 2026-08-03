package ma.nafura.venuecatalog.api.controller;

import ma.nafura.platform.geo.district.DistrictResolver;
import ma.nafura.platform.geo.district.GeoDistrict;
import ma.nafura.platform.geo.district.GeoReferenceVersion;
import ma.nafura.venuecatalog.api.security.CatalogReadAccess;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/catalog/geo")
@CatalogReadAccess
public class CatalogGeoController {

    private final DistrictResolver districtResolver;

    public CatalogGeoController(DistrictResolver districtResolver) {
        this.districtResolver = districtResolver;
    }

    @GetMapping("/districts")
    public Map<String, Object> listDistricts(@RequestParam(defaultValue = "casablanca") String cityCode) {
        GeoReferenceVersion version = districtResolver.getVersion(cityCode).orElse(null);
        List<GeoDistrict> districts = districtResolver.listDistricts(cityCode);
        return Map.of(
                "cityCode", cityCode,
                "version", version == null ? Map.of() : Map.of(
                        "version", version.version(),
                        "cityCode", version.cityCode(),
                        "cityLabel", version.cityLabel(),
                        "provenance", version.provenance(),
                        "effectiveFrom", version.effectiveFrom()
                ),
                "districts", districts.stream().map(d -> Map.of(
                        "code", d.code(),
                        "label", d.label(),
                        "aliases", d.aliases(),
                        "provenance", d.provenance()
                )).toList()
        );
    }
}
