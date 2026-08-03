package ma.nafura.platform.integrations.googleplaces;

import java.util.List;

public record AddressComponent(
        String longText,
        String shortText,
        List<String> types
) {}
