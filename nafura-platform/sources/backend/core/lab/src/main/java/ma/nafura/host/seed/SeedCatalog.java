package ma.nafura.host.seed;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/** Every data set on the classpath, checked and ordered: reference before demo, each after its {@code after}. */
public final class SeedCatalog {

    static final String LOCATION = "classpath*:META-INF/nafura/seed/*.json";
    private static final Pattern ID = Pattern.compile("^[a-z][a-z0-9-]*(\\.[a-z0-9-]+)+$");

    private record File(String id, String kind, List<String> after, List<SeedDataset.Block> entities) {
    }

    private SeedCatalog() {
    }

    public static List<SeedDataset> load(ResourcePatternResolver resolver, JsonMapper mapper) {
        JsonMapper strict = mapper.rebuild().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
        List<SeedDataset> datasets = new ArrayList<>();
        try {
            for (Resource resource : resolver.getResources(LOCATION)) {
                datasets.add(read(resource, strict));
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot list " + LOCATION, e);
        }
        return order(datasets);
    }

    static SeedDataset read(Resource resource, JsonMapper mapper) {
        String source = resource.getDescription();
        try (InputStream in = resource.getInputStream()) {
            byte[] bytes = in.readAllBytes();
            File file = mapper.readValue(bytes, File.class);
            return check(new SeedDataset(file.id(), kind(file.kind(), source), file.after() == null ? List.of() : file.after(),
                    file.entities(), source, sha256(bytes)));
        } catch (IOException e) {
            throw new UncheckedIOException("Unreadable seed " + source, e);
        } catch (RuntimeException e) {
            throw new IllegalStateException("Invalid seed " + source + ": " + e.getMessage(), e);
        }
    }

    private static SeedDataset.Kind kind(String kind, String source) {
        if (!"reference".equals(kind) && !"demo".equals(kind)) {
            throw new IllegalStateException("Seed " + source + ": kind must be \"reference\" or \"demo\"");
        }
        return SeedDataset.Kind.valueOf(kind.toUpperCase(Locale.ROOT));
    }

    private static SeedDataset check(SeedDataset dataset) {
        String where = "Seed " + dataset.source();
        if (dataset.id() == null || !ID.matcher(dataset.id()).matches()) {
            throw new IllegalStateException(where + ": id must look like \"<bc>.<name>\" (got " + dataset.id() + ")");
        }
        if (dataset.entities() == null || dataset.entities().isEmpty()) {
            throw new IllegalStateException(where + ": no entities");
        }
        for (SeedDataset.Block block : dataset.entities()) {
            if (block.entity() == null || block.key() == null || block.key().isEmpty() || block.records() == null) {
                throw new IllegalStateException(where + ": each entity needs \"entity\", a non-empty \"key\" and \"records\"");
            }
        }
        return dataset;
    }

    /** Kahn's order; ties by kind then id, so the order never depends on the classpath. */
    static List<SeedDataset> order(List<SeedDataset> datasets) {
        Map<String, SeedDataset> byId = new LinkedHashMap<>();
        for (SeedDataset dataset : datasets) {
            if (byId.put(dataset.id(), dataset) != null) {
                throw new IllegalStateException("Seed id " + dataset.id() + " is declared twice");
            }
        }
        for (SeedDataset dataset : datasets) {
            for (String before : dataset.after()) {
                SeedDataset dependency = byId.get(before);
                if (dependency == null) {
                    throw new IllegalStateException("Seed " + dataset.id() + " comes after unknown seed " + before);
                }
                if (dataset.kind() == SeedDataset.Kind.REFERENCE && dependency.kind() == SeedDataset.Kind.DEMO) {
                    throw new IllegalStateException("Reference seed " + dataset.id() + " cannot depend on demo seed " + before);
                }
            }
        }
        Comparator<SeedDataset> tieBreak = Comparator.comparing(SeedDataset::kind).thenComparing(SeedDataset::id);
        List<SeedDataset> pending = new ArrayList<>(datasets);
        List<SeedDataset> ordered = new ArrayList<>();
        while (!pending.isEmpty()) {
            SeedDataset next = pending.stream()
                    .filter(candidate -> candidate.after().stream().allMatch(id -> ordered.stream().anyMatch(done -> done.id().equals(id))))
                    .min(tieBreak)
                    .orElseThrow(() -> new IllegalStateException("Seeds depend on each other in a cycle: "
                            + pending.stream().map(SeedDataset::id).toList()));
            pending.remove(next);
            ordered.add(next);
        }
        return ordered;
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
