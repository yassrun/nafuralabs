package ma.nafura.etudes.service.port.capability;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import ma.nafura.etudes.api.dto.MarcheProposeDto;
import ma.nafura.etudes.domain.cps.CpsSection;
import ma.nafura.etudes.domain.dossier.DossierDocument;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * Heuristique locale (sans LLM) à partir des titres/textes de sections CPS.
 *
 * <p>Couvre les formulations CPS Maroc (SRRA / AOO / cautionnement / « a pour objet »).
 * Remplacée par Gemini quand un bean {@link MarcheProposePort} est fourni.
 */
@Configuration
public class HeuristicMarcheProposePortConfig {

    private static final Pattern OBJET_COLON = Pattern.compile(
            "(?i)(?:objet\\s+(?:du\\s+)?(?:marché|marche)|intitulé)\\s*[:：]\\s*(.{10,280})");
    private static final Pattern OBJET_POUR = Pattern.compile(
            "(?i)a\\s+pour\\s+objet\\s+(.{15,280}?)(?:\\.\\s|$)");
    private static final Pattern VILLE = Pattern.compile(
            "(?i)(?:ville|lieu\\s+d['’]?exécution|commune)\\s*[:：]\\s*([\\p{L}\\-\\s]{2,60})");
    private static final Pattern REFERENCE_LABEL = Pattern.compile(
            "(?i)(?:référence|reference)\\s*[:：]\\s*([\\w\\-/.]{3,40})");
    private static final Pattern REFERENCE_CPS = Pattern.compile(
            "(?i)(?:CPS\\s+)?AOO?\\s*N[°ºo]\\s*([A-Z0-9][\\w\\-/.]{2,40})");
    private static final Pattern REFERENCE_NUM = Pattern.compile(
            "(?i)N[°ºo]\\s*([0-9]{2,4}\\s*/\\s*[A-Z]{2,10}\\s*/\\s*20[0-9]{2})");
    private static final Pattern DONNEUR_COLON = Pattern.compile(
            "(?i)(?:ma[îi]tre\\s+d['’]?ouvrage(?:\\s+d[ée]l[ée]gu[ée])?|donneur\\s+d['’]?ordre|MOA)\\s*[:：]\\s*(.{3,160})");
    private static final Pattern DONNEUR_EST = Pattern.compile(
            "(?i)ma[îi]tre\\s+d['’]?ouvrage(?:\\s+d[ée]l[ée]gu[ée])?\\s+est\\s+(?:la\\s+|le\\s+|l['’])?(.{3,160}?)(?:\\.|,|\\n|$)");
    private static final Pattern DATE_LIMITE = Pattern.compile(
            "(?i)(?:date\\s+limite\\s+(?:de\\s+)?(?:dépôt|depot|remise)|délai\\s+de\\s+remise)\\s*[:：]?\\s*(\\d{1,2}[./-]\\d{1,2}[./-]\\d{2,4})");
    private static final Pattern DATE_OUVERTURE = Pattern.compile(
            "(?i)(?:ouverture\\s+des\\s+plis|date\\s+d['’]?ouverture)\\s*[:：]?\\s*(\\d{1,2}[./-]\\d{1,2}[./-]\\d{2,4})");
    private static final Pattern DELAI_JOURS = Pattern.compile(
            "(?i)d[ée]lai\\s+d['’]?ex[ée]cution[^\\d]{0,40}?(\\d{1,4})\\s*(?:jours|j\\b)");
    private static final Pattern DELAI_MOIS = Pattern.compile(
            "(?i)d[ée]lai\\s+(?:d['’]?ex[ée]cution[^\\d]{0,60}?)?(?:de\\s+)?(?:trois|3|\\d{1,2})\\s*\\(?\\s*(\\d{1,2})\\s*\\)?\\s*mois");
    private static final Pattern DELAI_MOIS_LETTRES = Pattern.compile(
            "(?i)dans\\s+un\\s+d[ée]lai\\s+de\\s+(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze)\\s*\\(?\\s*(\\d{1,2})?\\s*\\)?\\s*mois");
    private static final Pattern ESTIMATION = Pattern.compile(
            "(?i)(?:estimation|montant\\s+(?:estimatif|pr[ée]visionnel))\\s*(?:HT)?\\s*[:：]?\\s*([\\d\\s.,]{3,20})");
    private static final Pattern CAUTION_PROV = Pattern.compile(
            "(?i)cautionnement\\s+provisoire[^%]{0,80}?(\\d{1,2}(?:[.,]\\d+)?)\\s*%");
    private static final Pattern CAUTION_PROV_ALT = Pattern.compile(
            "(?i)caution\\s+provisoire\\s*[:：]?\\s*([\\d.,]+)\\s*%?");
    private static final Pattern CAUTION_DEF = Pattern.compile(
            "(?i)cautionnement\\s+d[ée]finitif[^%]{0,80}?(\\d{1,2}(?:[.,]\\d+)?)\\s*%");
    private static final Pattern CAUTION_DEF_ALT = Pattern.compile(
            "(?i)caution\\s+d[ée]finitive\\s*[:：]?\\s*([\\d.,]+)\\s*%?");
    private static final Pattern WILAYA_REGION = Pattern.compile(
            "(?i)Wilaya\\s+de\\s+la\\s+R[ée]gion\\s+de\\s+([\\p{L}\\-\\s]{3,60}?)(?:\\n|$)");

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
                String corpus = buildCorpus(sections, 120);
                if (!StringUtils.hasText(corpus) || corpus.trim().length() < 40) {
                    return Optional.empty();
                }
                String flat = corpus.replaceAll("\\s+", " ");

