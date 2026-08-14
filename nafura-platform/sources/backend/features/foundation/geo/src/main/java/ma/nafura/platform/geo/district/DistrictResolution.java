package ma.nafura.platform.geo.district;

public record DistrictResolution(
        String districtCode,
        String districtLabel,
        String cityCode,
        double confidence,
        DistrictResolutionMethod method,
        String geoReferenceVersion,
        boolean needsReview,
        String notes
) {
    public static DistrictResolution unresolved(String cityCode, String version, String notes) {
        return new DistrictResolution(
                null,
                null,
                cityCode,
                0.0,
                DistrictResolutionMethod.UNRESOLVED,
                version,
                true,
                notes
        );
    }
}
