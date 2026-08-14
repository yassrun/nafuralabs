package ma.nafura.ventes.print;

import ma.nafura.platform.collaboration.docmanager.template.AmountInWords;
import ma.nafura.platform.collaboration.docmanager.template.EntityDataProvider;
import ma.nafura.platform.collaboration.docmanager.template.PrintDocument;
import ma.nafura.platform.collaboration.docmanager.template.SampleRecord;
import ma.nafura.ventes.domain.facture.FactureClient;
import ma.nafura.ventes.domain.facture.FactureClientLigne;
import ma.nafura.ventes.service.FactureClientService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Supplies print variables for client invoices.
 *
 * <p>Written entirely against the platform SPIs: adding this document type required no change to
 * the platform, which is the point of the {@code document.*} contract.
 */
@Component
public class VentesEntityDataProvider implements EntityDataProvider {

    private final FactureClientService factureService;

    public VentesEntityDataProvider(FactureClientService factureService) {
        this.factureService = factureService;
    }

    @Override
    public boolean supports(String entityType) {
        return VentesPrintEntityTypes.FACTURE_CLIENT.equals(entityType);
    }

    @Override
    public Map<String, Object> getEntityData(String entityType, UUID entityId) {
        if (!supports(entityType) || entityId == null) {
            return Map.of();
        }
        return toMap(factureService.getById(entityId));
    }

    @Override
    public Map<String, Object> getSampleEntityData(String entityType) {
        return supports(entityType) ? toMap(sampleFacture()) : Map.of();
    }

    @Override
    public Optional<PrintDocument> getDocument(String entityType, UUID entityId) {
        if (!supports(entityType) || entityId == null) {
            return Optional.empty();
        }
        return Optional.of(toPrintDocument(factureService.getById(entityId)));
    }

    @Override
    public Optional<PrintDocument> getSampleDocument(String entityType) {
        return supports(entityType) ? Optional.of(toPrintDocument(sampleFacture())) : Optional.empty();
    }

    @Override
    public List<SampleRecord> searchRecords(String entityType, String query, int limit) {
        if (!supports(entityType)) {
            return List.of();
        }
        return factureService.list(null, null, query != null && !query.isBlank() ? query : null).stream()
                .limit(Math.max(1, limit))
                .map(f -> new SampleRecord(f.getId(), label(f)))
                .toList();
    }

    private static String label(FactureClient f) {
        String client = f.getClientName() != null ? f.getClientName() : "";
        return f.getNumero() + (client.isBlank() ? "" : " — " + client);
    }

    private static PrintDocument toPrintDocument(FactureClient facture) {
        List<PrintDocument.Line> lignes = new ArrayList<>();
        if (facture.getLignes() != null) {
            for (FactureClientLigne l : facture.getLignes()) {
                lignes.add(new PrintDocument.Line(
                        null,
                        l.getDesignation(),
                        l.getUnite(),
                        l.getQuantite(),
                        l.getPrixUnitaireHt(),
                        l.getTotalHt(),
                        facture.getTvaTaux()));
            }
        }

        // The payable total already carries retenue de garantie and advance resorption; it is
        // what the client owes, so it is what the spelled-out amount must state.
        BigDecimal ttc = facture.getNetAPayerTtc() != null
                ? facture.getNetAPayerTtc()
                : facture.getTotalHt();

        Map<String, Object> extra = new LinkedHashMap<>();
        putIfPresent(extra, "retenueGarantieTaux", facture.getRetenueGarantieTaux());
        putIfPresent(extra, "retenueGarantieMontant", facture.getRetenueGarantieMontant());
        putIfPresent(extra, "resorptionAvanceMontant", facture.getResorptionAvanceMontant());
        putIfPresent(extra, "netAPayerHt", facture.getNetAPayerHt());
        putIfPresent(extra, "rasTaux", facture.getRasTaux());
        putIfPresent(extra, "rasMontant", facture.getRasMontant());
        putIfPresent(extra, "marchePublic", facture.getMarchePublic());
        putIfPresent(extra, "modePaiement", facture.getModePaiement());
        putIfPresent(extra, "chantierCode", facture.getChantierCode());

        return PrintDocument.builder()
                .type(VentesPrintEntityTypes.FACTURE_CLIENT)
                .libelleType("Facture")
                .numero(facture.getNumero())
                .date(facture.getDateEmission())
                .dateEcheance(facture.getDateEcheance())
                .reference(facture.getChantierCode())
                .objet(facture.getNotes())
                .statut(facture.getStatus())
                .client(new PrintDocument.Party(
                        facture.getClientName(), null, null, null, null, null, null))
                .lignes(lignes)
                .totaux(new PrintDocument.Totals(
                        facture.getTotalHt(),
                        facture.getTotalTva(),
                        ttc,
                        facture.getTvaTaux(),
                        null,
                        AmountInWords.spellDirhams(ttc)))
                .mentions(facture.getModePaiement())
                .extra(extra)
                .build();
    }

