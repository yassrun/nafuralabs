export type AttachementStatus = 'BROUILLON' | 'SIGNE_MOE' | 'CONTRESIGNE_MOA' | 'CONTESTE';
export type MeteoCode = 'SOLEIL' | 'NUAGEUX' | 'PLUIE' | 'VENT';

export interface AttachementLigne {
  posteCode: string;
  designation: string;
  quantiteExecutee: number;
  unite: string;
  zone?: string;
}

export interface Attachement {
  id: string;
  numero: string;
  chantierId: string;
  chantierCode: string;
  date: string;
  meteoCode?: MeteoCode;
  temperatureC?: number;
  effectifPresent: number;
  lignes: AttachementLigne[];
  status: AttachementStatus;
  signatureMoeDataUrl?: string;
}
