/** Font definitions for Signature Studio.
 *  Each entry carries its full CSS fallback stack so both the
 *  preview and the exported HTML degrade gracefully. */

export interface FontDef {
  name: string;
  /** CSS font-family stack including the font itself + fallbacks. */
  stack: string;
  group: 'classic' | 'modern' | 'elegant' | 'mono' | 'preview';
  /** Google Fonts import URL — only set for preview-only fonts. */
  googleImport?: string;
}

export const FONT_GROUPS = [
  { key: 'classic' as const, label: 'Classic' },
  { key: 'modern' as const, label: 'Modern' },
  { key: 'elegant' as const, label: 'Elegant' },
  { key: 'mono' as const, label: 'Mono' },
  { key: 'preview' as const, label: '✨ Preview only — falls back in email' },
] as const;

export const FONTS: FontDef[] = [
  // ── Classic ──
  { name: 'Arial', stack: 'Arial, Helvetica, sans-serif', group: 'classic' },
  { name: 'Helvetica', stack: 'Helvetica, Arial, sans-serif', group: 'classic' },
  { name: 'Helvetica Neue', stack: "'Helvetica Neue', Helvetica, Arial, sans-serif", group: 'classic' },
  { name: 'Times New Roman', stack: "'Times New Roman', Times, serif", group: 'classic' },
  { name: 'Georgia', stack: 'Georgia, Times, serif', group: 'classic' },
  { name: 'Verdana', stack: 'Verdana, Geneva, sans-serif', group: 'classic' },

  // ── Modern ──
  { name: 'Trebuchet MS', stack: "'Trebuchet MS', Helvetica, sans-serif", group: 'modern' },
  { name: 'Tahoma', stack: 'Tahoma, Geneva, sans-serif', group: 'modern' },
  { name: 'Segoe UI', stack: "'Segoe UI', Tahoma, Geneva, sans-serif", group: 'modern' },
  { name: 'Century Gothic', stack: "'Century Gothic', CenturyGothic, AppleGothic, sans-serif", group: 'modern' },
  { name: 'Lucida Sans', stack: "'Lucida Sans', 'Lucida Grande', 'Lucida Sans Unicode', Geneva, sans-serif", group: 'modern' },
  { name: 'Impact', stack: "Impact, 'Arial Black', sans-serif", group: 'modern' },

  // ── Elegant ──
  { name: 'Palatino', stack: "'Palatino Linotype', Palatino, 'Book Antiqua', serif", group: 'elegant' },
  { name: 'Garamond', stack: 'Garamond, Baskerville, serif', group: 'elegant' },
  { name: 'Brush Script MT', stack: "'Brush Script MT', cursive", group: 'elegant' },

  // ── Mono ──
  { name: 'Courier New', stack: "'Courier New', Courier, monospace", group: 'mono' },

  // ── Preview-only (Google Fonts) ──
  { name: 'Inter', stack: "Inter, 'Segoe UI', Arial, sans-serif", group: 'preview', googleImport: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' },
  { name: 'Outfit', stack: "Outfit, 'Segoe UI', Arial, sans-serif", group: 'preview', googleImport: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap' },
  { name: 'Plus Jakarta Sans', stack: "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif", group: 'preview', googleImport: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap' },
  { name: 'Playfair Display', stack: "'Playfair Display', Georgia, serif", group: 'preview', googleImport: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap' },
  { name: 'Lora', stack: "Lora, Georgia, serif", group: 'preview', googleImport: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap' },
];

/** Look up a font's full CSS stack by name. Falls back to Arial. */
export function fontStack(name: string): string {
  return FONTS.find(f => f.name === name)?.stack || 'Arial, Helvetica, sans-serif';
}

/** Whether this font is preview-only (Google Font). */
export function isPreviewOnly(name: string): boolean {
  return !!FONTS.find(f => f.name === name)?.googleImport;
}
