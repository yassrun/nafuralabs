package ma.nafura.platform.geo.district;

import java.util.List;
import java.util.Optional;

public interface DistrictResolver {

    String currentVersion(String cityCode);

    List<GeoDistrict> listDistricts(String cityCode);

    Optional<GeoReferenceVersion> getVersion(String cityCode);

    DistrictResolution resolve(String cityCode, double lat, double lng, String addressText);
}
