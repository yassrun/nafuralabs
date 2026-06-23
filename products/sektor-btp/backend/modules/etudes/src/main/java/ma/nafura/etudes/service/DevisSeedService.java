package ma.nafura.etudes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.domain.model.Devis;
import ma.nafura.etudes.domain.model.DevisLigne;
import ma.nafura.etudes.domain.model.DevisVersion;
import ma.nafura.etudes.domain.model.Metre;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.MetreRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DevisSeedService {

    private static final int MONEY_SCALE = 2;

    private final DevisRepository repository;
    private final MetreRepository metreRepository;
    private final OuvrageRepository ouvrageRepository;
    private final MetreSeedService metreSeedService;
    private final ObjectMapper objectMapper;

    public DevisSeedService(
            DevisRepository repository,
            MetreRepository metreRepository,
            OuvrageRepository ouvrageRepository,
            MetreSeedService metreSeedService,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.metreRepository = metreRepository;
        this.ouvrageRepository = ouvrageRepository;
        this.metreSeedService = metreSeedService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
        metreSeedService.seedIfEmpty();
        try (InputStream in = new ClassPathResource("seed/devis-seed.json").getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            for (JsonNode node : root.get("devis")) {
                Devis entity = buildDevis(node, tenantId);
                applyTotals(entity);
                repository.save(entity);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to seed devis", ex);
        }
    }

    private Devis buildDevis(JsonNode node, UUID tenantId) {
        Devis entity = Devis.builder()
                .tenantId(tenantId)
                .numero(node.get("numero").asText())
                .version(1)
                .clientId(node.get("clientId").asText())
                .clientName(textOrNull(node, "clientName"))
                .contactClient(textOrNull(node, "contactClient"))
                .objet(node.get("objet").asText())
                .ville(textOrNull(node, "ville"))
                .dateEmission(LocalDate.parse(node.get("dateEmission").asText()))
                .dateValidite(LocalDate.parse(node.get("dateValidite").asText()))
                .metreId(resolveMetreId(tenantId, textOrNull(node, "metreNumero")))
                .bibliothequeReference(textOrNull(node, "bibliothequeReference"))
                .conditionsPaiement(node.get("conditionsPaiement").asText())
                .delaiExecutionJours(
                        node.hasNonNull("delaiExecutionJours") ? node.get("delaiExecutionJours").asInt() : null)
                .tvaTaux(new BigDecimal(node.path("tvaTaux").asText("20")))
                .status(node.path("status").asText(Devis.STATUS_BROUILLON))
                .chantierGenereId(textOrNull(node, "chantierGenereId"))
                .notes(textOrNull(node, "notes"))
                .lignes(new ArrayList<>())
                .historiqueVersions(new ArrayList<>())
                .build();

        Map<Integer, UUID> ligneIdsByOrdre = new HashMap<>();
        if (node.has("lignes") && node.get("lignes").isArray()) {
            for (JsonNode line : node.get("lignes")) {
                int ordre = line.get("ordre").asInt();
                UUID ligneId = UUID.randomUUID();
                ligneIdsByOrdre.put(ordre, ligneId);

                UUID parentId = line.hasNonNull("parentOrdre")
                        ? ligneIdsByOrdre.get(line.get("parentOrdre").asInt())
                        : null;

                BigDecimal qty = decimalOrNull(line, "quantite");
                BigDecimal pu = decimalOrNull(line, "prixUnitaireHt");
                BigDecimal totalHt = decimalOrNull(line, "totalHt");
                if (totalHt == null && qty != null && pu != null) {
                    totalHt = qty.multiply(pu).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
                }

                entity.getLignes()
                        .add(DevisLigne.builder()
                                .id(ligneId)
                                .tenantId(tenantId)
                                .devis(entity)
                                .ordre(ordre)
                                .parentLigneId(parentId)
                                .type(line.get("type").asText())
                                .code(textOrNull(line, "code"))
                                .designation(line.get("designation").asText())
                                .ouvrageId(resolveOuvrageId(tenantId, textOrNull(line, "ouvrageCode")))
                                .unite(textOrNull(line, "unite"))
                                .quantite(qty)
                                .prixUnitaireHt(pu)
                                .totalHt(totalHt)
                                .build());
            }
        }

        if (node.has("versions") && node.get("versions").isArray()) {
            for (JsonNode versionNode : node.get("versions")) {
                entity.getHistoriqueVersions()
                        .add(DevisVersion.builder()
                                .tenantId(tenantId)
                                .devis(entity)
                                .version(versionNode.get("version").asInt())
                                .snapshotDate(LocalDate.parse(versionNode.get("date").asText()))
                                .totalHt(new BigDecimal(versionNode.get("totalHt").asText()))
                                .modifications(versionNode.get("modifications").asText())
                                .build());
            }
        }
        return entity;
    }

    private UUID resolveMetreId(UUID tenantId, String numero) {
        if (numero == null || numero.isBlank()) {
            return null;
        }
        return metreRepository
                .findByTenantIdAndNumero(tenantId, numero.trim())
                .map(Metre::getId)
                .orElse(null);
    }

    private UUID resolveOuvrageId(UUID tenantId, String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        return ouvrageRepository
                .findByTenantIdAndCode(tenantId, code.trim())
                .map(Ouvrage::getId)
                .orElse(null);
    }

    private void applyTotals(Devis entity) {
        BigDecimal totalHt = BigDecimal.ZERO;
        for (DevisLigne ligne : entity.getLignes()) {
            if (DevisLigne.TYPE_OUVRAGE.equals(ligne.getType()) && ligne.getTotalHt() != null) {
                totalHt = totalHt.add(ligne.getTotalHt());
            }
        }
        totalHt = totalHt.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal tvaTaux = entity.getTvaTaux() != null ? entity.getTvaTaux() : new BigDecimal("20");
        BigDecimal totalTva = totalHt
                .multiply(tvaTaux)
                .divide(new BigDecimal("100"), MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal totalTtc = totalHt.add(totalTva).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        entity.setTotalHt(totalHt);
        entity.setTotalTva(totalTva);
        entity.setTotalTtc(totalTtc);
    }

    private static BigDecimal decimalOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? new BigDecimal(node.get(field).asText()) : null;
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
