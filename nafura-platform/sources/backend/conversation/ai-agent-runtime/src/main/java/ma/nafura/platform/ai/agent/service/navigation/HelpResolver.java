package ma.nafura.platform.ai.agent.service.navigation;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class HelpResolver {

    private final List<HelpRegistry> registries;

    public HelpResolver(List<HelpRegistry> registries) {
        this.registries = registries != null ? registries : List.of();
    }

    public Optional<HelpEntry> match(String question) {
        if (question == null || question.isBlank()) {
            return defaultEntry();
        }
        String normalized = question.toLowerCase(Locale.ROOT);
        for (HelpRegistry registry : registries) {
            Optional<HelpEntry> match = registry.match(question);
            if (match.isPresent()) {
                return match;
            }
        }
        return all().stream()
                .filter(entry -> entry.getKeywords() != null && entry.getKeywords().stream()
                        .anyMatch(keyword -> normalized.contains(keyword.toLowerCase(Locale.ROOT))))
                .findFirst()
                .or(this::defaultEntry);
    }

    public List<HelpEntry> all() {
        List<HelpEntry> entries = new ArrayList<>();
        for (HelpRegistry registry : registries) {
            entries.addAll(registry.all());
        }
        return entries;
    }

    private Optional<HelpEntry> defaultEntry() {
        return all().stream()
                .filter(entry -> entry.getKeywords() != null && entry.getKeywords().contains("default"))
                .findFirst();
    }
}
