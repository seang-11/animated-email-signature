export type BlockId = 'logo' | 'name' | 'company' | 'tagline' | 'contacts' | 'socials' | 'banner' | 'cta';
export type ZoneId = 'left' | 'main' | 'bottom';
export type ZonesConfig = Record<ZoneId, BlockId[]>;

export const ZONE_IDS: ZoneId[] = ['left', 'main', 'bottom'];
export const ZONE_LABELS: Record<ZoneId, string> = {
  left: 'Left',
  main: 'Main',
  bottom: 'Bottom',
};

export const ALL_BLOCKS: { id: BlockId; label: string }[] = [
  { id: 'logo', label: 'Logo' },
  { id: 'name', label: 'Name & Title' },
  { id: 'company', label: 'Company' },
  { id: 'tagline', label: 'Tagline' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'socials', label: 'Social Icons' },
  { id: 'banner', label: 'Banner' },
  { id: 'cta', label: 'CTA Button' },
];

const VALID_BLOCKS = new Set<string>(ALL_BLOCKS.map(b => b.id));

export const PRESET_ZONES: Record<string, ZonesConfig> = {
  'Logo Left': {
    left: ['logo'],
    main: ['name', 'company', 'contacts', 'cta', 'socials', 'tagline', 'banner'],
    bottom: [],
  },
  Stacked: {
    left: [],
    main: ['logo', 'name', 'company', 'contacts', 'cta', 'tagline', 'banner', 'socials'],
    bottom: [],
  },
  Compact: {
    left: ['logo'],
    main: ['name', 'company', 'contacts'],
    bottom: [],
  },
};

/**
 * Drops blocks that no longer exist, and folds any blocks saved in the retired
 * "right" zone into main so existing signatures don't silently lose content.
 */
function clean(zones: Record<string, any>): ZonesConfig {
  const out = {} as ZonesConfig;
  for (const z of ZONE_IDS) out[z] = (zones[z] || []).filter((b: string) => VALID_BLOCKS.has(b));
  const retired = (zones.right || []).filter((b: string) => VALID_BLOCKS.has(b) && !out.main.includes(b as BlockId));
  if (retired.length) out.main = [...out.main, ...retired];
  return out;
}

export function getZones(sig: Record<string, any>): ZonesConfig {
  if (sig.layoutZones) {
    try {
      return clean(JSON.parse(sig.layoutZones));
    } catch {
      /* fall through */
    }
  }
  const layout = sig.layout || 'Logo Left';
  return PRESET_ZONES[layout] || PRESET_ZONES['Logo Left'];
}
