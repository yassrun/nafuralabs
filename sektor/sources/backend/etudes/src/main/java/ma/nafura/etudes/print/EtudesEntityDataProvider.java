package ma.nafura.etudes.print;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DossierEtudeSyntheseDto;
import ma.nafura.etudes.api.dto.DpgfLotTotalDto;
import ma.nafura.etudes.domain.model.Devis;
import ma.nafura.etudes.domain.model.DevisLigne;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.DevisService;
import ma.nafura.etudes.service.DossierEtudeService;
import ma.nafura.etudes.service.DpgfService;
import ma.nafura.etudes.service.gate.ResultatGate;
import ma.nafura.platform.collaboration.docmanager.template.AmountInWords;
import ma.nafura.platform.collaboration.docmanager.template.EntityDataProvider;
import ma.nafura.platform.collaboration.docmanager.template.PrintDocument;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Component;

/**
 * Supplies Thymeleaf variables for Sektor étude print templates.
 */
@Component
public class EtudesEntityDataProvider implements EntityDataProvider {

    private final DevisService devisService;
    private final DossierEtudeService dossierEtudeService;
    private final DossierEtudeRepository dossierRepository;
    private final DpgfService dpgfService;

    public EtudesEntityDataProvider(
            DevisService devisService,
            DossierEtudeService dossierEtudeService,
            DossierEtudeRepository dossierRepository,
            DpgfService dpgfService) {
        this.devisService = devisService;
        this.dossierEtudeService = dossierEtudeService;
        this.dossierRepository = dossierRepository;
        this.dpgfService = dpgfService;
    }

    @Override
    public boolean supports(String entityType) {
        return EtudesPrintEntityTypes.DEVIS.equals(entityType)
                || EtudesPrintEntityTypes.DOSSIER_BORDEREAU.equals(entityType)
                || EtudesPrintEntityTypes.DOSSIER_SYNTHESE.equals(entityType);
    }

    @Override
    public Map<String, Object> getEntityData(String entityType, UUID entityId) {
        if (entityType == null || entityId == null) {
            return Map.of();
        }
        return switch (entityType) {
            case EtudesPrintEntityTypes.DEVIS -> mapDevis(entityId);
            case EtudesPrintEntityTypes.DOSSIER_BORDEREAU -> mapBordereau(entityId);
            case EtudesPrintEntityTypes.DOSSIER_SYNTHESE -> mapSynthese(entityId);
            default -> Map.of();
        };
    }

    @Override
    public Map<String, Object> getSampleEntityData(String entityType) {
        if (entityType == null) {
            return Map.of();
        }
        return switch (entityType) {
            case EtudesPrintEntityTypes.DEVIS -> sampleDevis();
            case EtudesPrintEntityTypes.DOSSIER_BORDEREAU -> sampleBordereau();
            case EtudesPrintEntityTypes.DOSSIER_SYNTHESE -> sampleSynthese();
            default -> Map.of();
        };
    }

    @Override
    public Optional<PrintDocument> getDocument(String entityType, UUID entityId) {
        if (!EtudesPrintEntityTypes.DEVIS.equals(entityType) || entityId == null) {
            // Bordereau and synthèse are study internals, not counterparty documents:
            // they have no client block and no legal totals to normalise.
            return Optional.empty();
        }
        return Optional.of(toPrintDocument(devisService.getById(entityId)));
    }

    @Override
    public Optional<PrintDocument> getSampleDocument(String entityType) {
        if (!EtudesPrintEntityTypes.DEVIS.equals(entityType)) {
            return Optional.empty();
        }
        return Optional.of(sampleDevisDocument());
    }

