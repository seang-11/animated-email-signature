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

/** Zones flattened into one top-to-bottom list, each block tagged with its zone. */
export function flattenZones(zones: ZonesConfig): { id: BlockId; zone: ZoneId }[] {
  const flat: { id: BlockId; zone: ZoneId }[] = [];
  for (const zone of ZONE_IDS) for (const id of zones[zone]) flat.push({ id, zone });
  return flat;
}

/** Rebuilds a zones config from a flat, ordered list. */
export function rebuildZones(flat: { id: BlockId; zone: ZoneId }[]): ZonesConfig {
  const out = { left: [], main: [], bottom: [] } as ZonesConfig;
  for (const { id, zone } of flat) out[zone].push(id);
  return out;
}

/**
 * Moves `activeId` to where `overId` sits in the flattened order. The moved block
 * adopts the zone of whatever now sits above it (or below it, at the very top),
 * so dragging a block next to the logo puts it in the logo's column.
 */
export function moveBlock(zones: ZonesConfig, activeId: BlockId, overId: BlockId): ZonesConfig {
  const flat = flattenZones(zones);
  const from = flat.findIndex(f => f.id === activeId);
  const to = flat.findIndex(f => f.id === overId);
  if (from < 0 || to < 0 || from === to) return zones;
  const moved = flat[from];
  const next = [...flat];
  next.splice(from, 1);
  next.splice(to, 0, moved);
  const idx = next.findIndex(f => f.id === activeId);
  const neighbour = idx > 0 ? next[idx - 1] : next[idx + 1];
  next[idx] = { id: activeId, zone: neighbour ? neighbour.zone : moved.zone };
  return rebuildZones(next);
}
