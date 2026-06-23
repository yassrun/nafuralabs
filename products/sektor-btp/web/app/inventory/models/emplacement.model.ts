export interface Emplacement {
  id: string;
  depotId: string;
  code: string;
  designation?: string;
  capaciteVolume?: number;
  emplacementDefaut?: boolean;
}
