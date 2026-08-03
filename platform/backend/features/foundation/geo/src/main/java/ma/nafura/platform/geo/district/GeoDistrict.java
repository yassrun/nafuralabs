package ma.nafura.platform.geo.district;

import java.util.List;

public record GeoDistrict(
        String code,
        String label,
        String cityCode,
        List<String> aliases,
        String geometryFile,
        String provenance
) {}