                MarcheProposeDto.Metadonnees.MetadonneesBuilder meta =
                        MarcheProposeDto.Metadonnees.builder();

                sectionContenu(sections, "OBJET").ifPresent(c -> {
                    String cf = c.replaceAll("\\s+", " ");
                    firstNonEmpty(
                                    match(OBJET_POUR, cf),
                                    match(OBJET_COLON, cf),
                                    Optional.of(cleanObjet(cf)))
                            .ifPresent(meta::objet);
                });
                if (meta.build().getObjet() == null) {
                    firstNonEmpty(match(OBJET_POUR, flat), match(OBJET_COLON, flat))
                            .map(HeuristicMarcheProposePortConfig::cleanObjet)
                            .ifPresent(meta::objet);
                }

                sectionContenu(sections, "MAITRE", "OUVRAGE").ifPresent(c -> {
                    String cf = c.replaceAll("\\s+", " ");
                    firstNonEmpty(match(DONNEUR_EST, cf), match(DONNEUR_COLON, cf))
                            .map(HeuristicMarcheProposePortConfig::cleanNom)
                            .ifPresent(meta::donneurOrdre);
                });
                if (meta.build().getDonneurOrdre() == null) {
                    firstNonEmpty(match(DONNEUR_EST, flat), match(DONNEUR_COLON, flat))
                            .map(HeuristicMarcheProposePortConfig::cleanNom)
                            .ifPresent(meta::donneurOrdre);
                }

                firstNonEmpty(
                                match(REFERENCE_CPS, flat),
                                match(REFERENCE_NUM, flat),
                                match(REFERENCE_LABEL, flat))
                        .map(r -> r.replaceAll("\\s+", ""))
                        .ifPresent(meta::reference);

                match(VILLE, flat).map(String::trim).ifPresent(meta::ville);
                if (meta.build().getVille() == null) {
                    match(WILAYA_REGION, corpus)
                            .map(v -> v.split("[–-]")[0].trim())
                            .ifPresent(region -> {
                                String ville = region.contains("Rabat") ? "Rabat"
                                        : region.contains("Casablanca") ? "Casablanca"
                                        : region;
                                meta.ville(ville);
                            });
                }

                match(DATE_LIMITE, flat).flatMap(HeuristicMarcheProposePortConfig::parseDate)
                        .ifPresent(meta::dateLimiteDepot);
                match(DATE_OUVERTURE, flat).flatMap(HeuristicMarcheProposePortConfig::parseDate)
                        .ifPresent(meta::dateOuverturePlis);

