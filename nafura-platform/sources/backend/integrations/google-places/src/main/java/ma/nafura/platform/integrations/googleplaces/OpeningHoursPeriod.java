package ma.nafura.platform.integrations.googleplaces;

public record OpeningHoursPeriod(
        String openDay,
        String openTime,
        String closeDay,
        String closeTime
) {}
