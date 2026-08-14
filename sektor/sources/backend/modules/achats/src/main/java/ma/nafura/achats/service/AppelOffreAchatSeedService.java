package ma.nafura.achats.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ma.nafura.achats.domain.model.AppelOffreAchat;
import ma.nafura.achats.domain.model.AppelOffreLigne;
import ma.nafura.achats.domain.model.OffreFournisseur;
import ma.nafura.achats.domain.model.OffreFournisseurLigne;
import ma.nafura.achats.repository.AppelOffreAchatRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppelOffreAchatSeedService {

    private final AppelOffreAchatRepository repository;
    private final ObjectMapper objectMapper;

    public AppelOffreAchatSeedService(AppelOffreAchatRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("seed/appels-offres-achat-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("appelsOffres")) {
                AppelOffreAchat entity = AppelOffreAchat.builder()
                        .tenantId(tenantId)
                        .numero(node.get("numero").asText())
                        .objet(node.get("objet").asText())
                        .chantierId(textOrNull(node, "chantierId"))
                        .chantierCode(textOrNull(node, "chantierCode"))
                        .chantierName(textOrNull(node, "chantierName"))
                        .datePublication(
                                node.hasNonNull("datePublication")
                                        ? LocalDate.parse(node.get("datePublication").asText())
                                        : null)
                        .dateLimiteDepot(LocalDate.parse(node.get("dateLimiteDepot").asText()))
                        .status(node.path("status").asText(AppelOffreAchat.STATUS_BROUILLON))
                        .fournisseurAttribueId(textOrNull(node, "fournisseurAttribueId"))
                        .fournisseurAttribueName(textOrNull(node, "fournisseurAttribueName"))
                        .bcGenereId(textOrNull(node, "bcGenereId"))
                        .bcGenereNumero(textOrNull(node, "bcGenereNumero"))
                        .totalAttribueHt(
                                node.hasNonNull("totalAttribueHt")
                                        ? new BigDecimal(node.get("totalAttribueHt").asText())
                                        : null)
                        .notes(textOrNull(node, "notes"))
                        .fournisseurInvitesIds(readInviteIds(node))
                        .lignes(new ArrayList<>())
                        .reponses(new ArrayList<>())
                        .build();

                Map<String, AppelOffreLigne> lignesByArticle = new HashMap<>();
                if (node.has("lignes") && node.get("lignes").isArray()) {
                    for (JsonNode line : node.get("lignes")) {
                        AppelOffreLigne ligne = AppelOffreLigne.builder()
                                .tenantId(tenantId)
                                .appelOffre(entity)
                                .articleId(line.get("articleId").asText())
                                .articleCode(textOrNull(line, "articleCode"))
                                .articleName(textOrNull(line, "articleName"))
                                .quantite(new BigDecimal(line.get("quantite").asText()))
                                .uomCode(textOrNull(line, "uomCode"))
                                .build();
                        entity.getLignes().add(ligne);
                        lignesByArticle.put(line.get("articleId").asText(), ligne);
                    }
                }

                if (node.has("reponses") && node.get("reponses").isArray()) {
                    for (JsonNode resp : node.get("reponses")) {
                        OffreFournisseur offre = OffreFournisseur.builder()
                                .tenantId(tenantId)
                                .appelOffre(entity)
                                .fournisseurId(resp.get("fournisseurId").asText())
                                .fournisseurName(textOrNull(resp, "fournisseurName"))
                                .dateReponse(
                                        resp.hasNonNull("dateReponse")
                                                ? LocalDate.parse(resp.get("dateReponse").asText())
                                                : null)
                                .totalHt(new BigDecimal(resp.path("totalHt").asText("0")))
                                .delaiLivraisonJours(
                                        resp.hasNonNull("delaiLivraisonJours")
                                                ? resp.get("delaiLivraisonJours").asInt()
                                                : null)
                                .conditionsPaiement(textOrNull(resp, "conditionsPaiement"))
                                .notes(textOrNull(resp, "notes"))
                                .retenue(resp.path("retenue").asBoolean(false))
                                .score(
                                        resp.hasNonNull("score")
                                                ? new BigDecimal(resp.get("score").asText())
                                                : null)
                                .lignes(new ArrayList<>())
                                .build();

                        if (resp.has("lignes") && resp.get("lignes").isArray()) {
                            for (JsonNode ol : resp.get("lignes")) {
                                String articleId = ol.get("articleId").asText();
                                AppelOffreLigne aoLigne = lignesByArticle.get(articleId);
                                if (aoLigne == null) {
                                    continue;
                                }
                                BigDecimal unit = new BigDecimal(ol.get("prixUnitaireHt").asText());
                                BigDecimal total = ol.hasNonNull("totalHt")
                                        ? new BigDecimal(ol.get("totalHt").asText())
                                        : unit.multiply(aoLigne.getQuantite());
                                offre.getLignes()
                                        .add(OffreFournisseurLigne.builder()
                                                .tenantId(tenantId)
                                                .offre(offre)
                                                .appelOffreLigne(aoLigne)
                                                .prixUnitaireHt(unit)
                                                .totalHt(total)
                                                .delaiSpecifique(
                                                        ol.hasNonNull("delaiSpecifique")
                                                                ? ol.get("delaiSpecifique").asInt()
                                                                : null)
                                                .build());
                            }
                        }
                        entity.getReponses().add(offre);
                    }
                }

                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed appels offres achat", ex);
        }
    }

    private static List<String> readInviteIds(JsonNode node) {
        List<String> ids = new ArrayList<>();
        if (node.has("fournisseurInvitesIds") && node.get("fournisseurInvitesIds").isArray()) {
            for (JsonNode id : node.get("fournisseurInvitesIds")) {
                ids.add(id.asText());
            }
        }
        return ids;
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
