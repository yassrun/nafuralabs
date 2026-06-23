export interface PaymentTermInstallmentInputDto {
  lineOrder: number;
  percentage: number;
  daysOffset: number;
  description?: string;
}
