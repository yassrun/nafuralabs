package ma.nafura.venuecatalog.place.domain.taxonomy;

import ma.nafura.venuecatalog.place.domain.PrimaryCategory;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Venue Morocco taxonomy v2 — orthogonal facets.
 * <p>
 * Types = what it is; settings = where/how; offers = what is consumed;
 * experiences = what you do; suitableFor = who / which occasion.
 */
public final class VenueMaTaxonomyV0 {

    public static final String VERSION = "venue-ma-v2";

    private VenueMaTaxonomyV0() {}

    public enum VenueType {
        CAFE, TEA_HOUSE, RESTAURANT, BAR, PUB, LOUNGE,
        SHISHA_LOUNGE, NIGHTCLUB, CABARET, LIVE_MUSIC_VENUE,
        BEACH_CLUB, EVENT_VENUE, HOTEL_VENUE,
        SALON, BARBERSHOP, SPA,
        UNKNOWN
    }

    public enum Setting {
        INDOOR, OUTDOOR, TERRACE, ROOFTOP, GARDEN,
        COURTYARD, POOL_SIDE, BEACHFRONT, WATERFRONT,
        SEA_VIEW, PANORAMIC_VIEW, HOTEL_INSIDE, MALL_INSIDE
    }

    public enum Offer {
        FOOD, COFFEE_TEA, BREAKFAST, BRUNCH,
        PASTRY_DESSERT, ALCOHOL, SHISHA
    }

    public enum Experience {
        DANCE, LIVE_MUSIC, DJ, WATCH_SHOW,
        WATCH_SPORTS, WORKSHOP, KARAOKE, GAMES, POOL_ACCESS
    }

    public enum SuitableFor {
        WORK_STUDY, BUSINESS_MEETING, DATE, FAMILY,
        FRIENDS_GROUP, CELEBRATION, NETWORKING, PRIVATE_EVENT
    }

    public static List<String> categoryValues() {
        return List.of(
                PrimaryCategory.SOCIAL_VENUE.name(),
                PrimaryCategory.BEAUTY.name()
        );
    }

    public static List<String> socialVenueTypeValues() {
        return List.of(
                "CAFE", "TEA_HOUSE", "RESTAURANT", "BAR", "PUB", "LOUNGE",
                "SHISHA_LOUNGE", "NIGHTCLUB", "CABARET", "LIVE_MUSIC_VENUE",
                "BEACH_CLUB", "EVENT_VENUE", "HOTEL_VENUE"
        );
    }

    public static List<String> beautyTypeValues() {
        return List.of("SALON", "BARBERSHOP", "SPA");
    }

    public static List<String> venueTypeValues() {
        return List.of(
                "CAFE", "TEA_HOUSE", "RESTAURANT", "BAR", "PUB", "LOUNGE",
                "SHISHA_LOUNGE", "NIGHTCLUB", "CABARET", "LIVE_MUSIC_VENUE",
                "BEACH_CLUB", "EVENT_VENUE", "HOTEL_VENUE",
                "SALON", "BARBERSHOP", "SPA",
                "UNKNOWN"
        );
    }

    public static Map<String, List<String>> venueTypesByCategory() {
        return Map.of(
                PrimaryCategory.SOCIAL_VENUE.name(), socialVenueTypeValues(),
                PrimaryCategory.BEAUTY.name(), beautyTypeValues()
        );
    }

    public static List<String> typesForCategory(PrimaryCategory category) {
        if (category == PrimaryCategory.SOCIAL_VENUE) {
            return socialVenueTypeValues();
        }
        if (category == PrimaryCategory.BEAUTY) {
            return beautyTypeValues();
        }
        return venueTypeValues();
    }

    public static List<String> settingValues() {
        return List.of(
                "INDOOR", "OUTDOOR", "TERRACE", "ROOFTOP", "GARDEN",
                "COURTYARD", "POOL_SIDE", "BEACHFRONT", "WATERFRONT",
                "SEA_VIEW", "PANORAMIC_VIEW", "HOTEL_INSIDE", "MALL_INSIDE"
        );
    }

