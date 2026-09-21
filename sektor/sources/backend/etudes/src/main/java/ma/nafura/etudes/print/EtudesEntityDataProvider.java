package ma.nafura.etudes.print;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DossierEtudeSyntheseDto;
import ma.nafura.etudes.api.dto.DpgfLotTotalDto;
import ma.nafura.etudes.domain.devis.Devis;
import ma.nafura.etudes.domain.devis.DevisLigne;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dpgf.Dpgf;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.planning.DossierPlanningActivite;
import ma.nafura.etudes.domain.planning.DossierPlanningRessource;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.DevisService;
import ma.nafura.etudes.service.DossierEtudeService;
import ma.nafura.etudes.service.DossierPlanningService;
import ma.nafura.etudes.service.DpgfService;
import ma.nafura.etudes.service.gate.ResultatGate;
import ma.nafura.platform.collaboration.docmanager.template.AmountInWords;
import ma.nafura.platform.collaboration.docmanager.template.EntityDataProvider;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Component;

/**
 * Supplies Thymeleaf variables for Sektor étude print templates.
 */
@Component
public class EtudesEntityDataProvider implements EntityDataProvider {

    private static final BigDecimal CENT = new BigDecimal("100");

    private final DevisService devisService;
    private final DossierEtudeService dossierEtudeService;
    private final DossierEtudeRepository dossierRepository;
    private final DpgfService dpgfService;
    private final DossierPlanningService planningService;

    public EtudesEntityDataProvider(
            DevisService devisService,
            DossierEtudeService dossierEtudeService,
            DossierEtudeRepository dossierRepository,
            DpgfService dpgfService,
            DossierPlanningService planningService) {
        this.devisService = devisService;
        this.dossierEtudeService = dossierEtudeService;
        this.dossierRepository = dossierRepository;
        this.dpgfService = dpgfService;
        this.planningService = planningService;
    }

