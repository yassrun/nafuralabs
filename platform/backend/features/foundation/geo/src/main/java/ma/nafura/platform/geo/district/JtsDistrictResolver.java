package ma.nafura.platform.geo.district;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.operation.distance.DistanceOp;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Deterministic point-in-polygon district resolver with alias fallback.
 * No Google / LLM calls.
 */
public class JtsDistrictResolver implements DistrictResolver {

    /** Degrees (~20m at Casablanca latitude) treated as boundary ambiguity. */
    private static final double BOUNDARY_TOLERANCE_DEG = 0.00018;

    private final ClasspathGeoDistrictCatalog catalog;

    public JtsDistrictResolver(ClasspathGeoDistrictCatalog catalog) {
        this.catalog = catalog;
    }

    @Override
    public String currentVersion(String cityCode) {
        return catalog.find(cityCode).map(v -> v.version().version()).orElse(null);
    }

    @Override
    public List<GeoDistrict> listDistricts(String cityCode) {
        return catalog.find(cityCode)
                .map(v -> v.districts().stream().map(ClasspathGeoDistrictCatalog.LoadedDistrict::district).toList())
                .orElse(List.of());
    }

    @Override
    public Optional<GeoReferenceVersion> getVersion(String cityCode) {
        return catalog.find(cityCode).map(ClasspathGeoDistrictCatalog.LoadedVersion::version);
    }

    @Override
    public DistrictResolution resolve(String cityCode, double lat, double lng, String addressText) {
        Optional<ClasspathGeoDistrictCatalog.LoadedVersion> loaded = catalog.find(cityCode);
        if (loaded.isEmpty()) {
            return DistrictResolution.unresolved(cityCode, null, "No geo reference version for city");
        }
        ClasspathGeoDistrictCatalog.LoadedVersion version = loaded.get();
        Point point = version.districts().getFirst().geometry().getFactory()
                .createPoint(new Coordinate(lng, lat));

        List<Hit> contains = new ArrayList<>();
        List<Hit> nearBoundary = new ArrayList<>();

        for (ClasspathGeoDistrictCatalog.LoadedDistrict d : version.districts()) {
            Geometry g = d.geometry();
            if (g.contains(point) || g.covers(point)) {
                double dist = DistanceOp.distance(point, g.getBoundary());
                contains.add(new Hit(d, dist));
            } else {
                double dist = DistanceOp.distance(point, g);
                if (dist <= BOUNDARY_TOLERANCE_DEG) {
                    nearBoundary.add(new Hit(d, dist));
                }
            }
        }

        if (contains.size() == 1) {
            Hit hit = contains.getFirst();
            double confidence = hit.boundaryDistance() < BOUNDARY_TOLERANCE_DEG ? 0.85 : 0.97;
            boolean needsReview = confidence < 0.9;
            return new DistrictResolution(
                    hit.district().district().code(),
                    hit.district().district().label(),
                    version.version().cityCode(),
                    confidence,
                    DistrictResolutionMethod.GEO_POLYGON,
                    version.version().version(),
                    needsReview,
                    needsReview ? "Near polygon boundary" : "Inside operational polygon"
            );
        }

        if (contains.size() > 1) {
            contains.sort(Comparator.comparingDouble(Hit::boundaryDistance).reversed());
            Hit best = contains.getFirst();
            return new DistrictResolution(
                    best.district().district().code(),
                    best.district().district().label(),
                    version.version().cityCode(),
                    0.55,
                    DistrictResolutionMethod.AMBIGUOUS_BOUNDARY,
                    version.version().version(),
                    true,
                    "Overlapping polygons: " + contains.stream()
                            .map(h -> h.district().district().code())
                            .reduce((a, b) -> a + "," + b)
                            .orElse("")
            );
        }

        if (nearBoundary.size() == 1) {
            Hit hit = nearBoundary.getFirst();
            return new DistrictResolution(
                    hit.district().district().code(),
                    hit.district().district().label(),
                    version.version().cityCode(),
                    0.7,
                    DistrictResolutionMethod.AMBIGUOUS_BOUNDARY,
                    version.version().version(),
                    true,
                    "Within boundary tolerance"
            );
        }

        if (nearBoundary.size() > 1) {
            nearBoundary.sort(Comparator.comparingDouble(Hit::boundaryDistance));
            Hit best = nearBoundary.getFirst();
            return new DistrictResolution(
                    best.district().district().code(),
                    best.district().district().label(),
                    version.version().cityCode(),
                    0.5,
                    DistrictResolutionMethod.AMBIGUOUS_BOUNDARY,
                    version.version().version(),
                    true,
                    "Multiple near-boundary candidates"
            );
        }

        Optional<DistrictResolution> alias = resolveByAlias(version, addressText);
        if (alias.isPresent()) {
            return alias.get();
        }

        return DistrictResolution.unresolved(
                version.version().cityCode(),
                version.version().version(),
                "Point outside all operational polygons and no address alias match"
        );
    }

    private Optional<DistrictResolution> resolveByAlias(
            ClasspathGeoDistrictCatalog.LoadedVersion version,
            String addressText
    ) {
        if (addressText == null || addressText.isBlank()) {
            return Optional.empty();
        }
        String normalized = normalizeText(addressText);
        List<ClasspathGeoDistrictCatalog.LoadedDistrict> matches = new ArrayList<>();
        for (ClasspathGeoDistrictCatalog.LoadedDistrict d : version.districts()) {
            for (String alias : d.district().aliases()) {
                if (normalized.contains(normalizeText(alias))) {
                    matches.add(d);
                    break;
                }
            }
        }
        if (matches.size() != 1) {
            return Optional.empty();
        }
        ClasspathGeoDistrictCatalog.LoadedDistrict hit = matches.getFirst();
        return Optional.of(new DistrictResolution(
                hit.district().code(),
                hit.district().label(),
                version.version().cityCode(),
                0.65,
                DistrictResolutionMethod.ADDRESS_ALIAS,
                version.version().version(),
                true,
                "Resolved via address alias"
        ));
    }

    private static String normalizeText(String value) {
        return GeoText.normalizeAlias(value);
    }

    private record Hit(ClasspathGeoDistrictCatalog.LoadedDistrict district, double boundaryDistance) {}
}
