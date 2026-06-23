package ma.nafura.venuecatalog.place.application;

import ma.nafura.platform.integrations.googleplaces.AddressComponent;
import ma.nafura.platform.integrations.googleplaces.OpeningHoursPeriod;
import ma.nafura.platform.integrations.googleplaces.PlaceDetails;
import ma.nafura.platform.integrations.googleplaces.RegularOpeningHours;
import ma.nafura.venuecatalog.place.domain.CityCode;
import ma.nafura.venuecatalog.place.domain.PrimaryCategory;
import ma.nafura.venuecatalog.place.domain.model.PlaceModels;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class PlaceNormalizationService {

    private static final Map<String, PrimaryCategory> GOOGLE_TYPE_CATEGORY = Map.ofEntries(
            Map.entry("night_club", PrimaryCategory.NIGHTLIFE_VENUE),
            Map.entry("bar", PrimaryCategory.NIGHTLIFE_VENUE),
            Map.entry("restaurant", PrimaryCategory.SOCIAL_DINING),
            Map.entry("cafe", PrimaryCategory.SOCIAL_DINING),
            Map.entry("beauty_salon", PrimaryCategory.SALON),
            Map.entry("hair_care", PrimaryCategory.SALON),
            Map.entry("barber_shop", PrimaryCategory.BARBERSHOP),
            Map.entry("spa", PrimaryCategory.SPA)
    );

    public String normalizeName(String name) {
        if (name == null) {
            return "";
        }
        return name.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    public PlaceModels.Geo roundGeo(PlaceModels.Geo geo, int decimals) {
        BigDecimal lat = BigDecimal.valueOf(geo.lat()).setScale(decimals, RoundingMode.HALF_UP);
        BigDecimal lng = BigDecimal.valueOf(geo.lng()).setScale(decimals, RoundingMode.HALF_UP);
        return new PlaceModels.Geo(lat.doubleValue(), lng.doubleValue());
    }

    public PrimaryCategory mapCategory(List<String> types, String primaryType, PrimaryCategory hint) {
        if (hint != null && hint != PrimaryCategory.OTHER) {
            return hint;
        }
        if (primaryType != null && GOOGLE_TYPE_CATEGORY.containsKey(primaryType)) {
            return GOOGLE_TYPE_CATEGORY.get(primaryType);
        }
        if (types != null) {
            for (String type : types) {
                if (GOOGLE_TYPE_CATEGORY.containsKey(type)) {
                    return GOOGLE_TYPE_CATEGORY.get(type);
                }
            }
        }
        return PrimaryCategory.OTHER;
    }

    public PlaceModels.Address mapAddress(PlaceDetails details, CityCode cityCode, String countryCode) {
        String line1 = details.formattedAddress();
        String district = null;
        String postalCode = null;
        String cityLabel = cityCode.name();
        if (details.addressComponents() != null) {
            for (AddressComponent component : details.addressComponents()) {
                if (component.types() != null) {
                    if (component.types().contains("sublocality") || component.types().contains("neighborhood")) {
                        district = component.longText();
                    }
                    if (component.types().contains("postal_code")) {
                        postalCode = component.shortText();
                    }
                    if (component.types().contains("locality")) {
                        cityLabel = component.longText();
                    }
                }
            }
        }
        return new PlaceModels.Address(line1, district, postalCode, cityLabel, countryCode);
    }

    public List<PlaceModels.OpeningHoursDay> mapOpeningHours(RegularOpeningHours hours) {
        if (hours == null || hours.periods() == null) {
            return List.of();
        }
        List<PlaceModels.OpeningHoursDay> days = new ArrayList<>();
        for (OpeningHoursPeriod period : hours.periods()) {
            if (period.openDay() == null) {
                continue;
            }
            days.add(new PlaceModels.OpeningHoursDay(
                    period.openDay(),
                    List.of(new PlaceModels.TimeRange(period.openTime(), period.closeTime()))
            ));
        }
        return days;
    }

    public PlaceModels.Contact mapContact(PlaceDetails details) {
        return new PlaceModels.Contact(
                details.nationalPhoneNumber(),
                details.websiteUri(),
                details.googleMapsUri()
        );
    }

    public PlaceModels.ProviderRating mapRating(PlaceDetails details) {
        Integer priceLevel = null;
        if (details.priceLevel() != null) {
            priceLevel = switch (details.priceLevel()) {
                case "PRICE_LEVEL_INEXPENSIVE" -> 1;
                case "PRICE_LEVEL_MODERATE" -> 2;
                case "PRICE_LEVEL_EXPENSIVE" -> 3;
                case "PRICE_LEVEL_VERY_EXPENSIVE" -> 4;
                default -> null;
            };
        }
        return new PlaceModels.ProviderRating(
                details.rating(),
                details.userRatingCount(),
                priceLevel,
                details.businessStatus()
        );
    }

    public PlaceModels.PlaceAttributes mapAttributes(PlaceDetails details) {
        boolean servesAlcohol = Boolean.TRUE.equals(details.servesBeer())
                || Boolean.TRUE.equals(details.servesWine());
        boolean wheelchair = details.accessibilityOptions() != null
                && Boolean.TRUE.equals(details.accessibilityOptions().wheelchairAccessibleEntrance());
        return new PlaceModels.PlaceAttributes(
                servesAlcohol,
                details.reservable(),
                wheelchair,
                false
        );
    }

    public PlaceModels.PlaceQuality computeQuality(
            PlaceModels.Address address,
            PlaceModels.Geo geo,
            PlaceModels.Contact contact,
            PrimaryCategory category,
            List<java.util.UUID> duplicateIds,
            double confidenceThreshold
    ) {
        double completeness = 0.0;
        if (address != null && address.line1() != null && !address.line1().isBlank()) completeness += 0.25;
        if (geo != null && geo.lat() != 0 && geo.lng() != 0) completeness += 0.25;
        if (contact != null && contact.phoneE164() != null) completeness += 0.15;
        if (contact != null && contact.websiteUrl() != null) completeness += 0.1;
        if (category != null && category != PrimaryCategory.OTHER) completeness += 0.25;

        double confidence = duplicateIds.isEmpty() ? 0.9 : 0.7;
        boolean manualReview = confidence < confidenceThreshold
                || !duplicateIds.isEmpty()
                || contact == null
                || geo == null
                || category == PrimaryCategory.OTHER;

        return new PlaceModels.PlaceQuality(
                completeness,
                1.0,
                confidence,
                manualReview,
                duplicateIds
        );
    }

    public String checksum(PlaceDetails details) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String payload = details.id() + "|" + details.formattedAddress() + "|" + details.rating();
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return "sha256:" + HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public String dedupeKey(String canonicalName, PlaceModels.Geo geo, CityCode cityCode, PrimaryCategory category, int geoDecimals) {
        PlaceModels.Geo rounded = roundGeo(geo, geoDecimals);
        return normalizeName(canonicalName) + "|" + rounded.lat() + "|" + rounded.lng() + "|" + cityCode + "|" + category;
    }
}
