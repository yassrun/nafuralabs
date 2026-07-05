package ma.nafura.platform.ai.agent.service.intent;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;
import ma.nafura.platform.ai.agent.model.IntentClassification;
import ma.nafura.platform.ai.agent.model.IntentType;
import org.springframework.stereotype.Component;

/**
 * Rule-based intent classifier (fast path). Falls back to READ when ambiguous.
 */
@Component
public class IntentRouter {

    private static final int PATTERN_FLAGS =
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.UNICODE_CHARACTER_CLASS;

    private static final Pattern ACTION_PATTERN = Pattern.compile(
            "\\b(cree[rz]?|cr[eé]e[rz]?|créer|ajoute[rz]?|modifie[rz]?|supprime[rz]?|delete|update|create|add|remove|valide[rz]?|approve|reject|execute)\\b",
            PATTERN_FLAGS
    );

    private static final Pattern NAVIGATE_PATTERN = Pattern.compile(
            "\\b(o[uù]|am[eè]ne|navigue|go to|open|ouvre|acc[eè]de|comment (faire|acc[eé]der|cr[eé]er)|where|help|aide|documentation|doc|menu|écran|ecran|page|aller|configurer)\\b",
            PATTERN_FLAGS
    );

    private static final Pattern READ_PATTERN = Pattern.compile(
            "\\b(combien|nombre|total|liste|list|show|montre|affiche|count|how many|quels?|quelles?|resume|summarize|kpi|stat|statistique|dashboard)\\b",
            PATTERN_FLAGS
    );

    public IntentClassification classify(String content) {
        if (content == null || content.isBlank()) {
            return IntentClassification.builder()
                    .intent(IntentType.READ)
                    .confidence(0.5)
                    .source("RULES")
                    .build();
        }

        String normalized = Normalizer.normalize(content.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFC);

        if (startsWithActionVerb(normalized) || ACTION_PATTERN.matcher(normalized).find()) {
            return IntentClassification.builder()
                    .intent(IntentType.ACTION)
                    .confidence(1.0)
                    .source("RULES")
                    .build();
        }

        if (NAVIGATE_PATTERN.matcher(normalized).find() && !READ_PATTERN.matcher(normalized).find()) {
            return IntentClassification.builder()
                    .intent(IntentType.NAVIGATE)
                    .confidence(1.0)
                    .source("RULES")
                    .build();
        }

        if (READ_PATTERN.matcher(normalized).find()) {
            return IntentClassification.builder()
                    .intent(IntentType.READ)
                    .confidence(1.0)
                    .source("RULES")
                    .build();
        }

        return IntentClassification.builder()
                .intent(IntentType.READ)
                .confidence(0.6)
                .source("RULES_DEFAULT")
                .build();
    }

    private boolean startsWithActionVerb(String normalized) {
        int space = normalized.indexOf(' ');
        String firstToken = space > 0 ? normalized.substring(0, space) : normalized;
        return firstToken.equals("crée")
                || firstToken.equals("créer")
                || firstToken.equals("cree")
                || firstToken.equals("creer")
                || firstToken.startsWith("ajout")
                || firstToken.startsWith("modif")
                || firstToken.startsWith("supprim")
                || firstToken.equals("create")
                || firstToken.equals("update")
                || firstToken.equals("delete");
    }
}
