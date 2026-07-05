package ma.nafura.platform.ai.agent.service.navigation;

import java.util.List;
import ma.nafura.platform.ai.agent.model.AssistantLink;
import org.springframework.stereotype.Component;

@Component
public class PlatformHelpRegistry implements HelpRegistry {

    @Override
    public List<HelpEntry> all() {
        return List.of(
                entry(List.of("search", "recherche"), "Press Ctrl/Cmd+K to search pages and records.", List.of()),
                entry(List.of("default"), "I'm not sure about that. Try rephrasing or ask your administrator.", List.of(
                        AssistantLink.builder().label("Open Dashboard").route("/dashboard").build()
                ))
        );
    }

    @Override
    public java.util.Optional<HelpEntry> match(String question) {
        return java.util.Optional.empty();
    }

    private HelpEntry entry(List<String> keywords, String answer, List<AssistantLink> links) {
        return HelpEntry.builder().keywords(keywords).answer(answer).links(links).build();
    }
}
