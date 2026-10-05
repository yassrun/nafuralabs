export const PREFERENCE_CHANNELS = ['in_app', 'email'] as const;
export type PreferenceChannel = (typeof PREFERENCE_CHANNELS)[number];
export type PreferenceLayer = 'user' | 'organisation';

export interface PreferenceRow {
  readonly event: string;
  readonly label: string;
  readonly mandatory: boolean;
  readonly organisation: readonly string[];
  readonly channels: readonly string[];
}

export function channelEnabled(row: PreferenceRow, channel: PreferenceChannel): boolean {
  return row.channels.includes(channel);
}

/** User cannot add a channel the organisation dropped, nor change a mandatory event. */
export function channelLocked(row: PreferenceRow, layer: PreferenceLayer, channel: PreferenceChannel): boolean {
  if (layer === 'organisation') return false;
  return row.mandatory || !row.organisation.includes(channel);
}