    public static List<String> offerValues() {
        return List.of(
                "FOOD", "COFFEE_TEA", "BREAKFAST", "BRUNCH",
                "PASTRY_DESSERT", "ALCOHOL", "SHISHA"
        );
    }

    public static List<String> experienceValues() {
        return List.of(
                "DANCE", "LIVE_MUSIC", "DJ", "WATCH_SHOW",
                "WATCH_SPORTS", "WORKSHOP", "KARAOKE", "GAMES", "POOL_ACCESS"
        );
    }

    public static List<String> suitableForValues() {
        return List.of(
                "WORK_STUDY", "BUSINESS_MEETING", "DATE", "FAMILY",
                "FRIENDS_GROUP", "CELEBRATION", "NETWORKING", "PRIVATE_EVENT"
        );
    }

    /** @deprecated use {@link #offerValues()} / {@link #experienceValues()} */
    @Deprecated
    public static List<String> activityValues() {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        out.addAll(offerValues());
        out.addAll(experienceValues());
        return List.copyOf(out);
    }

    public static List<String> mergeFacetLists(List<String> a, List<String> b) {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        if (a != null) {
            out.addAll(a);
        }
        if (b != null) {
            out.addAll(b);
        }
        return List.copyOf(out);
    }

    /**
     * Maps legacy v1 activity tokens into offers / experiences buckets.
     */
    public static MigratedFacets migrateLegacyActivities(List<String> legacyActivities) {
        LinkedHashSet<String> offers = new LinkedHashSet<>();
        LinkedHashSet<String> experiences = new LinkedHashSet<>();
        if (legacyActivities == null) {
            return new MigratedFacets(List.of(), List.of());
        }
        for (String raw : legacyActivities) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String value = raw.trim().toUpperCase(Locale.ROOT);
            switch (value) {
                case "DINE" -> offers.add("FOOD");
                case "DRINK_ALCOHOL" -> offers.add("ALCOHOL");
                case "COFFEE_TEA" -> offers.add("COFFEE_TEA");
                case "BRUNCH" -> offers.add("BRUNCH");
                case "BREAKFAST" -> offers.add("BREAKFAST");
                case "PASTRY_DESSERT" -> offers.add("PASTRY_DESSERT");
                case "FOOD" -> offers.add("FOOD");
                case "ALCOHOL" -> offers.add("ALCOHOL");
                case "SHISHA" -> offers.add("SHISHA");
                case "DANCE" -> experiences.add("DANCE");
                case "LIVE_MUSIC" -> experiences.add("LIVE_MUSIC");
                case "DJ" -> experiences.add("DJ");
                case "WATCH_SHOW" -> experiences.add("WATCH_SHOW");
                case "WATCH_SPORTS" -> experiences.add("WATCH_SPORTS");
                case "WORKSHOP" -> experiences.add("WORKSHOP");
                case "KARAOKE" -> experiences.add("KARAOKE");
                case "GAMES" -> experiences.add("GAMES");
                case "POOL_ACCESS" -> experiences.add("POOL_ACCESS");
                default -> {
                    if (offerValues().contains(value)) {
                        offers.add(value);
                    } else if (experienceValues().contains(value)) {
                        experiences.add(value);
                    }
                }
            }
        }
        return new MigratedFacets(List.copyOf(offers), List.copyOf(experiences));
    }

    public static List<String> filterAllowed(List<String> values, List<String> allowed) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        Set<String> allow = new LinkedHashSet<>(allowed);
        LinkedHashSet<String> out = new LinkedHashSet<>();
        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }
            String normalized = value.trim().toUpperCase(Locale.ROOT);
            if (allow.contains(normalized)) {
                out.add(normalized);
            }
        }
        return new ArrayList<>(out);
    }

    public record MigratedFacets(List<String> offers, List<String> experiences) {}
}
