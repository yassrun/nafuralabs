package ma.nafura.platform.integrations.googleplaces;

import java.util.List;

public record RegularOpeningHours(
        List<OpeningHoursPeriod> periods,
        List<String> weekdayDescriptions
) {}