    private static void putIfPresent(Map<String, Object> target, String key, Object value) {
        if (value != null) {
            target.put(key, value);
        }
    }

    /** Legacy flat view, kept so templates written against entity.* keep working. */
    private static Map<String, Object> toMap(FactureClient facture) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", facture.getId() != null ? facture.getId().toString() : null);
        m.put("numero", facture.getNumero());
        m.put("code", facture.getNumero());
        m.put("type", facture.getType());
        m.put("dateEmission", facture.getDateEmission());
        m.put("dateEcheance", facture.getDateEcheance());
        m.put("modePaiement", facture.getModePaiement());
        m.put("status", facture.getStatus());
        m.put("notes", facture.getNotes());
        m.put("chantierCode", facture.getChantierCode());
        m.put("totalHt", facture.getTotalHt());
        m.put("tvaTaux", facture.getTvaTaux());
        m.put("totalTva", facture.getTotalTva());
        m.put("netAPayerHt", facture.getNetAPayerHt());
        m.put("netAPayerTtc", facture.getNetAPayerTtc());
        m.put("retenueGarantieTaux", facture.getRetenueGarantieTaux());
        m.put("retenueGarantieMontant", facture.getRetenueGarantieMontant());
        m.put("resorptionAvanceMontant", facture.getResorptionAvanceMontant());
        m.put("rasTaux", facture.getRasTaux());
        m.put("rasMontant", facture.getRasMontant());
        m.put("marchePublic", facture.getMarchePublic());

        Map<String, Object> client = new LinkedHashMap<>();
        client.put("id", facture.getClientId());
        client.put("name", facture.getClientName());
        m.put("client", client);

        List<Map<String, Object>> lignes = new ArrayList<>();
        if (facture.getLignes() != null) {
            for (FactureClientLigne l : facture.getLignes()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("ordre", l.getOrdre());
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

    private static FactureClient sampleFacture() {
        FactureClient f = new FactureClient();
        f.setNumero("FAC-2026-001");
        f.setType("SITUATION");
        f.setClientName("Client Exemple SA");
        f.setChantierCode("CH-2026-004");
        f.setDateEmission(LocalDate.now());
        f.setDateEcheance(LocalDate.now().plusDays(30));
        f.setModePaiement("Virement à 30 jours — échantillon");
        f.setStatus("BROUILLON");
        f.setTotalHt(new BigDecimal("250000.00"));
        f.setTvaTaux(new BigDecimal("20"));
        f.setTotalTva(new BigDecimal("50000.00"));
        f.setRetenueGarantieTaux(new BigDecimal("7"));
        f.setRetenueGarantieMontant(new BigDecimal("17500.00"));
        f.setNetAPayerHt(new BigDecimal("232500.00"));
        f.setNetAPayerTtc(new BigDecimal("279000.00"));
        f.setMarchePublic(Boolean.FALSE);

        FactureClientLigne ligne = new FactureClientLigne();
        ligne.setOrdre(1);
        ligne.setDesignation("Gros œuvre — situation n° 3");
        ligne.setUnite("ens");
        ligne.setQuantite(new BigDecimal("1"));
        ligne.setPrixUnitaireHt(new BigDecimal("250000.00"));
        ligne.setTotalHt(new BigDecimal("250000.00"));
        f.setLignes(new ArrayList<>(List.of(ligne)));
        return f;
    }
}
