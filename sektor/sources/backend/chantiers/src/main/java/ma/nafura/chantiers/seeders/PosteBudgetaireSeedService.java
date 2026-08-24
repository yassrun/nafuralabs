package ma.nafura.chantiers.seeders;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import ma.nafura.chantiers.domain.budget.DebourseNoeud;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.DebourseNoeudRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PosteBudgetaireSeedService {

    private final PosteBudgetaireRepository repository;
    private final DebourseNoeudRepository debourseRepository;
    private final ObjectMapper objectMapper;

    public PosteBudgetaireSeedService(
            PosteBudgetaireRepository repository,
            DebourseNoeudRepository debourseRepository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.debourseRepository = debourseRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Jeu de démonstration : ces postes ne viennent d'aucune étude, donc ils sont
     * {@link NatureLigne#INTERNE} (AC-14, conséquence d'AC-3) — sans lien retour et sans prix de
     * vente (AC-4). Aucune ligne sans nature (AC-1).
     *
     * <p>Chaque poste reçoit aussi un <b>déboursé sur ses quatre rubriques</b>, d'origine
     * {@code SAISI} : le budget par rubrique agrégé au chantier n'existe plus (budget-et-marge
     * AC-8), donc sans ça l'écran budget serait vide en lab. Aucune ligne d'agrégat n'est écrite
     * — le déboursé vit sur le nœud, comme partout ailleurs.
     */
    @Transactional
    public void seedIfEmpty() {
        if (repository.countByTenantId(TenantContext.getTenantId()) > 0) {
            return;
        }
        ClassPathResource resource = new ClassPathResource("seed/postes-budgetaires-seed.json");
        if (!resource.exists()) {
            return;
        }
        try (InputStream in = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            if (!root.has("postes")) {
                return;
            }
            for (JsonNode node : root.get("postes")) {
                PosteBudgetaire entity = PosteBudgetaire.builder()
                        .id(node.get("id").asText())
                        .tenantId(TenantContext.getTenantId())
                        .lotId(node.get("lotId").asText())
                        .code(node.get("code").asText())
                        .designation(node.get("designation").asText())
                        .nature(NatureLigne.INTERNE)
                        .dpgfNoeudId(null)
                        .unite(textOrNull(node, "unite"))
                        .quantite(
                                node.hasNonNull("quantite")
                                        ? new BigDecimal(node.get("quantite").asText())
                                        : null)
                        .ordre(node.path("ordre").asInt(0))
                        .debourseOrigine(OrigineDebourse.SAISI)
                        .debourseNonFiable(false)
                        .build();
                repository.save(entity);
                seedDebourse(entity.getId(), node.get("debourse"));
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed postes budgetaires", ex);
        }
    }

    private void seedDebourse(String posteId, JsonNode debourse) {
        if (debourse == null || !debourse.isObject()) {
            return;
        }
        debourse.fields().forEachRemaining(entry -> {
            RubriqueDebourse rubrique = RubriqueDebourse.parse(entry.getKey());
            if (rubrique == null) {
                return;
            }
            BigDecimal montant = new BigDecimal(entry.getValue().asText());
            if (montant.signum() == 0) {
                return;
            }
            debourseRepository.save(DebourseNoeud.builder()
                    .id(DebourseNoeud.buildId(posteId, rubrique))
                    .tenantId(TenantContext.getTenantId())
                    .posteId(posteId)
                    .rubrique(rubrique)
                    .prevuHt(montant)
                    .reviseHt(montant)
                    .build());
        });
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