    private static PrintDocument toPrintDocument(Devis devis) {
        List<PrintDocument.Line> lignes = new ArrayList<>();
        if (devis.getLignes() != null) {
            for (DevisLigne l : devis.getLignes()) {
                lignes.add(new PrintDocument.Line(
                        l.getCode(),
                        l.getDesignation(),
                        l.getUnite(),
                        l.getQuantite(),
                        l.getPrixUnitaireHt(),
                        l.getTotalHt(),
                        devis.getTvaTaux()));
            }
        }
        return PrintDocument.builder()
                .type(EtudesPrintEntityTypes.DEVIS)
                .libelleType("Devis")
                .numero(devis.getNumero())
                .date(devis.getDateEmission())
                .dateEcheance(devis.getDateValidite())
                .objet(devis.getObjet())
                .statut(devis.getStatus() != null ? devis.getStatus().toString() : null)
                .version(devis.getVersion())
                .client(new PrintDocument.Party(
                        devis.getClientName(),
                        null,
                        null,
                        devis.getVille(),
                        devis.getContactClient(),
                        null,
                        null))
                .lignes(lignes)
                .totaux(totals(
                        devis.getTotalHt(), devis.getTotalTva(), devis.getTotalTtc(), devis.getTvaTaux()))
                .mentions(devis.getConditionsPaiement())
                .build();
    }

    private static PrintDocument.Totals totals(
            BigDecimal ht, BigDecimal tva, BigDecimal ttc, BigDecimal taux) {
        return new PrintDocument.Totals(ht, tva, ttc, taux, null, AmountInWords.spellDirhams(ttc));
    }

    private static PrintDocument sampleDevisDocument() {
        return PrintDocument.builder()
                .type(EtudesPrintEntityTypes.DEVIS)
                .libelleType("Devis")
                .numero("DEV-SAMPLE")
                .date(LocalDate.now())
                .dateEcheance(LocalDate.now().plusDays(30))
                .objet("Travaux de second œuvre — échantillon")
                .statut("BROUILLON")
                .version(1)
                .client(new PrintDocument.Party(
                        "Client Exemple SA",
                        "001234567000089",
                        "12 rue Exemple",
                        "Casablanca",
                        "M. Exemple",
                        null,
                        null))
                .lignes(List.of(new PrintDocument.Line(
                        "01.01",
                        "Article exemple",
                        "m²",
                        new BigDecimal("100"),
                        new BigDecimal("1000"),
                        new BigDecimal("100000"),
                        new BigDecimal("20"))))
                .totaux(totals(
                        new BigDecimal("100000.00"),
                        new BigDecimal("20000.00"),
                        new BigDecimal("120000.00"),
                        new BigDecimal("20")))
                .mentions("30 % à la commande, solde à réception")
                .build();
    }

    private Map<String, Object> mapDevis(UUID id) {
        Devis devis = devisService.getById(id);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", devis.getId() != null ? devis.getId().toString() : null);
        m.put("code", devis.getNumero());
        m.put("numero", devis.getNumero());
        m.put("version", devis.getVersion());
        m.put("objet", devis.getObjet());
        m.put("ville", devis.getVille());
        // Kept as LocalDate, not a string: templates format them with #temporals, and an ISO
        // string would print as 2026-08-05 on a customer-facing document.
        m.put("dateEmission", devis.getDateEmission());
        m.put("dateValidite", devis.getDateValidite());
        m.put("status", devis.getStatus());
        m.put("conditionsPaiement", devis.getConditionsPaiement());
        m.put("delaiExecutionJours", devis.getDelaiExecutionJours());
        m.put("totalHt", devis.getTotalHt());
        m.put("tvaTaux", devis.getTvaTaux());
        m.put("totalTva", devis.getTotalTva());
        m.put("totalTtc", devis.getTotalTtc());
        m.put("notes", devis.getNotes());
        Map<String, Object> client = new LinkedHashMap<>();
        client.put("id", devis.getClientId());
        client.put("name", devis.getClientName());
        client.put("contact", devis.getContactClient());
        m.put("client", client);
        m.put("customer", client);
        List<Map<String, Object>> lignes = new ArrayList<>();
        if (devis.getLignes() != null) {
            for (DevisLigne l : devis.getLignes()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("type", l.getType());
                row.put("code", l.getCode());
                row.put("designation", l.getDesignation());
                row.put("unite", l.getUnite());
                row.put("quantite", l.getQuantite());
                row.put("prixUnitaireHt", l.getPrixUnitaireHt());
                row.put("totalHt", l.getTotalHt());
                lignes.add(row);
            }
        }
        m.put("lignes", lignes);
        return m;
    }

