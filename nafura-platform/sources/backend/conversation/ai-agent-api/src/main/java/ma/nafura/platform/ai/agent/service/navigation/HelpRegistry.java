package ma.nafura.platform.ai.agent.service.navigation;

import java.util.List;
import java.util.Optional;

/**
 * Product-provided help entries replacing static platform documentation.
 */
public interface HelpRegistry {

    List<HelpEntry> all();

    Optional<HelpEntry> match(String question);
}
