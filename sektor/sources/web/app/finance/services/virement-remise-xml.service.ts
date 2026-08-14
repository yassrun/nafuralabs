import { Injectable } from '@angular/core';

import type { BanqueVirementXmlFormat, VirementFournisseurRemiseLine } from '../models';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable({ providedIn: 'root' })
export class VirementRemiseXmlService {
  buildBatch(
    format: BanqueVirementXmlFormat,
    executionDate: string,
    lines: VirementFournisseurRemiseLine[],
  ): string {
    if (format === 'SEPA') return this.buildSepaPain001(executionDate, lines);
    return this.buildMoroccoBankStub(format, executionDate, lines);
  }

  private buildSepaPain001(
    executionDate: string,
    lines: VirementFournisseurRemiseLine[],
  ): string {
    const ctrlSum = lines
      .reduce((s, l) => s + l.montant, 0)
      .toFixed(2);
    const txs = lines
      .map(
        (l) => `
      <CdtTrfTxInf>
        <PmtId><EndToEndId>${escapeXml(l.id)}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="MAD">${l.montant.toFixed(2)}</InstdAmt></Amt>
        <Cdtr><Nm>${escapeXml(l.beneficiaire)}</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>${escapeXml(l.rib.replace(/\s/g, ''))}</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>${escapeXml(l.motif)}</Ustrd></RmtInf>
      </CdtTrfTxInf>`,
      )
      .join('');
    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>NAF-${executionDate}-001</MsgId>
      <CreDtTm>${new Date().toISOString()}</CreDtTm>
      <NbOfTxs>${lines.length}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT-${executionDate}</PmtInfId>
      <ReqdExctnDt>${executionDate}</ReqdExctnDt>
      ${txs}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;
  }

  private buildMoroccoBankStub(
    format: BanqueVirementXmlFormat,
    executionDate: string,
    lines: VirementFournisseurRemiseLine[],
  ): string {
    const body = lines
      .map(
        (l) =>
          `  <Virement ref="${escapeXml(l.id)}" montant="${l.montant.toFixed(2)}" beneficiaire="${escapeXml(l.beneficiaire)}" rib="${escapeXml(l.rib)}" motif="${escapeXml(l.motif)}"/>`,
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<RemiseVirements banque="${format}" dateExecution="${executionDate}" xmlns="https://nafura.ma/mock/virement-batch">
${body}
</RemiseVirements>`;
  }
}
