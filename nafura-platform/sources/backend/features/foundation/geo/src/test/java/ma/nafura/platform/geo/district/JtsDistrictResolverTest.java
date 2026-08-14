package ma.nafura.platform.geo.district;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JtsDistrictResolverTest {

    private JtsDistrictResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new JtsDistrictResolver(new ClasspathGeoDistrictCatalog(new ObjectMapper()));
    }

    @Test
    void resolvesInsideMaarif() {
        DistrictResolution r = resolver.resolve("casablanca", 33.5869, -7.6298, null);
        assertThat(r.method()).isEqualTo(DistrictResolutionMethod.GEO_POLYGON);
        assertThat(r.districtCode()).isEqualTo("MAARIF");
        assertThat(r.geoReferenceVersion()).isEqualTo("MA-CASA-2026-02");
        assertThat(r.confidence()).isGreaterThan(0.9);
        assertThat(r.needsReview()).isFalse();
    }

    @Test
    void resolvesOutsideAsUnresolved() {
        DistrictResolution r = resolver.resolve("casablanca", 33.5300, -7.6500, "Sidi Maarouf");
        assertThat(r.method()).isEqualTo(DistrictResolutionMethod.UNRESOLVED);
        assertThat(r.districtCode()).isNull();
        assertThat(r.needsReview()).isTrue();
    }

    @Test
    void resolvesAliasFallback() {
        DistrictResolution r = resolver.resolve("casablanca", 33.5300, -7.6500, "Salon Bourgogne Casablanca");
        assertThat(r.method()).isEqualTo(DistrictResolutionMethod.ADDRESS_ALIAS);
        assertThat(r.districtCode()).isEqualTo("BOURGOGNE");
        assertThat(r.needsReview()).isTrue();
    }

    @Test
    void versionIsStable() {
        assertThat(resolver.currentVersion("Casablanca")).isEqualTo("MA-CASA-2026-02");
        assertThat(resolver.listDistricts("casablanca")).hasSize(6);
        assertThat(resolver.getVersion("casablanca")).isPresent();
    }

    @Test
    void resolvesGauthierAndAnfaCenters() {
        assertThat(resolver.resolve("casablanca", 33.5950, -7.6180, null).districtCode()).isEqualTo("GAUTHIER");
        assertThat(resolver.resolve("casablanca", 33.5880, -7.6700, null).districtCode()).isEqualTo("ANFA_AIN_DIAB");
        assertThat(resolver.resolve("casablanca", 33.5700, -7.6400, null).districtCode()).isEqualTo("BOURGOGNE");
    }

    @Test
    void resolvesMedinaInsteadOfFormerGauthierNorth() {
        // Old Médina / downtown — previously swallowed by Gauthier AABB (north 33.6035)
        assertThat(resolver.resolve("casablanca", 33.5995, -7.6165, null).districtCode()).isEqualTo("MEDINA");
        assertThat(resolver.resolve("casablanca", 33.6050, -7.6150, null).districtCode()).isEqualTo("MEDINA");
        // True Gauthier still south of the cut
        assertThat(resolver.resolve("casablanca", 33.5950, -7.6180, null).districtCode()).isEqualTo("GAUTHIER");
    }
}
