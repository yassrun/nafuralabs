/** Standard BTP units used in chantier lots and postes budgetaires. */
export const BPU_UNITS = ['m3', 'm2', 'ml', 'U', 'ff', 'kg', 't', 'h', 'j'] as const;

export type BpuUnit = (typeof BPU_UNITS)[number];