                parseDelaiJours(flat).ifPresent(meta::delaiExecutionJours);
                match(ESTIMATION, flat)
                        .flatMap(HeuristicMarcheProposePortConfig::parseDecimal)
                        .ifPresent(meta::estimationMoaHt);

                firstNonEmpty(match(CAUTION_PROV, flat), match(CAUTION_PROV_ALT, flat))
                        .flatMap(HeuristicMarcheProposePortConfig::parseDecimal)
                        .ifPresent(meta::cautionProvisoire);
                firstNonEmpty(match(CAUTION_DEF, flat), match(CAUTION_DEF_ALT, flat))
                        .flatMap(HeuristicMarcheProposePortConfig::parseDecimal)
                        .ifPresent(meta::cautionDefinitive);

                String lower = flat.toLowerCase(Locale.ROOT);
                if (lower.contains("appel d'offre")
                        || lower.contains("appel d’offre")
                        || lower.contains("marché public")
                        || lower.contains("marche public")
                        || lower.contains("aoo ")
                        || lower.contains("aon ")) {
                    meta.type("PUBLIC");
                } else if (lower.contains("gré à gré")
                        || lower.contains("gre a gre")
                        || lower.contains("privé")
                        || lower.contains("prive")) {
                    meta.type("PRIVE");
                }

                Map<String, MarcheProposeDto.PieceProposee> pieces = new LinkedHashMap<>();
                addIfMention(pieces, lower, "règlement", DossierDocument.TYPE_REGLEMENT,
                        "Règlement de consultation", false);
                addIfMention(pieces, lower, "reglement", DossierDocument.TYPE_REGLEMENT,
                        "Règlement de consultation", false);
                addIfMention(pieces, lower, "plan", DossierDocument.TYPE_PLAN, "Plans", false);
                addIfMention(pieces, lower, "cpt", DossierDocument.TYPE_CPT, "CPT", false);
                addIfMention(pieces, lower, "caution", "CAUTION", "Acte de caution", false);
                addIfMention(pieces, lower, "attestation", "ATTESTATION", "Attestations", false);

                MarcheProposeDto.Metadonnees built = meta.build();
                double conf = scoreConfiance(built);

