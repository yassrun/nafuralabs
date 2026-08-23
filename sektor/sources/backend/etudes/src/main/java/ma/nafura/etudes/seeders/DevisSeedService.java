package ma.nafura.etudes.seeders;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.etudes.domain.devis.Devis;
import ma.nafura.etudes.domain.devis.DevisLigne;
import ma.nafura.etudes.domain.devis.DevisVersion;
import ma.nafura.etudes.domain.ouvrage.Ouvrage;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class DevisSeedService {

    private static final int MONEY_SCALE = 2;

    private final DevisRepository repository;
    private final OuvrageRepository ouvrageRepository;
    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

    public DevisSeedService(
            DevisRepository repository,
            OuvrageRepository ouvrageRepository,
            ObjectMapper objectMapper) {
        this.repository = repository;
        this.ouvrageRepository = ouvrageRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void seedIfEmpty() {
        UUID tenantId = TenantContext.getTenantId();
        if (repository.countByTenantId(tenantId) > 0) {
            return;
        }
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
        String rawClientId = node.get("clientId").asText();
        ResolvedClient client = resolvePartnerClient(tenantId, rawClientId, textOrNull(node, "clientName"));
        Devis entity = Devis.builder()
                .tenantId(tenantId)
                .numero(node.get("numero").asText())
                .version(1)
                .clientId(client.id())
                .clientName(client.name())
                .contactClient(textOrNull(node, "contactClient"))
                .objet(node.get("objet").asText())
                .ville(textOrNull(node, "ville"))
                .dateEmission(LocalDate.parse(node.get("dateEmission").asText()))
                .dateValidite(LocalDate.parse(node.get("dateValidite").asText()))
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

    /**
     * Résout un code legacy ({@code cli-001} / {@code CLI-001}) vers le UUID Partner
     * sans dépendre du module partner (requête SQL directe).
     */
    private ResolvedClient resolvePartnerClient(UUID tenantId, String rawId, String fallbackName) {
        String raw = StringUtils.hasText(rawId) ? rawId.trim() : null;
        if (raw == null) {
            throw new IllegalStateException("devis seed: clientId manquant");
        }
        try {
            UUID id = UUID.fromString(raw);
            return new ResolvedClient(id.toString(), fallbackName);
        } catch (IllegalArgumentException ignored) {
            // continue — code métier
        }
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager
                .createNativeQuery(
                        """
                        SELECT p.id::text, p.raison_sociale
                        FROM partners p
                        WHERE p.tenant_id = :tenantId
                          AND lower(p.code) = lower(:code)
                        LIMIT 1
                        """)
                .setParameter("tenantId", tenantId)
                .setParameter("code", raw)
                .getResultList();
        if (rows.isEmpty()) {
            // Dernier recours : garder le code (migration 010 pourra backfiller plus tard)
            return new ResolvedClient(raw.toLowerCase(Locale.ROOT), fallbackName);
        }
        Object[] row = rows.get(0);
        return new ResolvedClient(String.valueOf(row[0]), String.valueOf(row[1]));
    }

    private record ResolvedClient(String id, String name) {}

    private static BigDecimal decimalOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? new BigDecimal(node.get(field).asText()) : null;
    }

    private static String textOrNull(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.get(field).asText() : null;
    }
}
