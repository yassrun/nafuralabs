package ma.nafura.platform.geo.district;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Loads versioned GeoJSON operational zones from classpath.
 */
public final class ClasspathGeoDistrictCatalog {

    public static final String CASA_CITY_CODE = "casablanca";
    public static final String CASA_VERSION = "MA-CASA-2026-02";

    private final ObjectMapper objectMapper;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final Map<String, LoadedVersion> byCityCode = new LinkedHashMap<>();

    public ClasspathGeoDistrictCatalog(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        loadCasa();
    }

    public Optional<LoadedVersion> find(String cityCode) {
        if (cityCode == null || cityCode.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(byCityCode.get(normalizeCity(cityCode)));
    }

    public List<String> cityCodes() {
        return List.copyOf(byCityCode.keySet());
    }

    private void loadCasa() {
        String base = "referentiels/geo-ma/" + CASA_VERSION + "/";
        try {
            JsonNode manifest = readJson(base + "manifest.json");
            List<LoadedDistrict> districts = new ArrayList<>();
            for (JsonNode node : manifest.path("districts")) {
                String code = node.path("code").asText();
                String geometryFile = node.path("geometryFile").asText();
                String raw = readText(base + geometryFile);
                JsonNode featureOrGeometry = objectMapper.readTree(raw);
                JsonNode geometryNode = featureOrGeometry.has("geometry")
                        ? featureOrGeometry.get("geometry")
                        : featureOrGeometry;
                String geometryJson = objectMapper.writeValueAsString(geometryNode);
                String expectedSha = node.path("sha256").asText(null);
                String actualSha = sha256(geometryJson);
                if (expectedSha != null && !expectedSha.equalsIgnoreCase(actualSha)) {
                    throw new IllegalStateException(
                            "Checksum mismatch for " + geometryFile + ": expected=" + expectedSha + " actual=" + actualSha);
                }
                Geometry geometry = new GeoJsonReader(geometryFactory).read(geometryJson);
                List<String> aliases = new ArrayList<>();
                node.path("aliases").forEach(a -> aliases.add(a.asText()));
                districts.add(new LoadedDistrict(
                        new GeoDistrict(
                                code,
                                node.path("label").asText(code),
                                CASA_CITY_CODE,
                                List.copyOf(aliases),
                                geometryFile,
                                node.path("provenance").asText("NAFURA_CURATED")
                        ),
                        geometry,
                        actualSha
                ));
            }
            GeoReferenceVersion version = new GeoReferenceVersion(
                    CASA_VERSION,
                    CASA_CITY_CODE,
                    "Casablanca",
                    "NAFURA_CURATED",
                    manifest.path("effectiveFrom").asText("2026-01-01")
            );
            byCityCode.put(CASA_CITY_CODE, new LoadedVersion(version, List.copyOf(districts)));
            // Historical French business key also accepted
            byCityCode.put("casablanca", byCityCode.get(CASA_CITY_CODE));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load geo catalog " + CASA_VERSION, e);
        }
    }

    private JsonNode readJson(String classpath) throws IOException {
        try (InputStream in = open(classpath)) {
            return objectMapper.readTree(in);
        }
    }

    private String readText(String classpath) throws IOException {
        try (InputStream in = open(classpath)) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private InputStream open(String classpath) throws IOException {
        Resource resource = new ClassPathResource(classpath);
        if (!resource.exists()) {
            throw new IOException("Missing classpath resource: " + classpath);
        }
        return resource.getInputStream();
    }

    private static String sha256(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    static String normalizeCity(String cityCode) {
        return GeoText.normalizeCity(cityCode);
    }

    public record LoadedDistrict(GeoDistrict district, Geometry geometry, String sha256) {}

    public record LoadedVersion(GeoReferenceVersion version, List<LoadedDistrict> districts) {}
}
