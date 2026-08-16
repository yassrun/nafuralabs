package ma.nafura.ventes.print;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import ma.nafura.platform.collaboration.docmanager.config.ThymeleafTemplateConfig;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.ventes.domain.facture.FactureClient;
import ma.nafura.ventes.domain.facture.FactureClientLigne;
import ma.nafura.ventes.service.FactureClientService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ClassPathResource;
import org.thymeleaf.context.Context;

/**
 * CH-02 AC-5 — non-régression produit : Sektor imprime encore une facture client.
 * Tenant qa-local + id choisi. Pas un e2e platform.
 */
@ExtendWith(MockitoExtension.class)
class VentesFacturePrintAc5Test {

    /** Tenant Sektor choisi (convention tests qa-local). */
    static final UUID TENANT_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    /** Facture client imprimable — id choisi par l'exec. */
    static final UUID FACTURE_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Mock
    private FactureClientService factureService;

    @AfterEach
    void clearTenant() {
        TenantContext.clear();
    }

    @Test
    void imprimeFactureClient() throws Exception {
        TenantContext.setTenantId(TENANT_ID);
        FactureClient facture = factureImprimable();
        when(factureService.getById(FACTURE_ID)).thenReturn(facture);

        VentesEntityDataProvider provider = new VentesEntityDataProvider(factureService);
        PrintDocument document = (PrintDocument) provider
                .getDocument(VentesPrintEntityTypes.FACTURE_CLIENT, FACTURE_ID)
                .orElseThrow();
        Map<String, Object> entity = provider.getEntityData(VentesPrintEntityTypes.FACTURE_CLIENT, FACTURE_ID);

        String template = new String(
                new ClassPathResource("print-templates/facture-client-a4.html").getInputStream().readAllBytes(),
                StandardCharsets.UTF_8);
        Context ctx = new Context(Locale.FRANCE);
        ctx.setVariable("entity", entity);
        ctx.setVariable("document", document);
        ctx.setVariable("fragments", Map.of("HEADER_DEFAULT", "", "FOOTER_DEFAULT", ""));
        String html = new ThymeleafTemplateConfig().stringTemplateEngine().process(template, ctx);

        byte[] pdf = htmlToPdf(html, facture.getNumero(), FACTURE_ID, TENANT_ID);

        System.out.printf(
                "AC-5 tenant=%s factureId=%s numero=%s pdfMagic=%s bytes=%d%n",
                TENANT_ID,
                FACTURE_ID,
                facture.getNumero(),
                new String(pdf, 0, 4, StandardCharsets.US_ASCII),
                pdf.length);

        assertTrue(html.contains("FAC-2026-001"), html);
        assertTrue(html.contains("Client Exemple SA"), html);
        assertTrue(document.totaux() != null && document.totaux().enLettres() != null);
        assertTrue(html.contains(document.totaux().enLettres()), html);
        assertTrue(new String(pdf, 0, 5, StandardCharsets.US_ASCII).startsWith("%PDF"));
    }

    private static FactureClient factureImprimable() {
        FactureClient f = new FactureClient();
        f.setId(FACTURE_ID);
        f.setNumero("FAC-2026-001");
        f.setType("SITUATION");
        f.setClientName("Client Exemple SA");
        f.setChantierCode("CH-2026-004");
        f.setDateEmission(LocalDate.of(2026, 8, 16));
        f.setDateEcheance(LocalDate.of(2026, 9, 15));
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

    /** PDF 1.4 minimal — Gotenberg (ops) n'est pas requis pour cette preuve module. */
    private static byte[] htmlToPdf(String html, String numero, UUID factureId, UUID tenantId) {
        String text = ("Facture " + numero + " id=" + factureId + " tenant=" + tenantId + " " + html)
                .replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)");
        if (text.length() > 1200) {
            text = text.substring(0, 1200);
        }
        String stream = "BT /F1 10 Tf 40 800 Td (" + text + ") Tj ET\n";
        String objects =
                "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
                        + "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
                        + "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
                        + "/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
                        + "4 0 obj << /Length "
                        + stream.length()
                        + " >> stream\n"
                        + stream
                        + "endstream endobj\n"
                        + "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n";
        String body = objects;
        int xrefAt = ("%PDF-1.4\n" + body).length();
        StringBuilder xref = new StringBuilder("xref\n0 6\n0000000000 65535 f \n");
        int cursor = 9;
        for (int i = 1; i <= 5; i++) {
            xref.append(String.format("%010d 00000 n \n", cursor));
            int next = body.indexOf("endobj\n", cursor - 9);
            cursor = next < 0 ? cursor : next + 7 + 9;
        }
        String pdf = "%PDF-1.4\n"
                + body
                + xref
                + "trailer << /Size 6 /Root 1 0 R >>\nstartxref\n"
                + xrefAt
                + "\n%%EOF\n";
        return pdf.getBytes(StandardCharsets.US_ASCII);
    }
}
