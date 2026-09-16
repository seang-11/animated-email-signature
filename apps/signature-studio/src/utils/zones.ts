export type BlockId = 'logo' | 'name' | 'company' | 'tagline' | 'contacts' | 'socials' | 'banner' | 'cta' | 'disclaimer' | 'divider';
export type ZoneId = 'left' | 'main' | 'right' | 'bottom';
export type ZonesConfig = Record<ZoneId, BlockId[]>;

export const ZONE_IDS: ZoneId[] = ['left', 'main', 'right', 'bottom'];
export const ZONE_LABELS: Record<ZoneId, string> = {
  left: 'Left',
  main: 'Main',
  right: 'Right',
  bottom: 'Bottom',
};

export const ALL_BLOCKS: { id: BlockId; label: string }[] = [
  { id: 'logo', label: 'Logo' },
  { id: 'name', label: 'Name & Title' },
  { id: 'company', label: 'Company' },
  { id: 'tagline', label: 'Tagline' },
  { id: 'divider', label: 'Divider' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'socials', label: 'Social Icons' },
  { id: 'banner', label: 'Banner' },
  { id: 'cta', label: 'CTA Button' },
  { id: 'disclaimer', label: 'Disclaimer' },
];

export const PRESET_ZONES: Record<string, ZonesConfig> = {
  'Logo Left': {
    left: ['logo'],
    main: ['name', 'company', 'divider', 'contacts', 'cta', 'socials'],
    right: ['banner', 'tagline'],
    bottom: ['disclaimer'],
  },
  Stacked: {
    left: [],
    main: ['logo', 'name', 'company', 'divider', 'contacts', 'cta', 'tagline', 'banner', 'socials'],
    right: [],
    bottom: ['disclaimer'],
  },
  Compact: {
    left: ['logo'],
    main: ['name', 'company', 'contacts'],
    right: [],
    bottom: ['disclaimer'],
  },
};

export function getZones(sig: Record<string, any>): ZonesConfig {
  if (sig.layoutZones) {
    try {
      return JSON.parse(sig.layoutZones);
    } catch {
      /* fall through */
    }
  }
  const layout = sig.layout || 'Logo Left';
  return PRESET_ZONES[layout] || PRESET_ZONES['Logo Left'];
}
