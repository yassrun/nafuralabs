package ma.nafura.etudes.service.cps;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.etudes.api.dto.MarcheProposeDto;
import ma.nafura.etudes.domain.model.CpsSection;
import ma.nafura.etudes.domain.model.DossierDocument;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * Heuristique locale (sans LLM) à partir des titres/textes de sections CPS.
 *
 * <p>Remplacée par une implémentation Gemini quand un bean {@link MarcheProposePort} est fourni.
 * Si aucune section exploitable → {@link Optional#empty()} → 204 côté API.
 */
@Configuration
public class HeuristicMarcheProposePortConfig {

    private static final Pattern OBJET = Pattern.compile(
            "(?i)(?:objet\\s+(?:du\\s+)?(?:marché|marche)|intitulé)\\s*[:：]\\s*(.{10,200})");
    private static final Pattern VILLE = Pattern.compile(
            "(?i)(?:ville|lieu\\s+d['’]?exécution|commune)\\s*[:：]\\s*([A-Za-zÀ-ÿ\\-\\s]{2,60})");
    private static final Pattern REFERENCE = Pattern.compile(
            "(?i)(?:référence|reference|n[°o]\\s*(?:ao|marché|marche))\\s*[:：]\\s*([\\w\\-/.]{3,40})");

    @Bean
    @ConditionalOnMissingBean(MarcheProposePort.class)
    public MarcheProposePort heuristicMarcheProposePort() {
        return new MarcheProposePort() {
            @Override
            public boolean isAvailable() {
                return true;
            }

            @Override
            public Optional<MarcheProposeDto> proposer(List<CpsSection> sections) {
                if (sections == null || sections.isEmpty()) {
                    return Optional.empty();
                }
                String corpus = sections.stream()
                        .limit(40)
                        .map(s -> {
                            String t = s.getTitre() != null ? s.getTitre() : "";
                            String c = s.getContenu() != null ? s.getContenu() : "";
                            return t + "\n" + c;
                        })
                        .reduce("", (a, b) -> a + "\n" + b);
                if (!StringUtils.hasText(corpus) || corpus.trim().length() < 40) {
                    return Optional.empty();
                }

                MarcheProposeDto.Metadonnees.MetadonneesBuilder meta =
                        MarcheProposeDto.Metadonnees.builder();
                match(OBJET, corpus).ifPresent(meta::objet);
                match(VILLE, corpus).ifPresent(v -> meta.ville(v.trim()));
                match(REFERENCE, corpus).ifPresent(meta::reference);
                String lower = corpus.toLowerCase(Locale.ROOT);
                if (lower.contains("appel d'offres ouvert")
                        || lower.contains("marché public")
                        || lower.contains("marche public")) {
                    meta.type("PUBLIC");
                } else if (lower.contains("marché de gré à gré")
                        || lower.contains("prive")
                        || lower.contains("privé")) {
                    meta.type("PRIVE");
                }

                Map<String, MarcheProposeDto.PieceProposee> pieces = new LinkedHashMap<>();
                pieces.put(
                        DossierDocument.TYPE_BORDEREAU,
                        MarcheProposeDto.PieceProposee.builder()
                                .type(DossierDocument.TYPE_BORDEREAU)
                                .libelle("Bordereau des prix")
                                .obligatoire(true)
                                .build());
                pieces.put(
                        DossierDocument.TYPE_CPS,
                        MarcheProposeDto.PieceProposee.builder()
                                .type(DossierDocument.TYPE_CPS)
                                .libelle("Cahier des clauses (CPS / CCTP)")
                                .obligatoire(true)
                                .build());
                addIfMention(pieces, lower, "règlement", DossierDocument.TYPE_REGLEMENT,
                        "Règlement de consultation", true);
                addIfMention(pieces, lower, "reglement", DossierDocument.TYPE_REGLEMENT,
                        "Règlement de consultation", true);
                addIfMention(pieces, lower, "plan", DossierDocument.TYPE_PLAN, "Plans", true);
                addIfMention(pieces, lower, "cpt", DossierDocument.TYPE_CPT, "CPT", false);
                addIfMention(pieces, lower, "caution", "CAUTION", "Acte de caution", false);
                addIfMention(pieces, lower, "attestation", "ATTESTATION", "Attestations", false);

                return Optional.of(MarcheProposeDto.builder()
                        .metadonnees(meta.build())
                        .piecesAttendues(new ArrayList<>(pieces.values()))
                        .confiance(0.55)
                        .build());
            }
        };
    }

    private static void addIfMention(
            Map<String, MarcheProposeDto.PieceProposee> pieces,
            String lower,
            String keyword,
            String type,
            String libelle,
            boolean obligatoire) {
        if (lower.contains(keyword) && !pieces.containsKey(type)) {
            pieces.put(
                    type,
                    MarcheProposeDto.PieceProposee.builder()
                            .type(type)
                            .libelle(libelle)
                            .obligatoire(obligatoire)
                            .build());
        }
    }

    private static Optional<String> match(Pattern p, String text) {
        Matcher m = p.matcher(text);
        if (m.find()) {
            String v = m.group(1).trim();
            if (StringUtils.hasText(v)) {
                return Optional.of(v.replaceAll("\\s+", " "));
            }
        }
        return Optional.empty();
    }
}