    private Map<String, Object> mapBordereau(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        Map<String, Object> m = baseDossier(dossier);
        if (dossier.getDpgfId() == null) {
            m.put("lignes", List.of());
            m.put("totalHt", BigDecimal.ZERO);
            m.put("totalTva", BigDecimal.ZERO);
            m.put("totalTtc", BigDecimal.ZERO);
            m.put("tvaTaux", null);
            return m;
        }
        Dpgf dpgf = dpgfService.getById(dossier.getDpgfId());
        m.put("dpgfNumero", dpgf.getNumero());
        m.put("tvaTaux", dpgf.getTvaTaux());
        m.put("totalHt", dpgf.getTotalHt());
        m.put("totalTva", dpgf.getTotalTva());
        m.put("totalTtc", dpgf.getTotalTtc());
        List<Map<String, Object>> lignes = new ArrayList<>();
        flattenNoeuds(dpgf.getHierarchie() != null ? dpgf.getHierarchie() : List.of(), 0, lignes);
        m.put("lignes", lignes);
        return m;
    }

    private Map<String, Object> mapSynthese(UUID dossierId) {
        DossierEtudeSyntheseDto syn = dossierEtudeService.synthese(dossierId);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", syn.getId() != null ? syn.getId().toString() : null);
        m.put("code", syn.getNumero());
        m.put("numero", syn.getNumero());
        m.put("objet", syn.getObjet());
        m.put("status", syn.getStatus() != null ? syn.getStatus().name() : null);
        m.put("phase", syn.getPhase());
        m.put("bordereauRevision", syn.getBordereauRevision());
        m.put("nombreArticles", syn.getNombreArticles());
        m.put("anomaliesBloquantes", syn.getAnomaliesBloquantes());
        m.put("totalHt", syn.getTotalHt());
        m.put("devisNumero", syn.getDevisNumero());
        Map<String, Object> client = new LinkedHashMap<>();
        client.put("id", syn.getClientId());
        client.put("name", syn.getClientNom());
        m.put("client", client);
        m.put("customer", client);

        List<Map<String, Object>> lots = new ArrayList<>();
        DossierEtude dossier = requireDossier(dossierId);
        if (dossier.getDpgfId() != null) {
            for (DpgfLotTotalDto lot : dpgfService.getTotauxByLot(dossier.getDpgfId())) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("code", lot.code());
                row.put("libelle", lot.libelle());
                row.put("total", lot.total());
                lots.add(row);
            }
        }
        m.put("lots", lots);