    @Override
    public boolean supports(String entityType) {
        return EtudesPrintEntityTypes.DEVIS.equals(entityType)
                || EtudesPrintEntityTypes.DOSSIER_BORDEREAU.equals(entityType)
                || EtudesPrintEntityTypes.DOSSIER_SYNTHESE.equals(entityType)
                || EtudesPrintEntityTypes.DOSSIER_PLANNING.equals(entityType)
                || EtudesPrintEntityTypes.DOSSIER_RESSOURCES.equals(entityType);
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
            case EtudesPrintEntityTypes.DOSSIER_PLANNING -> mapPlanning(entityId);
            case EtudesPrintEntityTypes.DOSSIER_RESSOURCES -> mapRessources(entityId);
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
            case EtudesPrintEntityTypes.DOSSIER_PLANNING -> samplePlanning();
            case EtudesPrintEntityTypes.DOSSIER_RESSOURCES -> sampleRessources();
            default -> Map.of();
        };
    }

    @Override
    public Optional<Object> getDocument(String entityType, UUID entityId) {
        if (!EtudesPrintEntityTypes.DEVIS.equals(entityType) || entityId == null) {
            // Bordereau and synthèse are study internals, not counterparty documents:
            // they have no client block and no legal totals to normalise.
            return Optional.empty();
        }
        return Optional.of(toPrintDocument(devisService.getById(entityId)));
    }

    @Override
    public Optional<Object> getSampleDocument(String entityType) {
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
            m.put("totalTtcEnLettres", AmountInWords.spellDirhams(BigDecimal.ZERO));
            return m;
        }
        Dpgf dpgf = dpgfService.getById(dossier.getDpgfId());
        m.put("dpgfNumero", dpgf.getNumero());
        m.put("tvaTaux", dpgf.getTvaTaux());
        m.put("totalHt", dpgf.getTotalHt());
        m.put("totalTva", dpgf.getTotalTva());
        m.put("totalTtc", dpgf.getTotalTtc());
        m.put("totalTtcEnLettres", AmountInWords.spellDirhams(dpgf.getTotalTtc()));
        List<Map<String, Object>> lignes = new ArrayList<>();
        flattenNoeuds(
                dpgf.getHierarchie() != null ? dpgf.getHierarchie() : List.of(),
                0,
                dpgf.getTvaTaux(),
                lignes);
        m.put("lignes", lignes);
        return m;
    }

    private Map<String, Object> mapPlanning(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        Map<String, Object> m = baseDossier(dossier);
        List<DossierPlanningActivite> rows = planningService.listerActivites(dossierId);
        List<Map<String, Object>> activites = new ArrayList<>();
        LocalDate debut = null;
        LocalDate fin = null;
        for (DossierPlanningActivite row : rows) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("libelle", row.getLibelle());
            a.put("lotLibelle", row.getLotLibelle());
            a.put("dateDebut", row.getDateDebut());
            a.put("dateFin", row.getDateFin());
            a.put("dureeJours", dureeInclusive(row.getDateDebut(), row.getDateFin()));
            activites.add(a);
            if (row.getDateDebut() != null && (debut == null || row.getDateDebut().isBefore(debut))) {
                debut = row.getDateDebut();
            }
            if (row.getDateFin() != null && (fin == null || row.getDateFin().isAfter(fin))) {
                fin = row.getDateFin();
            }
        }
        m.put("activites", activites);
        m.put("dateDebut", debut);
        m.put("dateFin", fin);
        m.put("dureeJours", dureeInclusive(debut, fin));
        return m;
    }

    private Map<String, Object> mapRessources(UUID dossierId) {
        DossierEtude dossier = requireDossier(dossierId);
        Map<String, Object> m = baseDossier(dossier);
        List<Map<String, Object>> humaines = new ArrayList<>();
        List<Map<String, Object>> materiel = new ArrayList<>();
        for (DossierPlanningRessource row : planningService.listerRessources(dossierId)) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("type", row.getType());
            r.put("libelle", row.getLibelle());
            r.put("quantite", row.getQuantite());
            r.put("unite", row.getUnite());
            r.put("notes", row.getNotes());
            if (DossierPlanningRessource.TYPE_MATERIEL.equals(row.getType())) {
                materiel.add(r);
            } else {
                humaines.add(r);
            }
        }
        m.put("humaines", humaines);
        m.put("materiel", materiel);
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

    private void flattenNoeuds(
            List<DpgfNoeud> nodes, int depth, BigDecimal tvaTaux, List<Map<String, Object>> out) {
        if (nodes == null) {
            return;
        }
        for (DpgfNoeud n : nodes) {
            BigDecimal prixHt = n.getPrixUnitaire();
            BigDecimal totalHt = n.getTotal();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("type", n.getType());
            row.put("code", n.getCode());
            row.put("libelle", n.getLibelle());
            row.put("unite", n.getUnite());
            row.put("quantite", n.getQuantite());
            row.put("prixUnitaire", prixHt);
            row.put("prixUnitaireHt", prixHt);
            row.put("prixUnitaireTtc", ttc(prixHt, tvaTaux));
            row.put("total", totalHt);
            row.put("totalHt", totalHt);
            row.put("totalTtc", ttc(totalHt, tvaTaux));
            row.put("depth", depth);
            row.put("indent", "  ".repeat(Math.max(0, depth)));
            out.add(row);
            flattenNoeuds(n.getEnfants(), depth + 1, tvaTaux, out);
        }
    }

    private static BigDecimal ttc(BigDecimal ht, BigDecimal tvaTaux) {
        if (ht == null || tvaTaux == null) {
            return null;
        }
        BigDecimal coef = BigDecimal.ONE.add(tvaTaux.divide(CENT, 8, RoundingMode.HALF_UP));
        return ht.multiply(coef).setScale(2, RoundingMode.HALF_UP);
    }

    private static Long dureeInclusive(LocalDate debut, LocalDate fin) {
        if (debut == null || fin == null || fin.isBefore(debut)) {
            return null;
        }
        return ChronoUnit.DAYS.between(debut, fin) + 1;
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
        m.put("objet", "BDP chiffré — échantillon");
        m.put("bordereauRevision", 1);
        m.put("tvaTaux", new BigDecimal("20"));
        m.put("totalHt", new BigDecimal("50000.00"));
        m.put("totalTva", new BigDecimal("10000.00"));
        m.put("totalTtc", new BigDecimal("60000.00"));
        m.put("totalTtcEnLettres", AmountInWords.spellDirhams(new BigDecimal("60000.00")));
        Map<String, Object> client = Map.of("name", "Client Exemple SA");
        m.put("client", client);
        m.put("customer", client);
        Map<String, Object> lot = new LinkedHashMap<>();
        lot.put("type", "LOT");
        lot.put("code", "01");
        lot.put("libelle", "Lot gros œuvre");
        lot.put("unite", null);
        lot.put("quantite", null);
        lot.put("prixUnitaireHt", null);
        lot.put("prixUnitaireTtc", null);
        lot.put("depth", 0);
        lot.put("indent", "");
        lot.put("totalHt", new BigDecimal("50000.00"));
        lot.put("totalTtc", new BigDecimal("60000.00"));
        Map<String, Object> article = new LinkedHashMap<>();
        article.put("type", "ARTICLE");
        article.put("code", "01.01");
        article.put("libelle", "Béton armé");
        article.put("unite", "m³");
        article.put("quantite", new BigDecimal("10"));
        article.put("prixUnitaireHt", new BigDecimal("5000.00"));
        article.put("totalHt", new BigDecimal("50000.00"));
        article.put("prixUnitaireTtc", new BigDecimal("6000.00"));
        article.put("totalTtc", new BigDecimal("60000.00"));
        article.put("depth", 1);
        article.put("indent", "  ");
        m.put("lignes", List.of(lot, article));
        return m;
    }

    private static Map<String, Object> samplePlanning() {
        Map<String, Object> m = new HashMap<>();
        m.put("code", "ETU-SAMPLE");
        m.put("numero", "ETU-SAMPLE");
        m.put("objet", "Planning prévisionnel — échantillon");
        Map<String, Object> client = Map.of("name", "Client Exemple SA");
        m.put("client", client);
        m.put("customer", client);
        LocalDate debut = LocalDate.of(2026, 10, 1);
        LocalDate fin = LocalDate.of(2026, 11, 20);
        m.put("dateDebut", debut);
        m.put("dateFin", fin);
        m.put("dureeJours", dureeInclusive(debut, fin));
        m.put(
                "activites",
                List.of(
                        Map.of(
                                "libelle",
                                "Installation de chantier",
                                "lotLibelle",
                                "—",
                                "dateDebut",
                                debut,
                                "dateFin",
                                LocalDate.of(2026, 10, 8),
                                "dureeJours",
                                8L),
                        Map.of(
                                "libelle",
                                "Gros œuvre RDC",
                                "lotLibelle",
                                "01 — Lot gros œuvre",
                                "dateDebut",
                                LocalDate.of(2026, 10, 9),
                                "dateFin",
                                fin,
                                "dureeJours",
                                43L)));
        return m;
    }

    private static Map<String, Object> sampleRessources() {
        Map<String, Object> m = new HashMap<>();
        m.put("code", "ETU-SAMPLE");
        m.put("numero", "ETU-SAMPLE");
        m.put("objet", "Ressources prévues — échantillon");
        Map<String, Object> client = Map.of("name", "Client Exemple SA");
        m.put("client", client);
        m.put("customer", client);
        m.put(
                "humaines",
                List.of(
                        Map.of("libelle", "Ingénieur", "quantite", new BigDecimal("1"), "unite", "u", "notes", ""),
                        Map.of(
                                "libelle",
                                "Technicien",
                                "quantite",
                                new BigDecimal("2"),
                                "unite",
                                "u",
                                "notes",
                                "")));
        m.put(
                "materiel",
                List.of(Map.of(
                        "libelle", "Grue à tour", "quantite", new BigDecimal("1"), "unite", "u", "notes", "")));
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
        m.put("devisNumero", "DEV-SAMPLE");
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
