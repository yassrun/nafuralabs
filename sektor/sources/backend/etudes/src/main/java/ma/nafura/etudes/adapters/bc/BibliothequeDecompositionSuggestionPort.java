package ma.nafura.etudes.adapters.bc;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.domain.ouvrage.ComposantOuvrage;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.ouvrage.Ouvrage;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import ma.nafura.etudes.service.port.bc.DecompositionSuggestionPort;
import ma.nafura.etudes.service.port.capability.DecompositionNeedsPort;
/**
 * L16 — suggestion de décomposition depuis la bibliothèque tenant (déterministe).
 * Pas de LLM ici : le chemin Gemini reste {@link DecompositionNeedsPort} /
 * {@code DecompositionProposeService}.
 */
@Component
@Primary
public class BibliothequeDecompositionSuggestionPort implements DecompositionSuggestionPort {

    private final OuvrageRepository ouvrageRepository;

    public BibliothequeDecompositionSuggestionPort(OuvrageRepository ouvrageRepository) {
        this.ouvrageRepository = ouvrageRepository;
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public List<ComposantDpuInputDto> suggest(DpgfNoeud article) {
        if (article == null || !StringUtils.hasText(article.getLibelle())) {
            return List.of();
        }
        String q = normalize(article.getLibelle());
        List<Ouvrage> ouvrages = ouvrageRepository.findByTenantIdOrderByCodeAsc(TenantContext.getTenantId());
        Ouvrage best = ouvrages.stream()
                .filter(o -> o.getComposants() != null && !o.getComposants().isEmpty())
                .map(o -> new Scored(o, score(q, normalize(o.getDesignation()))))
                .filter(s -> s.score >= 0.45)
                .max(Comparator.comparingDouble(s -> s.score))
                .map(s -> s.ouvrage)
                .orElse(null);
        if (best == null) {
            return List.of();
        }
        List<ComposantDpuInputDto> out = new ArrayList<>();
        for (ComposantOuvrage c : best.getComposants()) {
            ComposantDpuInputDto dto = new ComposantDpuInputDto();
            dto.setType(c.getType());
            dto.setReferenceType(c.getReferenceType() != null ? c.getReferenceType() : "LIBRE");
            dto.setItemId(c.getItemId());
            dto.setOuvrageId(c.getRefOuvrageId());
            dto.setLibelle(c.getLibelle());
            dto.setRendement(c.getRendement() != null ? c.getRendement() : BigDecimal.ONE);
            dto.setUnite(c.getUnite() != null ? c.getUnite() : "U");
            dto.setPrixUnitaire(
                    c.getPrixUnitaire() != null ? c.getPrixUnitaire() : BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
            dto.setSuggereParIa(false);
            out.add(dto);
        }
        return out;
    }

    private static double score(String q, String cand) {
        if (q.isBlank() || cand.isBlank()) {
            return 0;
        }
        if (q.equals(cand)) {
            return 1.0;
        }
        String[] qt = q.split(" ");
        String[] ct = cand.split(" ");
        int shared = 0;
        for (String t : qt) {
            for (String c : ct) {
                if (t.equals(c)) {
                    shared++;
                    break;
                }
            }
        }
        return (double) shared / Math.max(qt.length, ct.length);
    }

    private static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim()
                .toLowerCase()
                .replaceAll("[^a-z0-9àâäéèêëïîôùûüç\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private record Scored(Ouvrage ouvrage, double score) {}
}