                return Optional.of(MarcheProposeDto.builder()
                        .metadonnees(built)
                        .piecesAttendues(new ArrayList<>(pieces.values()))
                        .confiance(conf)
                        .build());
            }
        };
    }

    private static String buildCorpus(List<CpsSection> sections, int limit) {
        StringBuilder sb = new StringBuilder();
        int n = 0;
        for (CpsSection s : sections) {
            if (n++ >= limit) {
                break;
            }
            if (StringUtils.hasText(s.getTitre())) {
                sb.append(s.getTitre()).append('\n');
            }
            if (StringUtils.hasText(s.getContenu())) {
                sb.append(s.getContenu()).append('\n');
            }
        }
        return sb.toString();
    }

    private static Optional<String> sectionContenu(List<CpsSection> sections, String... tokens) {
        for (CpsSection s : sections) {
            String titre = s.getTitre() != null ? s.getTitre() : "";
            String upper = titre.toUpperCase(Locale.ROOT);
            boolean ok = true;
            for (String t : tokens) {
                if (!upper.contains(t.toUpperCase(Locale.ROOT))) {
                    ok = false;
                    break;
                }
            }
            if (ok && StringUtils.hasText(s.getContenu())) {
                return Optional.of(s.getContenu());
            }
        }
        return Optional.empty();
    }

    private static Optional<Integer> parseDelaiJours(String corpus) {
        Optional<String> jours = match(DELAI_JOURS, corpus);
        if (jours.isPresent()) {
            try {
                return Optional.of(Integer.parseInt(jours.get()));
            } catch (NumberFormatException ignored) {
                /* fall through */
            }
        }
        Matcher m = DELAI_MOIS.matcher(corpus);
        if (m.find()) {
            try {
                int mois = Integer.parseInt(m.group(1));
                return Optional.of(mois * 30);
            } catch (NumberFormatException ignored) {
                /* fall through */
            }
        }
        Matcher m2 = DELAI_MOIS_LETTRES.matcher(corpus);
        if (m2.find()) {
            String letters = m2.group(1).toLowerCase(Locale.ROOT);
            Integer digits = null;
            if (m2.group(2) != null) {
                try {
                    digits = Integer.parseInt(m2.group(2));
                } catch (NumberFormatException ignored) {
                    digits = null;
                }
            }
            int mois = digits != null ? digits : moisFromLetters(letters);
            if (mois > 0) {
                return Optional.of(mois * 30);
            }
        }
        return Optional.empty();
    }

    private static int moisFromLetters(String w) {
        return switch (w) {
            case "un", "une" -> 1;
            case "deux" -> 2;
            case "trois" -> 3;
            case "quatre" -> 4;
            case "cinq" -> 5;
            case "six" -> 6;
            case "sept" -> 7;
            case "huit" -> 8;
            case "neuf" -> 9;
            case "dix" -> 10;
            case "onze" -> 11;
            case "douze" -> 12;
            default -> 0;
        };
    }

    private static String cleanObjet(String raw) {
        String v = raw.replaceAll("\\s+", " ").trim();
        // Coupe pieds de page CPS
        v = v.replaceAll("(?i)\\s*CPS\\s+AOO?\\s*N[°ºo].*$", "").trim();
        if (v.length() > 240) {
            v = v.substring(0, 240).trim();
        }
        return v;
    }

    private static String cleanNom(String raw) {
        String v = raw.replaceAll("\\s+", " ").trim();
        v = v.replaceAll("(?i)\\s*\\(SRRA\\)\\s*$", "").trim();
        if (v.length() > 160) {
            v = v.substring(0, 160).trim();
        }
        return v;
    }

    private static double scoreConfiance(MarcheProposeDto.Metadonnees m) {
        int hits = 0;
        int total = 8;
        if (StringUtils.hasText(m.getObjet())) hits++;
        if (StringUtils.hasText(m.getDonneurOrdre())) hits++;
        if (StringUtils.hasText(m.getReference())) hits++;
        if (StringUtils.hasText(m.getVille())) hits++;
        if (StringUtils.hasText(m.getType())) hits++;
        if (m.getDelaiExecutionJours() != null) hits++;
        if (m.getCautionProvisoire() != null) hits++;
        if (m.getCautionDefinitive() != null) hits++;
        return Math.max(0.45, Math.min(0.92, 0.4 + (hits / (double) total) * 0.5));
    }

    @SafeVarargs
    private static Optional<String> firstNonEmpty(Optional<String>... opts) {
        for (Optional<String> o : opts) {
            if (o != null && o.isPresent() && StringUtils.hasText(o.get())) {
                return o;
            }
        }
        return Optional.empty();
    }

    private static MarcheProposeDto.PieceProposee piece(String type, String libelle, boolean obligatoire) {
        return MarcheProposeDto.PieceProposee.builder()
                .type(type)
                .libelle(libelle)
                .obligatoire(obligatoire)
                .build();
    }

    private static void addIfMention(
            Map<String, MarcheProposeDto.PieceProposee> pieces,
            String lower,
            String keyword,
            String type,
            String libelle,
            boolean obligatoire) {
        if (lower.contains(keyword) && !pieces.containsKey(type)) {
            pieces.put(type, piece(type, libelle, obligatoire));
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

    private static Optional<LocalDate> parseDate(String raw) {
        String n = raw.trim().replace('-', '/').replace('.', '/');
        for (DateTimeFormatter fmt : List.of(
                DateTimeFormatter.ofPattern("d/M/uuuu"),
                DateTimeFormatter.ofPattern("d/M/uu"))) {
            try {
                LocalDate d = LocalDate.parse(n, fmt);
                if (d.getYear() < 100) {
                    d = d.withYear(2000 + d.getYear());
                }
                return Optional.of(d);
            } catch (DateTimeParseException ignored) {
                /* try next */
            }
        }
        return Optional.empty();
    }

    private static Optional<BigDecimal> parseDecimal(String raw) {
        try {
            String n = raw.replace(" ", "").replace(',', '.');
            return Optional.of(new BigDecimal(n));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }
}