        List<Map<String, Object>> gates = new ArrayList<>();
        if (syn.getGates() != null) {
            for (ResultatGate g : syn.getGates()) {
                Map<String, Object> gm = new LinkedHashMap<>();
                gm.put("etape", g.etape());
                gm.put("bloquant", g.bloquant());
                gm.put("passe", g.passe());
                List<Map<String, Object>> problemes = new ArrayList<>();
                if (g.problemes() != null) {
                    for (ResultatGate.ProblemeGate p : g.problemes()) {
                        Map<String, Object> pm = new LinkedHashMap<>();
                        pm.put("codeArticle", p.codeArticle());
                        pm.put("libelle", p.libelle());
                        pm.put("message", p.message());
                        problemes.add(pm);
                    }
                }
                gm.put("problemes", problemes);
                gm.put("nbProblemes", problemes.size());
                gates.add(gm);
            }
        }
        m.put("gates", gates);
        return m;
    }

    private Map<String, Object> baseDossier(DossierEtude dossier) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", dossier.getId() != null ? dossier.getId().toString() : null);
        m.put("code", dossier.getNumero());
        m.put("numero", dossier.getNumero());
        m.put("objet", dossier.getObjet());
        m.put("status", dossier.getStatus() != null ? dossier.getStatus().name() : null);
        m.put(
                "bordereauRevision",
                dossier.getBordereauRevision() != null ? dossier.getBordereauRevision() : 1);
        Map<String, Object> client = new LinkedHashMap<>();
        client.put("id", dossier.getClientId());
        client.put("name", dossier.getClientNom());
        m.put("client", client);
        m.put("customer", client);
        return m;
    }

    private void flattenNoeuds(List<DpgfNoeud> nodes, int depth, List<Map<String, Object>> out) {
        if (nodes == null) {
            return;
        }
        for (DpgfNoeud n : nodes) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("type", n.getType());
            row.put("code", n.getCode());
            row.put("libelle", n.getLibelle());
            row.put("unite", n.getUnite());
            row.put("quantite", n.getQuantite());
            row.put("prixUnitaire", n.getPrixUnitaire());
            row.put("total", n.getTotal());
            row.put("depth", depth);
            row.put("indent", "  ".repeat(Math.max(0, depth)));
            out.add(row);
            flattenNoeuds(n.getEnfants(), depth + 1, out);
        }
    }

    private DossierEtude requireDossier(UUID id) {
        return dossierRepository
                .findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Dossier not found: " + id));
    }

    private static Map<String, Object> sampleDevis() {
        Map<String, Object> m = new HashMap<>();
        m.put("code", "DEV-SAMPLE");
        m.put("numero", "DEV-SAMPLE");
        m.put("version", 1);
        m.put("objet", "Travaux de second œuvre — échantillon");
        m.put("ville", "Casablanca");
        // Same shape as real data, so the preview exercises the template's date formatting.
        m.put("dateEmission", LocalDate.now());
        m.put("dateValidite", LocalDate.now().plusDays(30));
        m.put("status", "BROUILLON");
        m.put("conditionsPaiement", "30% à la commande, solde à réception");
        m.put("delaiExecutionJours", 60);
        m.put("totalHt", new BigDecimal("100000.00"));
        m.put("tvaTaux", new BigDecimal("20"));
        m.put("totalTva", new BigDecimal("20000.00"));
        m.put("totalTtc", new BigDecimal("120000.00"));
        Map<String, Object> client = Map.of("name", "Client Exemple SA", "contact", "M. Exemple");
        m.put("client", client);
        m.put("customer", client);
        m.put(
                "lignes",
                List.of(
                        Map.of(
                                "type",
                                "OUVRAGE",
                                "code",
                                "01.01",
                                "designation",
                                "Article exemple",
                                "unite",
                                "m²",
                                "quantite",
                                new BigDecimal("100"),
                                "prixUnitaireHt",
                                new BigDecimal("1000"),
                                "totalHt",
                                new BigDecimal("100000"))));
        return m;
    }

    private static Map<String, Object> sampleBordereau() {
        Map<String, Object> m = new HashMap<>();
        m.put("code", "ETU-SAMPLE");
        m.put("numero", "ETU-SAMPLE");
        m.put("objet", "Bordereau d'étude — échantillon");
        m.put("bordereauRevision", 1);
        m.put("tvaTaux", new BigDecimal("20"));
        m.put("totalHt", new BigDecimal("50000"));
        m.put("totalTva", new BigDecimal("10000"));
        m.put("totalTtc", new BigDecimal("60000"));
        Map<String, Object> client = Map.of("name", "Client Exemple SA");
        m.put("client", client);
        m.put("customer", client);
        m.put(
                "lignes",
                List.of(
                        Map.of(
                                "type",
                                "LOT",
                                "code",
                                "01",
                                "libelle",
                                "Lot gros œuvre",
                                "depth",
                                0,
                                "indent",
                                ""),
                        Map.of(
                                "type",
                                "ARTICLE",
                                "code",
                                "01.01",
                                "libelle",
                                "Béton armé",
                                "unite",
                                "m³",
                                "quantite",
                                new BigDecimal("10"),
                                "prixUnitaire",
                                new BigDecimal("5000"),
                                "total",
                                new BigDecimal("50000"),
                                "depth",
                                1,
                                "indent",
                                "  ")));
        return m;
    }

    private static Map<String, Object> sampleSynthese() {
        Map<String, Object> m = new HashMap<>();
        m.put("code", "ETU-SAMPLE");
        m.put("numero", "ETU-SAMPLE");
        m.put("objet", "Synthèse d'étude — échantillon");
        m.put("status", "BROUILLON");
        m.put("phase", "CHIFFRAGE");
        m.put("bordereauRevision", 1);
        m.put("nombreArticles", 12);
        m.put("anomaliesBloquantes", 0);
        m.put("totalHt", new BigDecimal("50000"));
        Map<String, Object> client = Map.of("name", "Client Exemple SA");
        m.put("client", client);
        m.put("customer", client);
        m.put(
                "lots",
                List.of(Map.of("code", "01", "libelle", "Lot gros œuvre", "total", new BigDecimal("50000"))));
        m.put("gates", List.of(Map.of("etape", 3, "bloquant", true, "passe", true, "nbProblemes", 0, "problemes", List.of())));
        return m;
    }
}
