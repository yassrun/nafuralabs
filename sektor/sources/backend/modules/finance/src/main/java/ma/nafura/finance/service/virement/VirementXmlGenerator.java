package ma.nafura.finance.service.virement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import ma.nafura.finance.domain.model.VirementLine;
import org.springframework.stereotype.Component;

@Component
public class VirementXmlGenerator {

    public String generate(String bankCode, LocalDate executionDate, List<VirementLine> lines) {
        if ("SEPA".equalsIgnoreCase(bankCode)) {
            return buildSepa(executionDate, lines);
        }
        return buildMoroccoStub(bankCode, executionDate, lines);
    }

    private String buildSepa(LocalDate executionDate, List<VirementLine> lines) {
        BigDecimal ctrlSum = lines.stream().map(VirementLine::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        StringBuilder txs = new StringBuilder();
        for (VirementLine line : lines) {
            txs.append(
                    """
                      <CdtTrfTxInf>
                        <PmtId><EndToEndId>%s</EndToEndId></PmtId>
                        <Amt><InstdAmt Ccy="MAD">%s</InstdAmt></Amt>
                        <Cdtr><Nm>%s</Nm></Cdtr>
                        <CdtrAcct><Id><IBAN>%s</IBAN></Id></CdtrAcct>
                        <RmtInf><Ustrd>%s</Ustrd></RmtInf>
                      </CdtTrfTxInf>"""
                            .formatted(
                                    escape(line.getId().toString()),
                                    line.getAmount().setScale(2),
                                    escape(line.getBeneficiaryName()),
                                    escape(line.getBeneficiaryRib().replace(" ", "")),
                                    escape(line.getMotif())));
        }
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
                  <CstmrCdtTrfInitn>
                    <GrpHdr>
                      <MsgId>NAF-%s-001</MsgId>
                      <NbOfTxs>%d</NbOfTxs>
                      <CtrlSum>%s</CtrlSum>
                    </GrpHdr>
                    <PmtInf>
                      <PmtInfId>PMT-%s</PmtInfId>
                      <ReqdExctnDt>%s</ReqdExctnDt>
                %s
                    </PmtInf>
                  </CstmrCdtTrfInitn>
                </Document>"""
                .formatted(
                        executionDate,
                        lines.size(),
                        ctrlSum.setScale(2),
                        executionDate,
                        executionDate,
                        txs);
    }

    private String buildMoroccoStub(String bankCode, LocalDate executionDate, List<VirementLine> lines) {
        StringBuilder body = new StringBuilder();
        for (VirementLine line : lines) {
            body.append(
                    "  <Virement ref=\"%s\" montant=\"%s\" beneficiaire=\"%s\" rib=\"%s\" motif=\"%s\"/>\n"
                            .formatted(
                                    escape(line.getId().toString()),
                                    line.getAmount().setScale(2),
                                    escape(line.getBeneficiaryName()),
                                    escape(line.getBeneficiaryRib()),
                                    escape(line.getMotif())));
        }
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <RemiseVirements banque="%s" dateExecution="%s" xmlns="https://nafura.ma/mock/virement-batch">
                %s</RemiseVirements>"""
                .formatted(escape(bankCode), executionDate, body);
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
